from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import re
import unicodedata
import io

app = FastAPI()

# =========================
# 1) CORS (para o front conseguir chamar sua API)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # aceita qualquer origem (ok para dev)
    allow_credentials=False,      # com "*" o mais seguro é False
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 2) Normalização de texto (remove acento e coloca em maiúsculo)
# =========================
def normalizar_texto(texto: str) -> str:
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", texto)  # separa acento das letras (Á -> A + ´)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).upper().strip()
    # remove os acentos (o "combining") e deixa tudo MAIÚSCULO, e tira espaços das pontas

# =========================
# 3) O que conta como “aprovado/aproveitado”
# =========================
STATUS_OK = {"APR", "APRN", "CUMP", "DISP", "TRANS", "INCORP"}

# =========================
# 4) Regex/validadores do formato SIGAA
# =========================
# Período no começo da linha (ex.: "2018.1" ou "--")
RE_PERIODO = re.compile(r"^\s*(\d{4}\.\d|--)\b")

# Token de código “puro” (não é search no texto todo; é validação de token)
# Exemplos aceitos: MAT001, ECOS01A, ADM01E, ECOE01, MAT00N, ELTA00, TELC12A...
# Código “normal” (com número)
RE_CODIGO_COM_NUM = re.compile(r"^[A-Z]{3,6}\d{2,3}[A-Z0-9]?$")

# Código “texto” (sem número): 5 a 15 letras (ex.: ESTSUPER, PROJETOFI)
RE_CODIGO_SO_LETRAS = re.compile(r"^[A-Z]{5,15}$")

# tokens que aparecem na tabela mas não são código
IGNORAR_TOKENS = {"*", "e", "#", "@", "V", "--"}

# palavras em maiúsculo que NÃO podem virar código (cabeçalho/ruído)
BAN_WORDS = {
    "SIGAA", "UNIFEI", "PRG", "CRA", "HISTORICO", "HISTÓRICO", "DADOS",
    "COMPONENTES", "CURRICULARES", "CURSADOS", "CURSANDO", "ANO", "PERIODO",
    "LETIVO", "SITUACAO", "SITUAÇÃO", "LEGENDA", "PAGINA", "PÁGINA", "EMISSAO", "EMISSÃO",
    "ENADE", "MATRICULADO", "MATR"
}

# =========================
# 5) Filtros para ignorar linhas que não são “título” de disciplina
# =========================
def is_linha_professor_ou_carga(s_norm: str) -> bool:
    # pega linhas tipo "Dr. Fulano (64h)" etc.
    return ("DR." in s_norm or "DRA." in s_norm or "MSC." in s_norm or "(" in s_norm or "H)" in s_norm)

def is_linha_lixo(s_norm: str) -> bool:
    # cabeçalho/rodapé e partes que não são disciplina
    return any(k in s_norm for k in [
        "SIGAA", "UNIFEI", "HISTORICO", "HISTÓRICO", "DADOS", "COMPONENTES",
        "ANO/PERIODO", "SITUACAO", "SITUAÇÃO", "LEGENDA",
        "PARA VERIFICAR", "PAGINA", "PÁGINA", "EMISSAO", "EMISSÃO", "EMITIDO EM"
    ])

def parece_titulo(linha: str) -> bool:
    """
    Decide se uma linha parece o “nome da disciplina”.
    No SIGAA, geralmente é uma linha em CAIXA ALTA (ex.: 'CÁLCULO I').
    """
    s = linha.strip()
    if len(s) < 4:
        return False

    s_norm = normalizar_texto(s)

    # ignora cabeçalho/rodapé
    if is_linha_lixo(s_norm):
        return False

    # ignora professor/carga
    if is_linha_professor_ou_carga(s_norm):
        return False

    # ignora linha de tabela (começa com 2018.1 / --)
    if RE_PERIODO.match(s):
        return False

    # precisa ter pelo menos uma letra
    if not re.search(r"[A-ZÀ-Ü]", s):
        return False

    # no seu PDF, títulos vêm em maiúsculo (se vier diferente no seu PDF, dá pra relaxar)
    if s != s.upper():
        return False

    # ignora mensagens soltas que parecem “título” mas não são disciplina
    if "DISPENSADO" in s_norm or "ENADE" in s_norm:
        return False

    return True

# =========================
# 6) Extrair (status, codigo) de uma linha da tabela
# =========================
def extrair_status_e_codigo(linha: str):
    if not RE_PERIODO.match(linha):
        return None

    tokens = linha.split()
    if len(tokens) < 3:
        return None

    status = tokens[-1].strip().upper()
    if status not in STATUS_OK:
        return None

    periodo = tokens[0].strip()

    melhor_codigo_num = None
    melhor_codigo_letras = None
    tem_arroba = "@" in tokens

    for t in tokens[1:-1]:
        tt = t.strip().upper()
        if not tt or tt in IGNORAR_TOKENS:
            continue
        if tt in BAN_WORDS:
            continue

        # 1) Se achar código com número, é o melhor (prioridade total)
        if RE_CODIGO_COM_NUM.match(tt):
            melhor_codigo_num = tt
            break

        # 2) Senão, guarda um candidato só-letras (generalizado)
        if RE_CODIGO_SO_LETRAS.match(tt):
            # evita pegar coisas tipo "APR" ou siglas pequenas
            if tt not in STATUS_OK:
                melhor_codigo_letras = tt

    if melhor_codigo_num:
        return status, melhor_codigo_num

    if melhor_codigo_letras:
        return status, melhor_codigo_letras

    # 3) Fallback para atividades com "@": cria um código sintético estável
    if tem_arroba:
        return status, f"ATIV_{periodo}"

    return None

# =========================
# 7) Quando acha a linha da tabela, busca o título “logo acima”
# =========================
def buscar_titulo_para_codigo(linhas: list[str], idx_linha_codigo: int, max_volta: int = 12):
    """
    Sobe algumas linhas procurando o título:
    - pula cabeçalho/rodapé
    - pula linhas de professor/carga
    - retorna a primeira linha que parece título
    """
    inicio = max(0, idx_linha_codigo - max_volta)
    for j in range(idx_linha_codigo - 1, inicio - 1, -1):
        cand = linhas[j].strip()
        if not cand:
            continue

        cand_norm = normalizar_texto(cand)
        if is_linha_lixo(cand_norm):
            continue
        if is_linha_professor_ou_carga(cand_norm):
            continue

        if parece_titulo(cand):
            return cand

    return None

# =========================
# 8) Endpoint da API
# =========================
@app.post("/parse-historico")
async def parse_historico(file: UploadFile = File(...)):
    contents = await file.read()

    concluidas = set()        # guarda códigos concluídos/aprovados sem repetir
    nomes_encontrados = set() # guarda nomes (títulos) encontrados sem repetir
    debug_rows = []           # para você enxergar o que foi capturado

    with pdfplumber.open(io.BytesIO(contents)) as pdf:
        linhas = []

        # Lê todas as páginas e transforma em linhas
        for page in pdf.pages:
            # x/y tolerance geralmente melhora MUITO em PDFs tipo SIGAA
            text = page.extract_text(x_tolerance=2, y_tolerance=2)
            if text:
                linhas.extend([ln.rstrip() for ln in text.splitlines() if ln.strip()])

        # Varre cada linha do PDF
        for i, ln in enumerate(linhas):
            sc = extrair_status_e_codigo(ln)
            if not sc:
                continue

            status, codigo = sc

            # acha o título subindo algumas linhas
            titulo = buscar_titulo_para_codigo(linhas, i, max_volta=12)

            concluidas.add(codigo)

            if titulo:
                nomes_encontrados.add(normalizar_texto(titulo))

            debug_rows.append({
                "codigo": codigo,
                "status": status,
                "titulo": titulo,
                "linha_tabela": ln
            })

        # Equivalências (página 10 no seu exemplo)
        full_text = " ".join(linhas)
        regex_equiv = re.compile(
            r"Cumpriu\s+([A-Z0-9-]+)\s*-\s*(.+?)\s+atrav[eé]s",
            re.IGNORECASE
        )

        for codigo_eq, nome_eq in regex_equiv.findall(full_text):
            concluidas.add(codigo_eq.strip().upper())
            nomes_encontrados.add(normalizar_texto(nome_eq))

    return {
        "codigos": sorted(concluidas),
        "nomes": sorted(nomes_encontrados),
        "debug_rows": debug_rows[:200]  # deixa mais alto para depurar melhor
    }
