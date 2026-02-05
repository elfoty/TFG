import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CurriculoProvider } from "./context/useDataContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurriculoProvider>
      <App />
    </CurriculoProvider>
  </StrictMode>,
)
