import React, { useState } from "react";

import { useCurriculo } from "../context/useDataContext";
import GraphConcluida from "../components/GraphConcluida";
import FileUpload from "../utils/FileUpload";
import Historico from "../utils/Historico";
import Filtros from "../utils/Filtros";
import GraphBackground from "../assets/mock.svg";
import { Link, useSearchParams } from "react-router-dom";
import SvgGraph from "../components/SVGgrafo";
import SvgGrafo from "../components/SVGgrafo";
export default function Principal() {
  const [openModalSugestoes, setOpenModalSugestoes] = useState(false);

  const { history } = useCurriculo();

  const [searchParams, setSearchParams] = useSearchParams();

  const curriculo = searchParams.get("grade") || "";
  const temHistorico = history && history?.codigos?.length > 0;

  function handleOpenModalSugestoes() {
    setOpenModalSugestoes(!openModalSugestoes);
  }

  return (
    <div className="w-screen h-screen bg-[#020305] overflow-hidden">
      <div className="app-container">
        <header className="header-container">
          <Link to="/TFG">
            <div className="logo">AjudaEu</div>
          </Link>

          {curriculo.length > 0 && (
            <div className="grade-container ">
              <FileUpload curriculo={curriculo} />
            </div>
          )}
          {curriculo.length > 0 && <Historico history={history} />}

          {curriculo && <Filtros />}
          {curriculo.length > 0 && (
            <button
              to="/TFG/sugestao"
              className="button"
              onClick={handleOpenModalSugestoes}
            >
              Sugestões de matérias
            </button>
          )}

          <a
            className="font-bold  p-2 rounded cursor-pointer bg-white hover:bg-[#e8eaec]"
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLScllQStr3U7YPw6F9zc-yaCVW7GvrWwi_hY3MiKxnetbx8pfQ/viewform"
          >
            Teste de usabilidade
          </a>
        </header>
        <main className="graph-main">
          {/* DEIXA ISSO AQUI  ddps muda  ----  pt-24 evita que o header cubra o conteúdo inicial */}
          {curriculo ? (
            <GraphConcluida
              openModalSugestoes={openModalSugestoes}
              setOpenModalSugestoes={setOpenModalSugestoes}
            />
          ) : (
            <div className=" flex flex-col  lg:flex-row items-center justify-center gap-12 h-full px-8  ">
              <div className="">
                {/* <SvgGrafo /> */}
                <h2 className="text-4xl font-bold mb-4 text-white">
                  Visualize sua grade curricular
                </h2>

                <p className="text-gray-400">
                  Escolha sua grade e faça upload do histórico para explorar
                  pré-requisitos, dependências e sugestões de disciplinas.
                </p>

                <div className="grade-container ">
                  <p>Selecione sua grade para começar:</p>
                  <FileUpload />
                </div>
              </div>

              <div>
                <img src={GraphBackground} alt="Grade Curricular" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
