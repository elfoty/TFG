import React, { useState, useRef } from "react";
import { useCurriculo } from "../context/useDataContext";
import { toast } from "sonner";
import Loader from "../components/loader";
import { parseHistorico } from "./parseHistorico";


import { Trash, Upload } from "lucide-react";
export default function Historico() {
  const [historyPDF, setHistoryPDF] = useState(null);
  const [loading, setLoading] = useState(false);
  const { history, setHistory } = useCurriculo();
  const fileInputRef = useRef(null);
  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setHistoryPDF(selectedFile);
      uploadHistory(selectedFile);
    }
  }

  async function uploadHistory(historyPDF) {
    if (!historyPDF) {
      toast.warning("Selecione um PDF", { position: "top-center" });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", historyPDF); // O Python espera um campo chamado 'file'

    // URL do seu microserviço Python local
    // const urlMicroservico = "http://127.0.0.1:8000/parse-historico";
    const urlMicroservico = "https://tfg-db7b.onrender.com/parse-historico";

    /*try {
      const dadosProcessados = await parseHistorico(historyPDF);

      console.log("Histórico processado no navegador:", dadosProcessados);

      if (!dadosProcessados.codigos || dadosProcessados.codigos.length === 0) {
        toast.warning(
          "O arquivo foi processado, mas não foram encontradas matérias. Verifique se o PDF é um histórico válido.",
          { position: "top-center" }
        );
      }

      setHistory(dadosProcessados);
    } catch (err) {
      console.error(err);

      toast.warning(
        "Erro ao processar o PDF. Verifique se o arquivo é um histórico válido.",
        { position: "top-center" }
      );
    } finally {
      setLoading(false);
    }*/

    try {
      const res = await fetch(urlMicroservico, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Erro no servidor: ${res.status}`);
      }

      // O Python vai retornar: { codigos: [...], nomes: [...] }
      const dadosProcessados = await res.json();

      console.log("Python respondeu:", dadosProcessados);

      if (dadosProcessados.codigos.length === 0) {
        toast.warning(
          "O servidor processou o arquivo mas não encontrou matérias. Verifique o PDF.",
          { position: "top-center" },
        );
        // alert("O servidor processou o arquivo mas não encontrou matérias. Verifique o PDF.");
      }

      setHistory(dadosProcessados);
    } catch (err) {
      console.error(err);
      toast.warning(
        "Erro ao conectar com o microserviço Python. Verifique se ele está rodando.",
        { position: "top-center" },
      );
      //alert("Erro ao conectar com o microserviço Python. Verifique se ele está rodando.");
    } finally {
      setLoading(false);
    }
  }

  function removeHistory() {
    setHistory([]);
    setHistoryPDF([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Histórico removido com sucesso!", {
      position: "top-center",
    });
    console.log("removi historico");
  }
  // Verifica se o histórico tem dados (array ou objeto)
  const temHistorico =
    history &&
    ((Array.isArray(history) && history.length > 0) ||
      (history.codigos && history.codigos.length > 0));

  const handleCropText = (text) => {
    if (!text) return "";

    if (text.length <= 20) return text;
    return `${text.substring(0, 21)}...`;
  };

  return (
    <div className=" history-container">
      {!temHistorico ? (
        <>
          <div className="">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />

            <div className="upload-button-container">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="button"
              >
                {historyPDF?.name
                  ? handleCropText(historyPDF?.name)
                  : "Selecionar Histórico"}
              </button>
              <button type="button" onClick={uploadHistory} disabled={loading}>
                {loading && <Loader size="sm" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="ready-file-container">
          <div className="text-white flex-1 px-2 font-medium">
            Histórico processado!
          </div>

          <button
            onClick={removeHistory}
            className="bg-red-300 hover:bg-red-400 p-2 rounded transition cursor-pointer"
          >
            <Trash size={20} color="#0F172A" />
          </button>
        </div>
      )}
    </div>
  );
}
