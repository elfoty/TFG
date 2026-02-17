import GraphConcluida from "./components/GraphConcluida";
import FileUpload from "./utils/FileUpload";
import Historico from "./utils/Historico";
import Filtros from "./utils/Filtros";
import { useCurriculo } from "../src/context/useDataContext";

export default function App() {
  const { curriculo, history } = useCurriculo();

  // Verifica se a matriz foi carregada
  const temCurriculo = curriculo && curriculo.length > 0;
  const temHistorico = history && history?.codigos?.length > 0;

  return (
    <div className="min-h-screen flex flex-col"> 
      <header className="fixed top-0 left-0 w-full z-[100] bg-[#197fff]/90 ">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <h1 className="text-white font-bold text-xl hidden md:block">Grade UNIFEI</h1>
          
          <div className="flex gap-3 flex-wrap justify-center items-center h-22">
            <FileUpload curriculo={curriculo}/>
            {curriculo.length>0 && <Historico history={history}/>}
            {console.log(temCurriculo, temHistorico, history, history.length, curriculo)}
            {(temCurriculo) && <Filtros />}
          </div>
        </div>
      </header>
      <main className="flex-1 pt-24"> {/* pt-24 evita que o header cubra o conteúdo inicial */}
        {temCurriculo ? (
          <GraphConcluida />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white text-center px-4">
            <p className="text-2xl font-light">Para começar, faça o upload da sua <b>Matriz Curricular</b>.</p>
          </div>
        )}
      </main>
    </div>
  );
}