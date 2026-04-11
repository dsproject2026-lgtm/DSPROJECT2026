import { useState } from "react";
import { sessionStorageService } from "@/lib/storage/session-storage";
import { useNavigate } from "react-router-dom";

const electionsData = [
  {
    id: 1,
    status: "ACTIVA",
    title: "Eleições AEUP 2026",
    desc: "Associação de Estudantes da Universidade Pedagógica - Mandato Bienal.",
    date: "12 MAI - 14 MAI, 2026",
  },
  {
    id: 2,
    status: "PROGRAMADA",
    title: "Eleições AEUP 2026",
    desc: "Associação de Estudantes da Universidade Pedagógica - Mandato Bienal.",
    date: "12 MAI - 14 MAI, 2026",
  },
  {
    id: 3,
    status: "PARTICIPOU",
    title: "Conselho Universitário",
    desc: "Representantes de curso para o Conselho Geral da Gestão Universitária.",
    date: "20 JUN - 22 JUN, 2026",
  },
];

export function DashboardPage() {
  const session = sessionStorageService.getSession();
  const [filter, setFilter] = useState("TODAS");
  const navigate = useNavigate();

  const filtered = electionsData.filter((e) => {
    if (filter === "TODAS") return true;
    return e.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVA":
        return "bg-yellow-100 text-yellow-700";
      case "PROGRAMADA":
        return "bg-blue-100 text-blue-700";
      case "PARTICIPOU":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xs sm:text-sm text-gray-500 uppercase">
          Portal de Votação
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold">
          Eleições Disponíveis
        </h2>
      </div>

      {/* Filters (RESPONSIVO COM SCROLL) */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {["TODAS", "ACTIVA", "PROGRAMADA", "PARTICIPOU"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap transition ${
                filter === f
                  ? "bg-yellow-400 text-white border-yellow-400"
                  : "bg-white text-gray-600"
              }`}
            >
              {f === "TODAS"
                ? "Todas"
                : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="bg-white rounded-2xl shadow p-4 border-l-4 border-yellow-400"
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-xs px-2 py-1 rounded ${getStatusColor(
                  e.status
                )}`}
              >
                {e.status}
              </span>
              <button className="text-gray-400">⋮</button>
            </div>

            <h3 className="font-semibold text-base sm:text-lg">
              {e.title}
            </h3>
            <p className="text-sm text-gray-500 mb-2">{e.desc}</p>

            <div className="text-xs text-gray-400 mb-3">
              📅 {e.date}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {e.status !== "PARTICIPOU" && (
                <button
 onClick={() => navigate(`/elections?id=${e.id}`)}
  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
>
  PARTICIPAR
</button>
              )}
              <button className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm">
                DETALHES
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        <button className="text-blue-600 text-xs sm:text-sm">
          VOTAR
        </button>
        <button className="text-gray-400 text-xs sm:text-sm">
          CONFIRMAÇÃO
        </button>
        <button className="text-gray-400 text-xs sm:text-sm">
          RESULTADOS
        </button>
      </div>
    </div>
  );
}