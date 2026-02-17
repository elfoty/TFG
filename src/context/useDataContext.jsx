import React from "react";
import { createContext, useContext, useState } from "react";

const CurriculoContext = createContext();

export function CurriculoProvider({ children }) {
  const [curriculo, setCurriculo] = useState([]);
  const [history, setHistory] = useState([]);
  const [filtros, setFiltros] = useState([]);
  return (
    <CurriculoContext.Provider
      value={{
        curriculo,
        setCurriculo,
        history,
        setHistory,
        filtros,
        setFiltros,
      }}
    >
      {children}
    </CurriculoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurriculo() {
  return useContext(CurriculoContext);
}
