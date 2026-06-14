import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { CurriculoProvider } from "./context/useDataContext";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CurriculoProvider>
      <Toaster richColors />
      <App />
    </CurriculoProvider>
  </StrictMode>,
);
