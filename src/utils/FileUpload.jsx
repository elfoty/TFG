import React, { useState } from "react";
import { useCurriculo } from "../context/useDataContext";
import "../App.css";

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
      alert("Erro ao carregar grade curricular");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="z-50">
      <div className="flex items-center gap-2">
        <select
          className="bg-white text-slate-900 px-3 py-3 rounded-l-lg border border-blue-800 min-w-[180px]"
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
        >
          {gradeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadGrade}
          disabled={loading}
          className="bg-blue-800 rounded-r-lg cursor-pointer hover:bg-blue-900 text-white px-5 py-3 disabled:opacity-60"
        >
          {loading ? "Carregando..." : curriculo.length > 0 ? "Trocar grade" : "Selecionar grade"}
        </button>
      </div>
    </div>
  );
}
