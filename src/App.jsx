import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Teste from "./components/teste";
import Principal from "./pages/principal";
import Hint from "./components/hint";

export default function App(){
  return(
    <BrowserRouter>    
    <div>
      <Routes>
        <Route path="/TFG" element={<Principal/>}/>
          <Route path="/TFG/sugestao" element={<Hint/>}/>
        </Routes>
    </div>
    </BrowserRouter>

  )
}