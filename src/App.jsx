import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Principal from "./pages/principal";

export default function App(){
  return(
    <BrowserRouter>
    <div>
      <Routes>
        <Route path="TFG" element={<Principal/>}/>
        </Routes>
    </div>
    </BrowserRouter>

  )
}