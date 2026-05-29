import React, { useState } from "react";
import { useCurriculo } from "../context/useDataContext";
import "../App.css";
import { toast } from "sonner";

export default function UploadCurriculo() {
  const [selectedGrade, setSelectedGrade] = useState("matriz2022.json");
  const [loading, setLoading] = useState(false);

  const { curriculo, setCurriculo, setHistory } = useCurriculo();

  const gradeOptions = [
    { value: "matriz2015.json", label: "Grade 2015" },
    { value: "matriz2022.json", label: "Grade 2022" },
    { value: "matriz2026.json", label: "Grade 2026" },
    { value: "matriz.json", label: "Grade Geral" },
  ];

  async function loadGrade() {
    setLoading(true);

    try {
      const resp = await fetch(`/${selectedGrade}`);
      if (!resp.ok) throw new Error(`Erro ao carregar ${selectedGrade}`);

      const data = await resp.json();
      setCurriculo(data);
      setHistory([]);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar grade curricular",{ position:center})
    } finally {
      setLoading(false);
    }
  }
async function handleFileChange(e) {
    try {
      // const res = await fetch(url, { method: "POST", body: formData });
      // const text = await res.text();
      // console.log("raw response:", text);





      // const data = JSON.parse(text);
      const resp = await fetch(`${import.meta.env.BASE_URL}matriz${e}.json`); 
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
      toast("Erro ao carregar grade curricular",{ position:center})
      alert("Erro ao carregar grade curricular");
    } finally {
      setLoading(false);
    }
  }
  // async function handleUpload() {
  //   if (!file) {
  //     alert("Selecione um PDF");
  //     return;
  //   }

  //   setLoading(true);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   const url = "https://elfoty.app.n8n.cloud/webhook-test/upload-pdf";
  //   const urlLocal = "http://localhost:5678/webhook-test/upload-pdf";

  //   try {
  //     // const res = await fetch(url, { method: "POST", body: formData });
  //     // const text = await res.text();
  //     // console.log("raw response:", text);

  //     // const data = JSON.parse(text);
  //     const resp = await fetch("/matriz2015.json");
  //     if (!resp.ok) throw new Error("Erro ao carregar matriz.json");

  //     const data = await resp.json();
  //     setCurriculo(data);

  //     const grouped = data.reduce((acc, disc) => {
  //       if (!acc[disc.periodo]) acc[disc.periodo] = [];
  //       acc[disc.periodo].push(disc);
  //       return acc;
  //     }, {});

  //     setPorPeriodo(grouped);
  //     console.log("porPeriodo:", grouped);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Erro ao processar PDF");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <div className="z-50"> {/* Força ficar na frente */}

      <form className="max-w-sm mx-auto">
        <div className="w-full max-w-sm min-w-50">
          <div className="relative">
            <select
              onChange={(e) => handleFileChange(e.target.value)}
              className="w-half cursor-pointer rounded bg-[#111827] hover:bg-[#11192b] outline-0 text-white px-6 py-3 shadow-lg flex items-center gap-2 font-medium focus:shadow-md appearance-none ">
              <option value="">Selecione uma grade</option>
              <option value="2015">Grade 2015</option>
              <option value="2022">Grade 2022</option>
              <option value="2026">Grade 2026</option>
            </select>
          </div>
        </div>
      </form>

      {/*curriculo.length === 0 && (
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
              {file ? "Arquivo enviado" : "📄 Enviar PPC do curso"}
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
      )*/}

    </div>
  );
}
