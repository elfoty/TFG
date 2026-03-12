import React, { useState, useRef } from "react"; import Graph from "../components/Graph";
import GraphConcluida from "../components/GraphConcluida";
import { useCurriculo } from "../context/useDataContext";
import "../App.css";

export default function Filtros() {
  const { filtros, setFiltros } = useCurriculo();

  // Se 'filtros' for um objeto vindo do contexto, use uma propriedade dele
  // Mas o ideal é que seja apenas a string: "gargalos", "padrao", etc.
  const valorFiltro = typeof filtros === 'string' ? filtros : "padrao";

  return (
    <form className="max-w-sm mx-auto">
      <div class="w-full max-w-sm min-w-[200px]">
        <div class="relative">
          <select
            value={valorFiltro} // Garante que é uma string
            onChange={(e) => setFiltros(e.target.value)}
            class="w-half cursor-pointer rounded bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-lg flex items-center gap-2 font-medium focus:shadow-md appearance-none ">
            <option value="padrao">Selecione um filtro</option>
            <option value="gargalos">Disciplinas mais influentes (PageRank)</option>
            <option value="desbloqueio">Disciplinas mais conectadas (Grau)</option>
            <option value="pontes">Disciplinas que ligam trilhas (Betweenness)</option>
            <option value="nucleo">Disciplinas mais centrais (Closeness)</option>
          </select>
        </div>
      </div>
    </form>
  );
}