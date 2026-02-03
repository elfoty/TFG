import React, { useState } from "react";
import GraphConcluida from "../components/GraphConcluida";
import { useCurriculo } from "../context/useDataContext";

export default function Historico() {
  const [historyPDF, setHistoryPDF] = useState(null);
  const [loading, setLoading] = useState(false);

  const { history, setHistory } = useCurriculo();

  function handleFileChange(e) {
    setHistoryPDF(e.target.files[0]);
  }

  async function uploadHistory() {
    if (!historyPDF) {
      alert("Selecione um PDF");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("historyPDF", historyPDF);

    const urlHistorico = "http://localhost:5678/webhook-test/upload-historico";
    const dataHistory = await fetch(urlHistorico, {
      method: "POST",
      body: formData,
    });
    const text = await dataHistory.text();
    const historicoJSON = JSON.parse(text);
    console.log("historicoJSON", historicoJSON);

    setLoading(false);

    setHistory(historicoJSON);
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-6">Upload HISTORICO </h1>
        <div className="flex gap-4 items-center mb-8">
          <input
            className="p-2 bg-amber-300 z-40"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />

          <button
            onClick={uploadHistory}
            className="bg-blue-600 text-white px-4 py-2 rounded z-40"
          >
            {loading ? "Processando..." : "Enviar PDF"}
          </button>
        </div>
      </div>

      <main>
        {/* {history.map((item) => (
          <div>
            <span>{item.codigo}</span>
            <span>{item.nome}</span>
            <span>{item.carga_horaria}</span>
          </div>
        ))} */}
      </main>
    </div>
  );
}
