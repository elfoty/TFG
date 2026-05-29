import React from "react";
export default function ModalSubjects({ disciplina, onCloseModal }) {
  if (!disciplina) return null;

  const disciplinaConcluida =
    disciplina.concluida === true ? "Concluída" : "Pendente";
  console.log("discipl", disciplinaConcluida);

  return (
    <div className=" fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-black/70 rounded-xl p-6 w-full max-w-md shadow-lg text-white">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Disciplina
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {disciplina.nome}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
            <span className="text-sm text-slate-400">Código</span>
            <span className="font-medium text-slate-100">
              {disciplina.codigo}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
            <span className="text-sm text-slate-400">Período</span>

            <span className="font-medium text-slate-100">
              {disciplina.periodo}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
            <span className="text-sm text-slate-400">Carga Horária</span>

            <span className="font-medium text-slate-100">
              {disciplina.carga}h
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-3">
            <span className="text-sm text-slate-400">Status</span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                disciplinaConcluida === "Concluída"
                  ? "bg-green-500/20 text-green-400 border border-green-500/20"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
              }`}
            >
              {disciplinaConcluida}
            </span>
          </div>
        </div>

        <button
          onClick={onCloseModal}
          className="cursor-pointer w-full mt-4  px-4 py-2 rounded flex-1  border border-slate-700 bg-slate-800  font-medium text-slate-200 transition-all duration-200 hover:bg-slate-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
