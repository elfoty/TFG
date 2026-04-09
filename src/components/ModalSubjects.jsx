import React from "react";
export default function ModalSubjects({ disciplina, onCloseModal }) {
  if (!disciplina) return null;

  const disciplinaConcluida = disciplina.concluida === true ? "Concluida" : "Pendente";
  console.log("discipl",disciplinaConcluida)

  return (
    <div className="fixed inset-0 bg-white/20 flex items-center justify-center z-50 ">
      <div className="bg-black/95 rounded-xl p-6 w-full max-w-md shadow-lg text-white">
        <h2 className="text-lg font-bold mb-2 text-blue-500 uppercase">
          {disciplina.nome}
        </h2>

        <p>
          <b className="text-[#f3f3f3]/80">Código:</b> {disciplina.codigo}
        </p>
        <p>
          <b className="text-[#f3f3f3]/80">Período:</b> {disciplina.periodo}
        </p>
        <p>
          <b className="text-[#f3f3f3]/80">Carga horária:</b> {disciplina.carga}
          h
        </p>

        <p className="mt-2">
          <b className="text-[#f3f3f3]/80">Status:</b>{" "}
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              disciplinaConcluida === "Concluida"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {disciplinaConcluida}
          </span>
        </p>

        <button
          onClick={onCloseModal}
          className="w-full transition duration-200 mt-4 bg-black text-white px-4 py-2 rounded border border-gray-200/20 hover:text-blue-200 hover:border-blue-300/20"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
