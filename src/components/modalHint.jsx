import { X } from "lucide-react";

export default function ModalSugestoes({ isOpen, onClose, sugestoes = [], onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 shadow-2xl">
      {/* container */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative">
        
        {/* botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-300 border rounded"
        >
          <X size={22} />
        </button>

        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center">
          Sugestões de matérias
        </h2>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {sugestoes.length === 0 ? (
            <p className="text-gray-500">Nenhuma sugestão encontrada</p>
          ) : (
            sugestoes.map((materia, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 flex justify-between items-center hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-700">
                    {materia.nome} - {materia.id}
                  </p>
                  <p className="text-sm text-gray-500">
                    {materia.descricao}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* rodapé */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}