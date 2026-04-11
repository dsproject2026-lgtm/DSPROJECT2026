import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { electorElectionsData } from '@/features/elector/data/elections';

const filters = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'ACTIVA', label: 'Activa' },
  { key: 'PROGRAMADA', label: 'Programada' },
  { key: 'PARTICIPOU', label: 'Participou' },
] as const;

type ElectionFilter = (typeof filters)[number]['key'];

export function ElectorDashboardPage() {
  const [filter, setFilter] = useState<ElectionFilter>('TODAS');
  const navigate = useNavigate();

  const filtered = electorElectionsData.filter((e) => {
    if (filter === 'TODAS') return true;
    return e.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVA':
        return 'bg-[#f5c400] text-[#3d3d3d]';
      case 'PROGRAMADA':
        return 'bg-[#d6d8dd] text-[#4a4e57]';
      case 'PARTICIPOU':
        return 'bg-[#d9d9d9] text-[#50545b]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCardAccent = (status: string) =>
    status === 'PARTICIPOU' ? 'border-l-[#c8cad1]' : 'border-l-[#F9BA1C]';

  return (
    <div className="w-full pb-3">
      <div className="w-full px-2 py-3 sm:px-3">
        <div className="mb-7">
          <h1 className="text-[11px] tracking-[0.34em] text-[#2f3340] uppercase">
            Portal de Votação
          </h1>
          <h2 className="mt-1 text-[25px] leading-[1.05] font-bold tracking-[-0.02em] text-[#101521] sm:text-[27px]">
            Eleições Disponíveis
          </h2>
          <div className="mt-4 h-[4px] w-12 bg-[#F9BA1C]" />
        </div>

        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-xl border px-4 py-2 text-[14px] leading-none font-medium transition ${
                  filter === f.key
                    ? 'border-[#dbe1ea] bg-white text-[#151923]'
                    : 'border-transparent text-[#464c56]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {filtered.map((e) => (
            <article
              key={e.id}
              className={`rounded-none border border-[#e7e9ee] border-l-4 bg-[#f7f7f8] px-4 py-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:px-5 sm:py-6 ${getCardAccent(
                e.status,
              )}`}
            >
              <div className="mb-5 flex items-start justify-between">
                <span
                  className={`rounded-[2px] px-2 py-[5px] text-[9px] font-bold tracking-[0.16em] uppercase ${getStatusColor(
                    e.status,
                  )}`}
                >
                  {e.status}
                </span>
                <button
                  type="button"
                  className="flex flex-col items-center gap-[3px] pt-[2px]"
                  aria-label="Mais opções"
                >
                  <span className="h-[4px] w-[4px] rounded-full bg-[#b6bbc5]" />
                  <span className="h-[4px] w-[4px] rounded-full bg-[#b6bbc5]" />
                  <span className="h-[4px] w-[4px] rounded-full bg-[#b6bbc5]" />
                </button>
              </div>

              <h3 className="text-[20px] leading-[1.08] font-bold tracking-[-0.02em] text-[#171d2a] sm:text-[22px]">
                {e.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.4] text-[#5d6472]">{e.desc}</p>

              <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[#7f8693]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[#7f8693]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3.5" y="5.5" width="17" height="15" rx="1.8" />
                  <path d="M7 3.5V7M17 3.5V7M3.5 9.5h17" />
                </svg>
                <span>{e.date}</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 sm:flex-nowrap">
                {e.status !== 'PARTICIPOU' ? (
                  <>
                    <button
                      onClick={() => navigate(`/eleitor/elections/${e.id}`)}
                      className={`h-12 min-w-0 flex-1 rounded-[2px] px-3 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                        e.status === 'ACTIVA'
                          ? 'bg-[#2050d8] text-white'
                          : 'bg-[#9bb1ea] text-white'
                      }`}
                    >
                      Participar
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/eleitor/election-details/${e.id}`)}
                      className="h-12 min-w-0 flex-1 rounded-[2px] border border-[#d6d8dd] bg-[#f7f8fa] px-3 text-[11px] font-semibold tracking-[0.02em] text-[#2050d8] uppercase sm:min-w-[114px] sm:flex-none"
                    >
                      Detalhes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/eleitor/election-details/${e.id}`)}
                    className="h-12 w-full rounded-[2px] border border-[#d8dbe1] bg-[#f7f8fa] text-[11px] font-semibold tracking-[0.02em] text-[#1f2531] uppercase"
                  >
                    Ver detalhes
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
