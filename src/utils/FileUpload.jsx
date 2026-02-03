import React, { useState } from "react";
import Graph from "../components/Graph";
import GraphConcluida from "../components/GraphConcluida";
import { useCurriculo } from "../context/useDataContext";

export default function UploadCurriculo() {
  const [file, setFile] = useState(null);
  const [porPeriodo, setPorPeriodo] = useState({});
  const [loading, setLoading] = useState(false);

  const { curriculo, setCurriculo } = useCurriculo();
  function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function handleUpload() {
    if (!file) {
      alert("Selecione um PDF");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const url = "https://elfoty.app.n8n.cloud/webhook-test/upload-pdf";
    const urlLocal = "http://localhost:5678/webhook-test/upload-pdf";

    try {
      const res = await fetch(url, { method: "POST", body: formData });
      const text = await res.text();
      console.log("raw response:", text);

      const data = JSON.parse(text);

      setCurriculo(data);

      const grouped = data.reduce((acc, disc) => {
        if (!acc[disc.periodo]) acc[disc.periodo] = [];
        acc[disc.periodo].push(disc);
        return acc;
      }, {});

      setPorPeriodo(grouped);
      console.log("porPeriodo:", grouped);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {curriculo.length === 0 && (
        <div>
          <h1 className="text-3xl font-bold mb-6 z-9999">
            Upload de Matriz Curricular 📘
          </h1>
          <div className="flex gap-4 items-center mb-8">
            <input
              className="p-2 bg-amber-300 z-40"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />

            <button
              onClick={handleUpload}
              className="bg-blue-600 text-white px-4 py-2 rounded z-40"
            >
              {loading ? "Processando..." : "Enviar PDF GRADE"}
            </button>
          </div>
        </div>
      )}
      {/* {curriculo.length > 0 && <Graph curriculo={curriculo} />} */}
      {curriculo.length > 0 && <GraphConcluida />}
    </div>
  );
}

{
  /* Exemplo de renderização por período
      {Object.keys(porPeriodo).map((periodo) => (
        <div key={periodo} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Período {periodo}</h2>
          <ul className="list-disc pl-5">
            {porPeriodo[periodo].map((disc) => (
              <li key={disc.codigo}>
                {disc.codigo} - {disc.nome} ({disc.carga_horaria}h)
              </li>
            ))}
          </ul>
        </div>
      ))} */
}
