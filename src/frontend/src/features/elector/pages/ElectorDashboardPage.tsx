import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { electionsApi } from '@/api/elections.api';
import { Spinner, toast } from '@/components/ui';
import type { BackendElectionState } from '@/types/elector';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';

const filters = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PROGRAMADA', label: 'Programada' },
  { key: 'ABERTA', label: 'Aberta' },
  { key: 'CONCLUIDA', label: 'Concluída' },
  { key: 'PARTICIPOU', label: 'Participou' },
] as const;

type ElectionFilter = (typeof filters)[number]['key'];

interface ElectorElectionCard {
  id: string;
  estado: BackendElectionState;
  hasVoted: boolean;
  isEligible: boolean;
  title: string;
  desc: string;
  date: string;
  local: string;
  eleitorado: string;
  fase: string;
  canParticipate: boolean;
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return 'Período não definido';
  }

  const fmt = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  const safeStart = startDate && !Number.isNaN(startDate.getTime()) ? fmt.format(startDate) : null;
  const safeEnd = endDate && !Number.isNaN(endDate.getTime()) ? fmt.format(endDate) : null;

  if (safeStart && safeEnd) {
    return `${safeStart} - ${safeEnd}`;
  }

  return safeStart ?? safeEnd ?? 'Período inválido';
}

function mapPhase(estado: BackendElectionState) {
  switch (estado) {
    case 'ABERTA':
      return 'Votação em curso';
    case 'CONCLUIDA':
      return 'Concluída';
    case 'PROGRAMADA':
      return 'Programada';
    default:
      return 'Aguardando início';
  }
}

export function ElectorDashboardPage() {
  const [filter, setFilter] = useState<ElectionFilter>('TODAS');
  const [elections, setElections] = useState<ElectorElectionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await electionsApi.list();

        const cards = await Promise.all(
          response.items.map(async (item) => {
            let hasVoted = false;
            let isEligible = false;

            try {
              const voteStatus = await electionsApi.getMyVoteStatus(item.id);
              hasVoted = voteStatus.hasVoted;
              isEligible = voteStatus.isEligible;
            } catch (cause) {
              if (!(cause instanceof ApiError) || cause.code === 'AUTH_TOKEN_REQUIRED') {
                throw cause;
              }
            }

            return {
              id: item.id,
              estado: item.estado,
              hasVoted,
              isEligible,
              title: item.titulo,
              desc: item.descricao ?? 'Sem descrição disponível para esta eleição.',
              date: formatDateRange(item.dataInicioVotacao, item.dataFimVotacao),
              local: item.cargo.nome,
              eleitorado: isEligible ? 'Eleitor elegivel nesta eleicao' : 'Sem elegibilidade nesta eleicao',
              fase: mapPhase(item.estado),
              canParticipate: item.estado === 'ABERTA' && isEligible && !hasVoted,
            } satisfies ElectorElectionCard;
          }),
        );

        if (!isActive) {
          return;
        }

        setElections(cards);
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message =
          cause instanceof ApiError
            ? cause.message
            : 'Não foi possível carregar as eleições do eleitor.';

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
  }, []);

  const filtered = useMemo(() => {
    return elections.filter((election) => {
      if (filter === 'TODAS') {
        return true;
      }

      if (filter === 'PARTICIPOU') {
        return election.hasVoted;
      }

      return election.estado === filter;
    });
  }, [elections, filter]);

  const getStatusColor = (estado: BackendElectionState) => {
    const color = getStateChipColor(estado);
    if (color === 'success') return 'bg-[#DEF7EC] text-[#057A55]';
    if (color === 'warning') return 'bg-[#FEF3C7] text-[#C27803]';
    if (color === 'primary') return 'bg-[#EBF2FF] text-[#1A56DB]';
    if (color === 'danger') return 'bg-[#FDE8E8] text-[#C81E1E]';
    return 'bg-gray-100 text-gray-700';
  };

  const getCardAccent = (election: ElectorElectionCard) =>
    election.hasVoted ? 'border-l-[#c8cad1]' : 'border-l-[#F9BA1C]';

  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-base font-medium capitalize">A carregar eleições...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="font-sans rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold capitalize text-[#0f172a]">Falha ao Carregar Eleições</h1>
        <p className="mt-2 text-base text-[#64748b]">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-[#2563eb] px-4 py-2 text-base font-medium text-white capitalize"
        >
          Tentar Novamente
        </button>
      </section>
    );
  }

  return (
    <div className="w-full pb-3 font-sans">
      <div className="w-full px-2 py-3 sm:px-3">
        <div className="mb-7">
          <h1 className="text-sm tracking-[0.34em] text-[#2f3340] uppercase">Portal de Votação</h1>
          <h2 className="mt-1 text-4xl leading-tight font-bold tracking-tight capitalize text-[#101521]">
            Eleições Disponíveis
          </h2>
          <div className="mt-4 h-[4px] w-12 bg-[#F9BA1C]" />
        </div>

        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            {filters.map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-lg border px-4 py-2 text-base font-medium transition capitalize ${
                  filter === item.key
                    ? 'border-[#dbe1ea] bg-white text-[#151923]'
                    : 'border-transparent text-[#464c56]'
                }`}
              >
                {item.label.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 text-center text-base capitalize text-[#64748b]">
            Nenhuma eleição encontrada para o filtro seleccionado.
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((election) => (
              <article
                key={election.id}
                className={`border border-[#e7e9ee] border-l-4 bg-[#f7f7f8] px-4 py-5 shadow-sm sm:px-5 sm:py-6 ${getCardAccent(
                  election,
                )}`}
              >
                <div className="mb-5 flex items-start justify-between">
                  <span
                    className={`rounded-md px-2 py-[5px] text-sm font-semibold capitalize ${getStatusColor(
                      election.estado,
                    )}`}
                  >
                    {formatStateLabel(election.estado).toLowerCase()}
                  </span>
                  {election.hasVoted ? (
                    <span className="rounded-md bg-[#d9d9d9] px-2 py-[5px] text-sm font-semibold capitalize text-[#50545b]">
                      participou
                    </span>
                  ) : null}
                </div>

                <h3 className="text-2xl leading-tight font-bold tracking-tight capitalize text-[#171d2a]">
                  {election.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[#5d6472]">{election.desc}</p>

                <div className="mt-4 flex items-center gap-2 text-base font-medium text-[#7f8693]">
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
                  <span>{election.date}</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 sm:flex-nowrap">
                  {!election.hasVoted ? (
                    <>
                      <button
                        onClick={() => navigate(`/eleitor/elections/${election.id}`)}
                        disabled={!election.canParticipate}
                        className={`h-12 min-w-0 flex-1 rounded-lg px-3 text-base font-medium capitalize ${
                          election.canParticipate
                            ? 'bg-[#2050d8] text-white'
                            : 'bg-[#9bb1ea] text-white opacity-85'
                        }`}
                      >
                        Participar
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/eleitor/election-details/${election.id}`)}
                        className="h-12 min-w-0 flex-1 rounded-lg border border-[#d6d8dd] bg-[#f7f8fa] px-3 text-base font-medium capitalize text-[#2050d8] sm:min-w-[114px] sm:flex-none"
                      >
                        Detalhes
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/eleitor/election-details/${election.id}`)}
                      className="h-12 w-full rounded-sm border border-[#d8dbe1] bg-[#f7f8fa] text-base font-medium capitalize text-[#1f2531]"
                    >
                      Ver Detalhes
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

