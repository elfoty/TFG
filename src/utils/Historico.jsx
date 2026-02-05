import React, { useState, useRef } from "react";
import { useCurriculo } from "../context/useDataContext";
import * as pdfjsLib from 'pdfjs-dist';

// Configuração do Worker necessária para o PDF.js funcionar no navegador
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function Historico() {
  const [historyPDF, setHistoryPDF] = useState(null);
  const [loading, setLoading] = useState(false);
  const { history, setHistory } = useCurriculo();
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setHistoryPDF(selectedFile);
    }
  }

  const normalizarTexto = (txt) => {
    return txt?.toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^A-Z0-9]/g, "")      // Mantém só letras e números
      .trim();
  };
  const parseHistorico = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    let paginas = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Unimos o texto da página preservando uma noção de linha
      paginas.push(content.items.map(item => item.str).join(" "));
    }

    const fullText = paginas.join("\n");
    const concluidasSet = new Set();
    const nomesConcluidos = new Set();

    // 1. Regex para capturar a linha da disciplina aprovada
    // Captura: NOME DA MATERIA ... STATUS(APR/CUMP) ... CODIGO
    const regexLinhaHistorico = /([A-ZÀ-Ú\s]+)\s+(?:APR|CUMP|APRN|DISP)\s+([A-Z]{3,4}\d{2,3}[A-Z]?)/g;

    let match;
    while ((match = regexLinhaHistorico.exec(fullText)) !== null) {
      const nomeMateria = normalizarTexto(match[1]);
      const codigoMateria = match[2].toUpperCase();

      concluidasSet.add(codigoMateria);
      if (nomeMateria) nomesConcluidos.add(nomeMateria);
    }

    // 2. Captura Equivalências na Página 10 (Cumpriu X através de Y)
    const regexEquiv = /Cumpriu\s+([A-Z0-9-]+)\s*-\s*([A-ZÀ-Ú\s]+)\s+através/g;
    let matchEq;
    while ((matchEq = regexEquiv.exec(fullText)) !== null) {
      const codigoReq = matchEq[1].toUpperCase();
      const nomeReq = normalizarTexto(matchEq[2]);

      concluidasSet.add(codigoReq);
      nomesConcluidos.add(nomeReq);
    }

    // Retornamos um objeto que contém ambos os Sets para o Grafo usar
    return {
      codigos: Array.from(concluidasSet),
      nomes: Array.from(nomesConcluidos)
    };
  };

  async function uploadHistory() {
    if (!historyPDF) return alert("Selecione um PDF");
    setLoading(true);

    try {
      const resultado = await parseHistorico(historyPDF);
      console.log("Processado:", resultado);
      setHistory(resultado); // Salva {codigos: [], nomes: []}
    } catch (err) {
      console.error(err);
      alert("Erro ao processar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="z-50">
      {!history || history.length === 0 ? (
        <div className="flex gap-0 items-center flex-col relative">
          <div className="flex gap-0 items-center">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-l-lg shadow-lg font-medium"
            >
              {historyPDF ? "Arquivo pronto" : "Enviar Histórico"}
            </button>
            <button
              type="button"
              onClick={uploadHistory}
              disabled={loading}
              className="bg-blue-800 rounded-r-lg hover:bg-blue-900 text-white px-5 py-3 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "⌛" : "📤"}
            </button>
          </div>
          <div className="absolute top-12 text-white text-[10px] italic">
            {historyPDF?.name}
          </div>
        </div>
      ) : (
        <div className="text-white bg-green-600/20 p-4 rounded mb-8">
          ✅ Histórico processado com sucesso!
        </div>
      )}
    </div>
  );
}