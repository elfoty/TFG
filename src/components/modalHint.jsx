import { X, BookOpen, Calendar } from "lucide-react";
import { useState } from "react";

export default function ModalSugestoes({
  isOpen,
  onClose,
  sugestoes = [],
  onSelect,
}) {
  const [userPeriodo, setUserPeriodo] = useState("");

  function getUserPeriodo(e) {
    setUserPeriodo(e.target.value);
  }

  if (!isOpen) return null;

  const filtroMateriasPorPeriodoUsuario = sugestoes.filter((m) => {
    if (userPeriodo === "") return true;
    return (m.periodo % 2 == 0) === (userPeriodo % 2 == 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal */}
      <div className="relative w-full max-w-2xl   rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Sugestões de matérias
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Escolha matérias compatíveis com seu período
            </p>
          </div>

          <button
            onClick={onClose}
            className="bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X size={22} className="text-slate-300" />
          </button>
        </div>

        {/* Filtro */}
        <div className="px-6 py-3 border-b border-white/10">
          <label className="text-sm text-slate-300 mb-2 block font-medium">
            Digite o período que você está cursando
          </label>

          <div className="relative">
            <input
              value={userPeriodo}
              onChange={getUserPeriodo}
              placeholder="Ex: 3"
              className="w-full bg-[#1E293B] border border-white/10 focus:border-blue-500 outline-none rounded-xl px-4 py-2 text-white placeholder:text-slate-500 transition"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="max-h-90 overflow-y-auto px-6 py-2 space-y-2">
          {filtroMateriasPorPeriodoUsuario.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400">Nenhuma sugestão encontrada</p>
            </div>
          ) : (
            filtroMateriasPorPeriodoUsuario.map((materia, index) => (
              <button
                key={index}
                onClick={() => onSelect?.(materia)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/40 rounded-2xl px-4 py-2 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className="bg-blue-500/15 border border-blue-400/20 p-3 rounded-xl">
                    <BookOpen size={22} className="text-blue-400" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white text-base">
                        {materia.nome}
                      </h3>

                      <span className="bg-slate-700/70 text-slate-300 text-xs px-2 py-1 rounded-md">
                        {materia.id}
                      </span>

                      <span className="bg-emerald-500/15 text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-400/20">
                        {materia.periodo}º período
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {materia.descricao}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end bg-black/10 ">
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
