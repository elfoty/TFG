import React, { useState, useRef } from "react";
import { useCurriculo } from "../context/useDataContext";

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

  async function uploadHistory() {
    if (!historyPDF) {
      alert("Selecione um PDF");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", historyPDF); // O Python espera um campo chamado 'file'

    // URL do seu microserviço Python local
    const urlMicroservico = "http://127.0.0.1:8000/parse-historico";

    try {
      const res = await fetch(urlMicroservico, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Erro no servidor: ${res.status}`);
      }

      // O Python vai retornar: { codigos: [...], nomes: [...] }
      const dadosProcessados = await res.json();
      
      console.log("Python respondeu:", dadosProcessados);

      if (dadosProcessados.codigos.length === 0) {
        alert("O servidor processou o arquivo mas não encontrou matérias. Verifique o PDF.");
      }

      setHistory(dadosProcessados);

    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o microserviço Python. Verifique se ele está rodando.");
    } finally {
      setLoading(false);
    }
  }

  // Verifica se o histórico tem dados (array ou objeto)
  const temHistorico = history && (
    (Array.isArray(history) && history.length > 0) || 
    (history.codigos && history.codigos.length > 0)
  );

  return (
    <div className="z-50">
      {!temHistorico ? (
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
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-l-lg shadow-lg transition-all font-medium"
            >
              {historyPDF ? "Arquivo pronto" : "Enviar Histórico"}
            </button>
            <button
              type="button"
              onClick={uploadHistory}
              disabled={loading}
              className="bg-blue-800 rounded-r-lg hover:bg-blue-900 text-white px-5 py-3 z-40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "⌛" : "📤"}
            </button>
          </div>
          <div className="absolute top-12 left-0 right-0 text-white text-[10px] italic truncate max-w-[200px] text-center mx-auto">
            {historyPDF?.name}
          </div>
        </div>
      ) : (
        <div className="text-white bg-green-600/20 px-4 py-2 rounded-lg border border-green-500 font-medium">
          ✅ Histórico processado!
        </div>
      )}
    </div>
  );
}