import React, { useState } from "react";

import { useCurriculo } from "../context/useDataContext";
import GraphConcluida from "../components/GraphConcluida";
import FileUpload from "../utils/FileUpload";
import Historico from "../utils/Historico";
import Filtros from "../utils/Filtros";
import { Link } from "react-router-dom";
export default function Principal() {
  const [openModalSugestoes, setOpenModalSugestoes] = useState(false);

  const { curriculo, history } = useCurriculo();

  const temCurriculo = curriculo && curriculo.length > 0;
  const temHistorico = history && history?.codigos?.length > 0;

  function handleOpenModalSugestoes() {
    setOpenModalSugestoes(!openModalSugestoes);
  }
  return (
    <div className="w-full">
      <header className=" py-4 px-4 z-100 bg-[#197fff]/90 backdrop-opacity-10">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <h1 className="text-white font-bold text-xl hidden md:block ">
            Visualização Interativa de Grade Curricular com Grafos
          </h1>

          <div className="bg-red-500 flex gap-3 flex-wrap justify-center items-center ">
            <FileUpload curriculo={curriculo} />
            {curriculo.length > 0 && <Historico history={history} />}
            {console.log(
              temCurriculo,
              temHistorico,
              history,
              history.length,
              curriculo,
            )}
            {temCurriculo && <Filtros />}
            {curriculo.length > 0 && (
              <button
                to="/TFG/sugestao"
                className="font-bold border p-2 rounded cursor-pointer"
                onClick={handleOpenModalSugestoes}
              >
                Veja Sugestoes de matérias
              </button>
            )}
          </div>
        </div>
      </header>
      <main className=" bg-black/90 h-[calc(100vh-96px)]">
        {/* DEIXA ISSO AQUI  ddps muda  ----  pt-24 evita que o header cubra o conteúdo inicial */}
        {temCurriculo ? (
          <GraphConcluida
            openModalSugestoes={openModalSugestoes}
            setOpenModalSugestoes={setOpenModalSugestoes}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white text-center px-4 ">
            <p className="mt-24 text-2xl font-light">
              Para começar, <b>selecione a grade</b>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
