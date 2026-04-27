import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { electionsApi } from '@/api/elections.api';
import { Spinner, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { ElectionListItem, VoteStatusResult } from '@/types/elector';

function getStatusChipClass(status: string) {
  if (status === 'ACTIVA') return 'bg-[#f5c400] text-[#3d3d3d]';
  if (status === 'PROGRAMADA') return 'bg-[#d6d8dd] text-[#4a4e57]';
  return 'bg-[#d9d9d9] text-[#50545b]';
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return 'Período não definido';
  }

  const formatter = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const startValue = start ? new Date(start) : null;
  const endValue = end ? new Date(end) : null;
  const safeStart = startValue && !Number.isNaN(startValue.getTime()) ? formatter.format(startValue) : null;
  const safeEnd = endValue && !Number.isNaN(endValue.getTime()) ? formatter.format(endValue) : null;

  if (safeStart && safeEnd) {
    return `${safeStart} - ${safeEnd}`;
  }

  return safeStart ?? safeEnd ?? 'Período inválido';
}

function toUiStatus(election: ElectionListItem, voteStatus: VoteStatusResult | null) {
  if (voteStatus?.hasVoted) {
    return 'PARTICIPOU';
  }

  if (election.estado === 'ABERTA') {
    return 'ACTIVA';
  }

  return 'PROGRAMADA';
}

function phaseLabel(estado: ElectionListItem['estado']) {
  switch (estado) {
    case 'ABERTA':
      return 'Votação em curso';
    case 'CONCLUIDA':
      return 'Concluída';
    case 'CANCELADA':
      return 'Cancelada';
    case 'PENDENTE':
      return 'Pendente';
    default:
      return 'Pendente';
  }
}

export function ElectorElectionDetailsPage() {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();

  const [election, setElection] = useState<ElectionListItem | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatusResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!electionId) {
      setError('ID de eleição inválido.');
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const electionData = await electionsApi.getById(electionId);
        let voteData: VoteStatusResult | null = null;

        try {
          voteData = await electionsApi.getMyVoteStatus(electionId);
        } catch (cause) {
          if (!(cause instanceof ApiError) || cause.code === 'AUTH_TOKEN_REQUIRED') {
            throw cause;
          }
        }

        if (!isActive) {
          return;
        }

        setElection(electionData);
        setVoteStatus(voteData);
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar os detalhes da eleição.';

        setError(message);
        toast.danger(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [electionId]);

  const electionStatus = useMemo(() => {
    if (!election) {
      return 'PROGRAMADA';
    }

    return toUiStatus(election, voteStatus);
  }, [election, voteStatus]);

  const canParticipate =
    Boolean(electionId) && election?.estado === 'ABERTA' && voteStatus?.hasVoted !== true;

  if (isLoading) {
    return (
      <section className="mx-auto flex min-h-[240px] w-full max-w-xl items-center justify-center rounded-lg border border-[#e5e7eb] bg-white p-5 font-sans">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-base font-medium capitalize">A Carregar Detalhes...</span>
        </div>
      </section>
    );
  }

  if (error || !election) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-lg border border-[#e5e7eb] bg-white p-5 font-sans">
        <h1 className="text-xl font-bold capitalize text-[#111827]">Eleição Não Encontrada</h1>
        <p className="mt-2 text-base text-[#6b7280]">
          {error ?? 'Não foi possível localizar os detalhes desta eleição.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="mt-4 h-11 rounded-lg bg-[#2050d8] px-5 text-base font-medium capitalize text-white"
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-lg border border-[#e5e7eb] bg-white p-5 font-sans">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-md px-2 py-[5px] text-sm font-semibold capitalize ${getStatusChipClass(
            electionStatus,
          )}`}
        >
          {electionStatus.toLowerCase()}
        </span>
        <p className="text-sm font-medium text-[#8a919f] capitalize">
          Detalhes da Eleição
        </p>
      </div>

      <h1 className="mt-5 text-2xl leading-tight font-bold capitalize text-[#171d2a]">{election.titulo}</h1>
      <p className="mt-3 text-base leading-relaxed text-[#5d6472]">
        {election.descricao ?? 'Sem descrição disponível.'}
      </p>

      <div className="mt-6 space-y-3 border-t border-[#eef0f4] pt-5">
        <div>
          <p className="text-sm font-semibold capitalize text-[#7f8693]">Período</p>
          <p className="mt-1 text-base font-semibold text-[#1f2937]">
            {formatDateRange(election.dataInicioVotacao, election.dataFimVotacao)}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-[#7f8693]">Estado</p>
          <p className="mt-1 text-base font-semibold text-[#1f2937]">{phaseLabel(election.estado)}</p>
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-[#7f8693]">Eleitorado</p>
          <p className="mt-1 text-base text-[#1f2937]">Eleitores elegíveis da eleição</p>
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-[#7f8693]">Cargo</p>
          <p className="mt-1 text-base text-[#1f2937]">{election.cargo.nome}</p>
        </div>
      </div>

      <div className="mt-7 flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="h-11 flex-1 rounded-lg border border-[#d8dce3] bg-[#f7f8fa] text-base font-medium capitalize text-[#1f2937]"
        >
          Voltar
        </button>
        {electionStatus !== 'PARTICIPOU' && (
          <button
            type="button"
            onClick={() => navigate(`/eleitor/elections/${election.id}`)}
            disabled={!canParticipate}
            className={`h-11 flex-1 rounded-lg text-base font-medium capitalize text-white ${
              canParticipate ? 'bg-[#2050d8]' : 'bg-[#9bb1ea] opacity-85'
            }`}
          >
            Participar
          </button>
        )}
      </div>
    </section>
  );
}
