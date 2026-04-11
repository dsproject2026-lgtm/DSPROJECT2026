import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { electorElectionsData } from '@/features/elector/data/elections';

function getStatusChipClass(status: string) {
  if (status === 'ACTIVA') return 'bg-[#f5c400] text-[#3d3d3d]';
  if (status === 'PROGRAMADA') return 'bg-[#d6d8dd] text-[#4a4e57]';
  return 'bg-[#d9d9d9] text-[#50545b]';
}

export function ElectorElectionDetailsPage() {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();

  const election = useMemo(
    () => electorElectionsData.find((item) => item.id === electionId) ?? null,
    [electionId],
  );

  if (!election) {
    return (
      <section className="mx-auto w-full max-w-md border border-[#e5e7eb] bg-white p-5">
        <h1 className="text-[18px] font-bold text-[#111827]">Eleição não encontrada</h1>
        <p className="mt-2 text-[13px] text-[#6b7280]">
          Não foi possível localizar os detalhes desta eleição.
        </p>
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="mt-4 h-11 rounded-[2px] bg-[#2050d8] px-5 text-[11px] font-semibold tracking-[0.08em] text-white uppercase"
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md border border-[#e5e7eb] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-[2px] px-2 py-[5px] text-[9px] font-bold tracking-[0.16em] uppercase ${getStatusChipClass(
            election.status,
          )}`}
        >
          {election.status}
        </span>
        <p className="text-[11px] font-medium tracking-[0.11em] text-[#8a919f] uppercase">
          Detalhes da eleição
        </p>
      </div>

      <h1 className="mt-5 text-[24px] leading-[1.1] font-bold text-[#171d2a]">{election.title}</h1>
      <p className="mt-3 text-[13px] leading-[1.55] text-[#5d6472]">{election.desc}</p>

      <div className="mt-6 space-y-3 border-t border-[#eef0f4] pt-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7f8693] uppercase">Período</p>
          <p className="mt-1 text-[14px] font-semibold text-[#1f2937]">{election.date}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7f8693] uppercase">Estado</p>
          <p className="mt-1 text-[14px] font-semibold text-[#1f2937]">{election.fase}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7f8693] uppercase">Eleitorado</p>
          <p className="mt-1 text-[14px] text-[#1f2937]">{election.eleitorado}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7f8693] uppercase">Local</p>
          <p className="mt-1 text-[14px] text-[#1f2937]">{election.local}</p>
        </div>
      </div>

      <div className="mt-7 flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="h-11 flex-1 rounded-[2px] border border-[#d8dce3] bg-[#f7f8fa] text-[11px] font-semibold tracking-[0.05em] text-[#1f2937] uppercase"
        >
          Voltar
        </button>
        {election.status !== 'PARTICIPOU' && (
          <button
            type="button"
            onClick={() => navigate(`/eleitor/elections/${election.id}`)}
            className={`h-11 flex-1 rounded-[2px] text-[11px] font-semibold tracking-[0.08em] text-white uppercase ${
              election.status === 'ACTIVA' ? 'bg-[#2050d8]' : 'bg-[#9bb1ea]'
            }`}
          >
            Participar
          </button>
        )}
      </div>
    </section>
  );
}
