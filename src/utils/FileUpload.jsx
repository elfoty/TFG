import React, { useEffect, useState } from "react";
import { useCurriculo } from "../context/useDataContext";
import "../App.css";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function UploadCurriculo() {
  const [selectedGrade, setSelectedGrade] = useState("matriz2022.json");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { curriculo, setCurriculo, setHistory } = useCurriculo();

  const currentQuery = searchParams.get("grade") || "";

  const gradeOptions = [
    { value: "matriz2015.json", label: "Grade 2015" },
    { value: "matriz2022.json", label: "Grade 2022" },
    { value: "matriz2026.json", label: "Grade 2026" },
    { value: "matriz.json", label: "Grade Geral" },
  ];

  async function handleFileChange(e) {
    console.log(e);
    setSearchParams({ grade: e });
    try {
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
      toast("Erro ao carregar grade curricular", { position: center });
      alert("Erro ao carregar grade curricular");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (currentQuery) handleFileChange(currentQuery);
  }, [currentQuery]);

  return (
    <div>
      <form>
        <div>
          <div className="relative">
            <select
              value={currentQuery}
              onChange={(e) => handleFileChange(e.target.value)}
            >
              <option value="" disabled>
                Selecionar grade
              </option>
              <option value="2015">Grade 2015</option>
              <option value="2022">Grade 2022</option>
              <option value="2026">Grade 2026</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
