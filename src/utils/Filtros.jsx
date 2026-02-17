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
            class="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded pl-3 pr-8 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-400 shadow-sm focus:shadow-md appearance-none cursor-pointer">
            <option value="padrao">Padrão</option>
            <option value="gargalos">Gargalos (PageRank)</option>
            <option value="desbloqueio">Potencial de Desbloqueio (Grau)</option>
            <option value="pontes">Pontes Estratégicas (Betweenness)</option>
            <option value="nucleo">Núcleo do Curso (Closeness)</option>
          </select>
        </div>
      </div>
    </form>
  );
}