import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { electionsApi } from '@/api/elections.api';
import { Spinner, toast } from '@/components/ui';
import { env } from '@/config/env';
import { getElectorVoteReceipt, saveElectorVoteReceipt, type ElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';
import { ApiError } from '@/lib/http/api-error';
import type { ElectionListItem, ElectionResults, VoteStatusResult } from '@/types/elector';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isVoteCastEvent(value: unknown): value is { electionId: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.electionId === 'string' && candidate.electionId.length > 0;
}

function formatVoteDate(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatVoteTime(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function CandidateAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dbeafe] text-xs font-bold text-[#1d4ed8]">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#16a34a]">
      <svg
        viewBox="0 0 24 24"
        className="h-12 w-12 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
}

export function ElectorConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [voteReceipt, setVoteReceipt] = useState<ElectorVoteReceipt | null>(() => getElectorVoteReceipt());
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);

  useEffect(() => {
    if (voteReceipt) {
      return;
    }

    let isActive = true;

    const loadFallbackReceipt = async () => {
      setIsLoadingFallback(true);

      try {
        const electionIdParam = searchParams.get('electionId');

        if (electionIdParam && isUuid(electionIdParam)) {
          const [status, election] = await Promise.all([
            electionsApi.getMyVoteStatus(electionIdParam),
            electionsApi.getById(electionIdParam).catch(() => null),
          ]);

          if (!isActive || !status.hasVoted || !status.receiptCode) {
            return;
          }

          const receipt: ElectorVoteReceipt = {
            electionId: status.electionId,
            candidateId: '',
            confirmedAt: status.votedAt ?? new Date().toISOString(),
            confirmationCode: status.receiptCode,
            electionTitle: election?.titulo,
          };

          saveElectorVoteReceipt(receipt);
          setVoteReceipt(receipt);
          return;
        }

        const elections = await electionsApi.list();
        let latestReceipt: ElectorVoteReceipt | null = null;
        let latestTimestamp = 0;

        await Promise.all(
          elections.items.map(async (item) => {
            try {
              const status = await electionsApi.getMyVoteStatus(item.id);
              if (!status.hasVoted || !status.receiptCode) {
                return;
              }

              const votedTimestamp = status.votedAt ? new Date(status.votedAt).getTime() : 0;
              if (Number.isNaN(votedTimestamp) || votedTimestamp < latestTimestamp) {
                return;
              }

              latestTimestamp = votedTimestamp;
              latestReceipt = {
                electionId: status.electionId,
                candidateId: '',
                confirmedAt: status.votedAt ?? new Date().toISOString(),
                confirmationCode: status.receiptCode,
                electionTitle: item.titulo,
              };
            } catch (cause) {
              if (cause instanceof ApiError && cause.code !== 'AUTH_TOKEN_REQUIRED') {
                return;
              }
              throw cause;
            }
          }),
        );

        if (!isActive || !latestReceipt) {
          return;
        }

        saveElectorVoteReceipt(latestReceipt);
        setVoteReceipt(latestReceipt);
      } catch {
        // Keep silent and render the unavailable state.
      } finally {
        if (isActive) {
          setIsLoadingFallback(false);
        }
      }
    };

    void loadFallbackReceipt();

    return () => {
      isActive = false;
    };
  }, [searchParams, voteReceipt]);

  const confirmedAt = useMemo(() => {
    const confirmedAtParam = voteReceipt?.confirmedAt;

    if (!confirmedAtParam) {
      return new Date();
    }

    const parsed = new Date(confirmedAtParam);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [voteReceipt?.confirmedAt]);

  const electionId = voteReceipt?.electionId ?? '';
  const candidateId = voteReceipt?.candidateId ?? '';
  const confirmationCode = voteReceipt?.confirmationCode ?? '';

  if (isLoadingFallback) {
    return (
      <section className="mx-auto flex min-h-[260px] w-full max-w-xl items-center justify-center rounded-lg bg-white p-5 font-sans shadow-sm">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-base font-medium capitalize">A Carregar Comprovativo...</span>
        </div>
      </section>
    );
  }

  if (!voteReceipt) {
    return (
      <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0f172a]">Comprovativo indisponível</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          O comprovativo é exibido apenas após confirmar um voto válido.
        </p>
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex flex-col items-center pt-2">
        <CheckCircleIcon />

        <h1 className="mt-8 max-w-[280px] text-center text-[24px] font-extrabold leading-tight text-[#111827]">
          Voto realizado com sucesso.
        </h1>

        <p className="mt-4 max-w-[290px] text-center text-[14px] leading-7 text-[#6b7280]">
          O seu comprovativo digital foi gerado e está encriptado para a sua segurança.
        </p>
      </div>

      <div className="mt-8 h-[5px] w-full rounded-full bg-[#f3e5b7]">
        <div className="h-[5px] w-[62%] rounded-full bg-[#e9b321]" />
      </div>

      <div className="mt-5 rounded-[20px] bg-[#f8f8f9] px-5 pb-5 pt-6">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b95a3]">
            Código de confirmação
          </p>

          <div className="mt-3 rounded-xl bg-[#ececef] px-4 py-4">
            <p className="text-[20px] font-extrabold tracking-[0.14em] text-[#1f2937]">{confirmationCode}</p>
          </div>
        </div>

        <div className="mt-5 h-px bg-[#e2e8f0]" />

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b95a3]">Data</p>
            <p className="mt-2 text-[15px] font-bold text-[#1f2937]">{formatVoteDate(confirmedAt)}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b95a3]">Hora</p>
            <p className="mt-2 text-[15px] font-bold text-[#1f2937]">{formatVoteTime(confirmedAt)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-[12px] text-[#64748b]">
            <span className="font-bold text-[#334155]">Eleição:</span> {voteReceipt.electionTitle ?? electionId}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/eleitor/resultados?electionId=${encodeURIComponent(electionId)}&candidateId=${encodeURIComponent(
                candidateId,
              )}`,
            )
          }
          className="flex-1 rounded-2xl bg-[#2d5fe1] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white"
        >
          Ver resultados
        </button>
      </div>
    </section>
  );
}

export function ElectorResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const voteReceipt = useMemo(() => getElectorVoteReceipt(), []);

  const [participatedElections, setParticipatedElections] = useState<
    Array<{
      election: ElectionListItem;
      voteStatus: VoteStatusResult;
    }>
  >([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [resultData, setResultData] = useState<ElectionResults | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryElectionId = searchParams.get('electionId') ?? '';

  useEffect(() => {
    let isActive = true;

    const loadParticipated = async () => {
      setIsBootLoading(true);
      setError(null);

      try {
        const elections = await electionsApi.list();
        const votedEntries = await Promise.all(
          elections.items.map(async (item) => {
            try {
              const status = await electionsApi.getMyVoteStatus(item.id);
              if (!status.hasVoted) {
                return null;
              }

              return {
                election: item,
                voteStatus: status,
              };
            } catch (cause) {
              if (cause instanceof ApiError && cause.code !== 'AUTH_TOKEN_REQUIRED') {
                return null;
              }
              throw cause;
            }
          }),
        );

        if (!isActive) {
          return;
        }

        const participated = votedEntries
          .filter((entry): entry is { election: ElectionListItem; voteStatus: VoteStatusResult } => Boolean(entry))
          .sort((a, b) => {
            const dateA = a.voteStatus.votedAt ? new Date(a.voteStatus.votedAt).getTime() : 0;
            const dateB = b.voteStatus.votedAt ? new Date(b.voteStatus.votedAt).getTime() : 0;
            return dateB - dateA;
          });

        setParticipatedElections(participated);

        if (participated.length === 0) {
          setSelectedElectionId('');
          setResultData(null);
          setError('Ainda não participou em nenhuma eleição.');
          return;
        }

        const preferredElectionId =
          (queryElectionId && isUuid(queryElectionId) ? queryElectionId : '') ||
          voteReceipt?.electionId ||
          participated[0].election.id;

        const hasPreferred = participated.some((entry) => entry.election.id === preferredElectionId);
        setSelectedElectionId(hasPreferred ? preferredElectionId : participated[0].election.id);
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message = cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições votadas.';

        setError(message);
        toast.danger(message);
      } finally {
        if (isActive) {
          setIsBootLoading(false);
        }
      }
    };

    void loadParticipated();

    return () => {
      isActive = false;
    };
  }, [queryElectionId, voteReceipt?.electionId]);

  useEffect(() => {
    if (!selectedElectionId) {
      return;
    }

    if (!isUuid(selectedElectionId)) {
      setError('ID de eleição inválido. Volte ao dashboard do eleitor e selecione uma eleição válida.');
      return;
    }

    let isActive = true;

    const loadResults = async () => {
      setIsResultsLoading(true);
      setError(null);

      try {
        const data = await electionsApi.getResults(selectedElectionId);

        if (!isActive) {
          return;
        }

        setResultData(data);
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar os resultados da eleição.';

        setError(message);
        toast.danger(message);
      } finally {
        if (isActive) {
          setIsResultsLoading(false);
        }
      }
    };

    void loadResults();

    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  useEffect(() => {
    if (!selectedElectionId || !isUuid(selectedElectionId)) {
      return;
    }

    const eventSource = new EventSource(`${env.apiBaseUrl}/events/stream`);

    const handleVoteCast = (event: Event) => {
      const messageEvent = event as MessageEvent<string>;

      try {
        const parsed = JSON.parse(messageEvent.data) as unknown;

        if (!isVoteCastEvent(parsed) || parsed.electionId !== selectedElectionId) {
          return;
        }

        void electionsApi
          .getResults(selectedElectionId)
          .then((data) => {
            setResultData(data);
          })
          .catch(() => {
            // Silently ignore transient refresh failures.
          });
      } catch {
        // Ignore invalid event payloads.
      }
    };

    eventSource.addEventListener('vote_cast', handleVoteCast);

    return () => {
      eventSource.removeEventListener('vote_cast', handleVoteCast);
      eventSource.close();
    };
  }, [selectedElectionId]);

  const highlightedCandidateId = useMemo(() => {
    if (!resultData) {
      return '';
    }

    return resultData.winner?.candidateId ?? '';
  }, [resultData]);

  if (isBootLoading) {
    return (
      <section className="mx-auto flex min-h-[260px] w-full max-w-md items-center justify-center rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar resultados...</span>
        </div>
      </section>
    );
  }

  if (error && participatedElections.length === 0) {
    return (
      <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0f172a]">Resultados indisponíveis</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white"
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 rounded-[20px] bg-[#f8f8f9] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
          Eleições em que participou
        </p>
        <div className="mt-3 space-y-2">
          {participatedElections.map((entry) => {
            const isActive = entry.election.id === selectedElectionId;
            return (
              <button
                key={entry.election.id}
                type="button"
                onClick={() => setSelectedElectionId(entry.election.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? 'border-[#2d5fe1] bg-white'
                    : 'border-[#e5e7eb] bg-white hover:border-[#c7d2fe]'
                }`}
              >
                <p className="truncate text-[13px] font-bold text-[#1f2937]">{entry.election.titulo}</p>
                <p className="mt-1 text-[11px] text-[#6b7280]">
                  Votou em {entry.voteStatus.votedAt ? formatVoteDate(new Date(entry.voteStatus.votedAt)) : '-'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {isResultsLoading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-3 text-[#334155]">
            <Spinner color="accent" />
            <span className="text-sm font-semibold">A carregar resultados...</span>
          </div>
        </div>
      ) : error || !resultData ? (
        <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4">
          <h1 className="text-base font-semibold text-[#0f172a]">Resultados indisponíveis</h1>
          <p className="mt-2 text-sm text-[#64748b]">
            {error ?? 'Não foi possível localizar a eleição pedida.'}
          </p>
        </div>
      ) : (
        <>
      <header>
        <h1 className="max-w-[290px] text-[18px] font-extrabold leading-tight text-[#111827] sm:text-[20px]">
          {resultData.election.titulo}
        </h1>
        <p className="mt-2 text-[12px] text-[#6b7280]">Estado: {resultData.election.estado}</p>
      </header>

      <div className="mt-4 rounded-[20px] bg-[#f8f8f9] p-4">
        <p className="text-[12px] text-[#475569]">Total de elegíveis: {resultData.summary.totalEligibleVoters.toLocaleString('pt-PT')}</p>
        <p className="mt-1 text-[12px] text-[#475569]">Total de votos: {resultData.summary.totalVotes.toLocaleString('pt-PT')}</p>
        <p className="mt-1 text-[12px] text-[#475569]">Participação: {resultData.summary.turnoutPercentage.toFixed(2)}%</p>
      </div>

      <div className="mt-5 space-y-3">
        {resultData.candidates.map((candidate) => {
          const isHighlighted = candidate.id === highlightedCandidateId;

          return (
            <div
              key={candidate.id}
              className={`rounded-2xl border p-3 ${
                isHighlighted ? 'border-[#f1d58b] bg-[#fdf7e8]' : 'border-[#e5e7eb] bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <CandidateAvatar name={candidate.nome} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`truncate text-[14px] font-extrabold ${isHighlighted ? 'text-[#0b63c8]' : 'text-[#1f2937]'}`}>
                      {candidate.nome}
                    </p>

                    <div className="text-right">
                      <p className={`text-[18px] font-extrabold ${isHighlighted ? 'text-[#0b63c8]' : 'text-[#1f2937]'}`}>
                        {candidate.percentage.toFixed(2)}%
                      </p>
                      <p className="text-[11px] text-[#8b95a3]">{candidate.votes.toLocaleString('pt-PT')} votos</p>
                    </div>
                  </div>

                  <div className="mt-3 h-[4px] w-full rounded-full bg-[#eceef2]">
                    <div className="h-[4px] rounded-full bg-[#e9b321]" style={{ width: `${candidate.percentage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}
    </section>
  );
}
