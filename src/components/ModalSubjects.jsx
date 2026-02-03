import React from "react";
export default function ModalSubjects({ disciplina, onCloseModal }) {
  if (!disciplina) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">{disciplina.nome}</h2>

        <p>
          <b>Código:</b> {disciplina.codigo}
        </p>
        <p>
          <b>Período:</b> {disciplina.periodo}
        </p>
        <p>
          <b>Carga horária:</b> {disciplina.carga}h
        </p>

        <p className="mt-2">
          <b>Status:</b> {disciplina.concluida ? "✅ Concluída" : "⏳ Pendente"}
        </p>

        <button
          onClick={onCloseModal}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
