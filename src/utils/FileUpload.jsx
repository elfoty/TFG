import React, { useState, useRef } from "react"; import Graph from "../components/Graph";
import GraphConcluida from "../components/GraphConcluida";
import { useCurriculo } from "../context/useDataContext";
import "../App.css";

export default function UploadCurriculo() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [porPeriodo, setPorPeriodo] = useState({});
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("Nenhum arquivo selecionado");

  const { curriculo, setCurriculo } = useCurriculo();
  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name); // Atualiza o texto do lado do botão
    }
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
      // const res = await fetch(url, { method: "POST", body: formData });
      // const text = await res.text();
      // console.log("raw response:", text);

      // const data = JSON.parse(text);
      const resp = await fetch("/matriz2015.json");
      if (!resp.ok) throw new Error("Erro ao carregar matriz.json");

      const data = await resp.json();
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
    <div className="z-50"> {/* Força ficar na frente */}
      {curriculo.length === 0 && (
        <div className="flex items-center flex-col relative">
          <div className="flex gap-0 items-center">
            <input
              ref={fileInputRef} // Vincula o ref
              className="hidden"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()} // Força o clique
              className="cursor-pointer rounded-s-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-lg flex items-center gap-2 font-medium"
            >
              {file ? "Arquivo enviado" : "📄 Enviar Matriz"}
            </button>
            <button
              onClick={handleUpload}
              className="bg-blue-800 rounded-r-lg cursor-pointer hover:bg-blue-900 text-white px-5 py-3 z-50"
            >
              {loading ? "⏳" : "📤"}
            </button>
          </div>
          <div className="absolute top-12 left-0 right-0 text-white text-[10px] italic truncate max-w-[200px] text-center mx-auto pointer-events-none">{file?.name}</div>
        </div>
      )}
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
