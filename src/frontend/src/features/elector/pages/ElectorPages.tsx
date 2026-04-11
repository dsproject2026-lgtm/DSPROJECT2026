import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';

interface CandidateResult {
  id: string;
  nome: string;
  detalhe?: string;
  foto?: string;
  votos: number;
  percentual: number;
}

interface ElectionResultData {
  id: string;
  titulo: string;
  cargo: string;
  initialCountdownSeconds: number;
  candidatos: CandidateResult[];
}

const electionResultsData: Record<string, ElectionResultData> = {
  '1': {
    id: '1',
    titulo: 'Eleições AEUP 2026',
    cargo: 'Presidente da Direção',
    initialCountdownSeconds: 4 * 60 * 60 + 12 * 60 + 45,
    candidatos: [
      {
        id: 'ricardo-mondlane',
        nome: 'Ricardo Mondlane',
        foto: '/images/candidates/ricardo-mondlane.png',
        votos: 1184,
        percentual: 9.5,
      },
      {
        id: 'ana-bela',
        nome: 'Ana Bela Chissano',
        foto: '/images/candidates/ana-bela.png',
        votos: 3996,
        percentual: 32.1,
      },
      {
        id: 'sergio-mabunda',
        nome: 'Sérgio Mabunda',
        foto: '/images/candidates/sergio-mabunda.png',
        votos: 7270,
        percentual: 58.4,
      },
    ],
  },
  '2': {
    id: '2',
    titulo: 'Eleições AEUP 2026',
    cargo: 'Representante Principal',
    initialCountdownSeconds: 12 * 60 * 60 + 1 * 60 + 10,
    candidatos: [
      {
        id: 'beatriz-sitoe',
        nome: 'Beatriz Sitoe',
        votos: 2140,
        percentual: 51.2,
      },
      {
        id: 'joao-mondlane',
        nome: 'João Mondlane',
        votos: 2040,
        percentual: 48.8,
      },
    ],
  },
  '3': {
    id: '3',
    titulo: 'Conselho Universitário',
    cargo: 'Representante da Faculdade',
    initialCountdownSeconds: 9 * 60 * 60 + 58 * 60 + 22,
    candidatos: [
      {
        id: 'lucia-gove',
        nome: 'Lúcia Gove',
        votos: 1670,
        percentual: 44.8,
      },
      {
        id: 'samuel-ubisse',
        nome: 'Samuel Ubisse',
        votos: 2056,
        percentual: 55.2,
      },
    ],
  },
};

const electionNamesById: Record<string, string> = {
  '1': 'Eleições AEUP 2026',
  '2': 'Eleições AEUP 2026',
  '3': 'Conselho Universitário',
};

const candidateNamesById: Record<string, string> = {
  'ricardo-mondlane': 'Ricardo Mondlane',
  'ana-bela': 'Ana Bela Chissano',
  'sergio-mabunda': 'Sérgio Mabunda',
  'beatriz-sitoe': 'Beatriz Sitoe',
  'joao-mondlane': 'João Mondlane',
  'lucia-gove': 'Lúcia Gove',
  'samuel-ubisse': 'Samuel Ubisse',
  'voto-branco': 'Voto em Branco',
};

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function getDeadlineStorageKey(electionId: string) {
  return `election:${electionId}:deadline`;
}

function ensureElectionDeadline(electionId: string, initialSeconds: number) {
  if (typeof window === 'undefined') {
    return Date.now() + initialSeconds * 1000;
  }

  const storageKey = getDeadlineStorageKey(electionId);
  const saved = window.localStorage.getItem(storageKey);

  if (saved) {
    const parsed = Number(saved);
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      return parsed;
    }
  }

  const nextDeadline = Date.now() + initialSeconds * 1000;
  window.localStorage.setItem(storageKey, String(nextDeadline));
  return nextDeadline;
}

function useElectionCountdown(electionId: string, initialSeconds: number) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

  useEffect(() => {
    const deadline = ensureElectionDeadline(electionId, initialSeconds);

    const tick = () => {
      const diffInSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemainingSeconds(diffInSeconds);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [electionId, initialSeconds]);

  const progressPercent = Math.max(
    0,
    Math.min(100, (remainingSeconds / initialSeconds) * 100),
  );

  return {
    remainingSeconds,
    formattedTime: formatSeconds(remainingSeconds),
    progressPercent,
  };
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

function CandidateAvatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-12 w-12 rounded-xl object-cover ring-1 ring-[#d9dee8]"
      />
    );
  }

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
  const voteReceipt = useMemo(() => getElectorVoteReceipt(), []);

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

  const { electionId, candidateId, confirmedAt: confirmedAtParam, confirmationCode } = voteReceipt;

  const electionName = useMemo(
    () => electionNamesById[electionId] ?? 'Eleição selecionada',
    [electionId],
  );

  const candidateName = useMemo(
    () => candidateNamesById[candidateId] ?? 'Candidato selecionado',
    [candidateId],
  );

  const confirmedAt = useMemo(() => {
    if (!confirmedAtParam) {
      return new Date();
    }

    const parsed = new Date(confirmedAtParam);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [confirmedAtParam]);

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
            <p className="text-[20px] font-extrabold tracking-[0.14em] text-[#1f2937]">
              {confirmationCode}
            </p>
          </div>
        </div>

        <div className="mt-5 h-px bg-[#e2e8f0]" />

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b95a3]">
              Data
            </p>
            <p className="mt-2 text-[15px] font-bold text-[#1f2937]">{formatVoteDate(confirmedAt)}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8b95a3]">
              Hora
            </p>
            <p className="mt-2 text-[15px] font-bold text-[#1f2937]">{formatVoteTime(confirmedAt)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <p className="text-[12px] text-[#64748b]">
            <span className="font-bold text-[#334155]">Eleição:</span> {electionName}
          </p>
          <p className="mt-2 text-[12px] text-[#64748b]">
            <span className="font-bold text-[#334155]">Seleção:</span> {candidateName}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        {/* <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="flex-1 rounded-2xl bg-[#f3f4f6] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#111827]"
        >
          Novo voto 
        </button>*/}

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

  const candidateIdFromQuery = searchParams.get('candidateId');
  const electionIdFromQuery = searchParams.get('electionId');
  const fallbackElectionId = voteReceipt?.electionId ?? '1';
  const resolvedElectionId =
    electionIdFromQuery && electionResultsData[electionIdFromQuery]
      ? electionIdFromQuery
      : fallbackElectionId;

  const election = useMemo(
    () => electionResultsData[resolvedElectionId] ?? electionResultsData['1'] ?? null,
    [resolvedElectionId],
  );

  const candidateId =
    candidateIdFromQuery ??
    (voteReceipt?.electionId === election?.id ? voteReceipt.candidateId : '');

  const countdown = useElectionCountdown(
    election?.id ?? 'fallback-results-election',
    election?.initialCountdownSeconds ?? 1,
  );

  const totalVotos = useMemo(() => {
    if (!election) return 0;
    return election.candidatos.reduce((sum, candidate) => sum + candidate.votos, 0);
  }, [election]);

  const highlightedCandidateId = useMemo(() => {
    if (!election) return '';
    if (candidateId && election.candidatos.some((candidate) => candidate.id === candidateId)) {
      return candidateId;
    }

    return [...election.candidatos].sort((a, b) => b.percentual - a.percentual)[0]?.id ?? '';
  }, [candidateId, election]);

  if (!election) {
    return (
      <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0f172a]">Resultados indisponíveis</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Não foi possível localizar a eleição pedida.
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
      <header>
        <h1 className="max-w-[290px] text-[18px] font-extrabold leading-tight text-[#111827] sm:text-[20px]">
          {election.titulo}
        </h1>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#555f6d]">
              Tempo restante
            </span>
            <span className="text-[13px] font-bold text-[#2b6edb]">
              {countdown.formattedTime}
            </span>
          </div>

          <div className="h-[4px] w-full rounded-full bg-[#e5e7eb]">
            <div
              className="h-[4px] rounded-full bg-[#e9b321] transition-all duration-1000"
              style={{ width: `${countdown.progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-[20px] bg-[#f8f8f9] p-4">
        <div>
          <h2 className="text-[16px] font-extrabold text-[#1f2937]">{election.cargo}</h2>
          <p className="mt-1 text-[12px] text-[#6b7280]">Total de votos: {totalVotos.toLocaleString('pt-PT')}</p>
        </div>

        <div className="mt-5 space-y-3">
          {election.candidatos.map((candidate) => {
            const isHighlighted = candidate.id === highlightedCandidateId;

            return (
              <div
                key={candidate.id}
                className={`rounded-2xl border p-3 ${
                  isHighlighted
                    ? 'border-[#f1d58b] bg-[#fdf7e8]'
                    : 'border-[#e5e7eb] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CandidateAvatar name={candidate.nome} image={candidate.foto} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[14px] font-extrabold ${
                            isHighlighted ? 'text-[#0b63c8]' : 'text-[#1f2937]'
                          }`}
                        >
                          {candidate.nome}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-[18px] font-extrabold ${
                            isHighlighted ? 'text-[#0b63c8]' : 'text-[#1f2937]'
                          }`}
                        >
                          {candidate.percentual.toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-[#8b95a3]">
                          {candidate.votos.toLocaleString('pt-PT')} votos
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-[4px] w-full rounded-full bg-[#eceef2]">
                      <div
                        className="h-[4px] rounded-full bg-[#e9b321]"
                        style={{ width: `${candidate.percentual}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <div className="mt-5 flex gap-3">
        {/* <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="flex-1 rounded-2xl bg-[#f3f4f6] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#111827]"
        >
          Voltar
        </button> 

        <button
          type="button"
          onClick={() =>
            navigate(`/eleitor/confirmacao?electionId=${encodeURIComponent(election.id)}`)
          }
          className="flex-1 rounded-2xl bg-[#2d5fe1] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white"
        >
          Comprovativo
        </button>
      </div> */}
    </section>
  );
}
