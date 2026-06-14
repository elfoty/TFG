import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// =========================
// 1) Normalização de texto
// Remove acento e coloca em maiúsculo
// =========================
function normalizarTexto(texto) {
  if (!texto) {
    return "";
  }

  return texto
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

// =========================
// 2) O que conta como aprovado/aproveitado
// =========================
const STATUS_OK = new Set([
  "APR",
  "APRN",
  "CUMP",
  "DISP",
  "TRANS",
  "INCORP",
]);

// =========================
// 3) Regex/validadores do formato SIGAA
// =========================

// Período no começo da linha
// Exemplo: "2018.1" ou "--"
const RE_PERIODO = /^\s*(\d{4}\.\d|--)(?=\s|$)/;

// Código normal com número
// Exemplos: MAT001, ECOS01A, ADM01E, ECOE01, MAT00N, ELTA00, TELC12A
const RE_CODIGO_COM_NUM = /^[A-Z]{3,6}\d{2,3}[A-Z0-9]?$/;

// Código só com letras
// Exemplos: ESTSUPER, PROJETOFI
const RE_CODIGO_SO_LETRAS = /^[A-Z]{5,15}$/;

// Tokens que aparecem na tabela mas não são código
const IGNORAR_TOKENS = new Set([
  "*",
  "e",
  "#",
  "@",
  "V",
  "--",
]);

// Palavras em maiúsculo que não podem virar código
const BAN_WORDS = new Set([
  "SIGAA",
  "UNIFEI",
  "PRG",
  "CRA",
  "HISTORICO",
  "HISTÓRICO",
  "DADOS",
  "COMPONENTES",
  "CURRICULARES",
  "CURSADOS",
  "CURSANDO",
  "ANO",
  "PERIODO",
  "LETIVO",
  "SITUACAO",
  "SITUAÇÃO",
  "LEGENDA",
  "PAGINA",
  "PÁGINA",
  "EMISSAO",
  "EMISSÃO",
  "ENADE",
  "MATRICULADO",
  "MATR",
]);

// =========================
// 4) Filtros para ignorar linhas que não são título de disciplina
// =========================
function isLinhaProfessorOuCarga(sNorm) {
  return (
    sNorm.includes("DR.") ||
    sNorm.includes("DRA.") ||
    sNorm.includes("MSC.") ||
    sNorm.includes("(") ||
    sNorm.includes("H)")
  );
}

function isLinhaLixo(sNorm) {
  const termosLixo = [
    "SIGAA",
    "UNIFEI",
    "HISTORICO",
    "HISTÓRICO",
    "DADOS",
    "COMPONENTES",
    "ANO/PERIODO",
    "SITUACAO",
    "SITUAÇÃO",
    "LEGENDA",
    "PARA VERIFICAR",
    "PAGINA",
    "PÁGINA",
    "EMISSAO",
    "EMISSÃO",
    "EMITIDO EM",
  ];

  return termosLixo.some((termo) => sNorm.includes(termo));
}

function pareceTitulo(linha) {
  const s = linha.trim();

  if (s.length < 4) {
    return false;
  }

  const sNorm = normalizarTexto(s);

  if (isLinhaLixo(sNorm)) {
    return false;
  }

  if (isLinhaProfessorOuCarga(sNorm)) {
    return false;
  }

  if (RE_PERIODO.test(s)) {
    return false;
  }

  if (!/[A-ZÀ-Ü]/.test(s)) {
    return false;
  }

  if (s !== s.toUpperCase()) {
    return false;
  }

  if (sNorm.includes("DISPENSADO") || sNorm.includes("ENADE")) {
    return false;
  }

  return true;
}

// =========================
// 5) Extrair status e código de uma linha da tabela
// =========================
function extrairStatusECodigo(linha) {
  if (!RE_PERIODO.test(linha)) {
    return null;
  }

  const tokens = linha.split(/\s+/).filter(Boolean);

  if (tokens.length < 3) {
    return null;
  }

  const status = tokens[tokens.length - 1].trim().toUpperCase();

  if (!STATUS_OK.has(status)) {
    return null;
  }

  const periodo = tokens[0].trim();

  let melhorCodigoNum = null;
  let melhorCodigoLetras = null;

  const temArroba = tokens.includes("@");

  for (const token of tokens.slice(1, -1)) {
    const tt = token.trim().toUpperCase();

    if (!tt || IGNORAR_TOKENS.has(tt)) {
      continue;
    }

    if (BAN_WORDS.has(tt)) {
      continue;
    }

    if (RE_CODIGO_COM_NUM.test(tt)) {
      melhorCodigoNum = tt;
      break;
    }

    if (RE_CODIGO_SO_LETRAS.test(tt)) {
      if (!STATUS_OK.has(tt)) {
        melhorCodigoLetras = tt;
      }
    }
  }

  if (melhorCodigoNum) {
    return {
      status,
      codigo: melhorCodigoNum,
    };
  }

  if (melhorCodigoLetras) {
    return {
      status,
      codigo: melhorCodigoLetras,
    };
  }

  if (temArroba) {
    return {
      status,
      codigo: `ATIV_${periodo}`,
    };
  }

  return null;
}

// =========================
// 6) Quando acha a linha da tabela, busca o título logo acima
// =========================
function buscarTituloParaCodigo(linhas, idxLinhaCodigo, maxVolta = 12) {
  const inicio = Math.max(0, idxLinhaCodigo - maxVolta);

  for (let j = idxLinhaCodigo - 1; j >= inicio; j--) {
    const cand = linhas[j].trim();

    if (!cand) {
      continue;
    }

    const candNorm = normalizarTexto(cand);

    if (isLinhaLixo(candNorm)) {
      continue;
    }

    if (isLinhaProfessorOuCarga(candNorm)) {
      continue;
    }

    if (pareceTitulo(cand)) {
      return cand;
    }
  }

  return null;
}

// =========================
// 7) Agrupa os textos do PDF por linha
// Substitui a função extract_text do pdfplumber
// =========================
function agruparItensPorLinha(items, toleranciaY = 2) {
  const linhas = [];

  for (const item of items) {
    const texto = item.str;

    if (!texto || !texto.trim()) {
      continue;
    }

    const x = item.transform[4];
    const y = item.transform[5];

    let linhaEncontrada = null;

    for (const linha of linhas) {
      if (Math.abs(linha.y - y) <= toleranciaY) {
        linhaEncontrada = linha;
        break;
      }
    }

    if (!linhaEncontrada) {
      linhaEncontrada = {
        y,
        partes: [],
      };

      linhas.push(linhaEncontrada);
    }

    linhaEncontrada.partes.push({
      x,
      texto,
    });
  }

  return linhas
    .sort((a, b) => b.y - a.y)
    .map((linha) => {
      return linha.partes
        .sort((a, b) => a.x - b.x)
        .map((parte) => parte.texto)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
}

// =========================
// 8) Lê todas as páginas do PDF e transforma em linhas
// =========================
async function extrairLinhasDoPdf(file) {
  const contents = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: contents,
  }).promise;

  const linhas = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const textContent = await page.getTextContent();

    const linhasPagina = agruparItensPorLinha(textContent.items, 2);

    for (const linha of linhasPagina) {
      const limpa = linha.trim();

      if (limpa) {
        linhas.push(limpa);
      }
    }
  }

  return linhas;
}

// =========================
// 9) Função principal
// Equivalente ao endpoint /parse-historico
// =========================
export async function parseHistorico(file) {
  const concluidas = new Set();
  const nomesEncontrados = new Set();
  const debugRows = [];

  const linhas = await extrairLinhasDoPdf(file);

  for (let i = 0; i < linhas.length; i++) {
    const ln = linhas[i];

    const sc = extrairStatusECodigo(ln);

    if (!sc) {
      continue;
    }

    const { status, codigo } = sc;

    const titulo = buscarTituloParaCodigo(linhas, i, 12);

    concluidas.add(codigo);

    if (titulo) {
      nomesEncontrados.add(normalizarTexto(titulo));
    }

    debugRows.push({
      codigo,
      status,
      titulo,
      linha_tabela: ln,
    });
  }

  // =========================
  // 10) Equivalências
  // Equivalente ao trecho:
  // Cumpriu CODIGO - NOME através
  // =========================
  const fullText = linhas.join(" ");

  const regexEquiv = /Cumpriu\s+([A-Z0-9-]+)\s*-\s*(.+?)\s+atrav[eé]s/gi;

  let match;

  while ((match = regexEquiv.exec(fullText)) !== null) {
    const codigoEq = match[1];
    const nomeEq = match[2];

    concluidas.add(codigoEq.trim().toUpperCase());
    nomesEncontrados.add(normalizarTexto(nomeEq));
  }

  return {
    codigos: Array.from(concluidas).sort(),
    nomes: Array.from(nomesEncontrados).sort(),
    debug_rows: debugRows.slice(0, 200),
  };
}

// =========================
// 11) Exportações opcionais para teste
// =========================
export {
  normalizarTexto,
  pareceTitulo,
  extrairStatusECodigo,
  buscarTituloParaCodigo,
};