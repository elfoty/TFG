import Graph from "./components/Graph";
import GraphConcluida from "./components/GraphConcluida";
import { CurriculoProvider } from "./context/useDataContext";
import Principal from "./pages/principal";
import FileUpload from "./utils/FileUpload";
import Historico from "./utils/Historico";

export default function App() {
  return (
    <div className="flex gap-20">
      <CurriculoProvider>
        <div>
          {/* <FileUpload /> */}
          <Historico />
          <div>
            <FileUpload />
          </div>
        </div>
      </CurriculoProvider>
    </div>
  );
}
