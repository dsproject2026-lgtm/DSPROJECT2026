import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { saveElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';

interface CandidateOption {
  id: string;
  nome: string;
  detalhe: string;
  foto?: string;
  biografia: string;
  propostaEleitoral: string;
  isBlankVote?: boolean;
}

interface ElectionVotingData {
  id: string;
  titulo: string;
  initialCountdownSeconds: number;
  cargo: string;
  instrucao: string;
  candidatos: CandidateOption[];
}

const electionVotingData: Record<string, ElectionVotingData> = {
  '1': {
    id: '1',
    titulo: 'Eleições AEUP 2026',
    initialCountdownSeconds: 4 * 60 * 60 + 12 * 60 + 45,
    cargo: 'Presidente da Direção',
    instrucao: 'Selecione um candidato para prosseguir.',
    candidatos: [
      {
        id: 'ricardo-mondlane',
        nome: 'Ricardo Mondlane',
        detalhe: 'Lic. em Engenharia Informática',
        foto: '/images/candidates/ricardo-mondlane.png',
        biografia:
          'Estudante finalista de Engenharia Informática, com forte envolvimento em liderança académica e iniciativas estudantis. Tem trabalhado em actividades de apoio aos colegas e modernização de processos.',
        propostaEleitoral:
          'Pretende reforçar a comunicação com os estudantes, aumentar a transparência nas actividades da associação, promover eventos académicos e criar mecanismos digitais de participação.',
      },
      {
        id: 'ana-bela',
        nome: 'Ana Bela Chissano',
        detalhe: 'Lic. em Direito',
        foto: '/images/candidates/ana-bela.png',
        biografia:
          'Estudante de Direito com experiência em representação estudantil, debates académicos e acções ligadas à defesa dos interesses dos colegas.',
        propostaEleitoral:
          'Propõe uma associação mais inclusiva, próxima do estudante, com maior escuta activa, melhor organização e iniciativas regulares de apoio académico.',
      },
      {
        id: 'sergio-mabunda',
        nome: 'Sérgio Mabunda',
        detalhe: 'Lic. em Gestão de Empresas',
        foto: '/images/candidates/sergio-mabunda.png',
        biografia:
          'Estudante de Gestão de Empresas com perfil organizacional, focado em eficiência, planeamento e melhoria das actividades estudantis.',
        propostaEleitoral:
          'Defende uma gestão mais eficiente dos recursos, parcerias estratégicas, reforço da actividade estudantil e maior valorização do empreendedorismo jovem.',
      },
      {
        id: 'voto-branco',
        nome: 'Voto em Branco',
        detalhe: 'Não selecionar nenhum candidato',
        biografia: '',
        propostaEleitoral: '',
        isBlankVote: true,
      },
    ],
  },
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

function buildConfirmationCode() {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `UP-${random}-M-VOT-${year}`;
}

function CandidateAvatar({
  name,
  image,
  isBlankVote = false,
}: {
  name: string;
  image?: string;
  isBlankVote?: boolean;
}) {
  if (isBlankVote) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8e8ec]">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-[#8f96a3]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 8l8 8" />
        </svg>
      </div>
    );
  }

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-14 w-14 rounded-xl object-cover ring-1 ring-[#d9dee8]"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#dbeafe] text-sm font-bold text-[#1d4ed8]">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </div>
  );
}

function SectionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 text-[#183b74]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3h6l5 5v13H8z" />
      <path d="M14 3v5h5" />
      <path d="M10 12h6" />
      <path d="M10 16h5" />
    </svg>
  );
}

function CandidateDetailsModal({
  candidate,
  onClose,
}: {
  candidate: CandidateOption | null;
  onClose: () => void;
}) {
  if (!candidate || candidate.isBlankVote) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
      <div className="relative max-h-[92vh] w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-[#6b7280] transition hover:text-[#111827]"
          aria-label="Fechar"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>

        <div className="max-h-[92vh] overflow-y-auto px-5 pb-6 pt-5">
          <div className="flex flex-col items-center pt-2">
            <CandidateAvatar name={candidate.nome} image={candidate.foto} />
            <h3 className="mt-3 text-center text-[18px] font-extrabold text-[#111827]">
              {candidate.nome}
            </h3>
            <p className="mt-1 text-center text-[12px] text-[#6b7280]">{candidate.detalhe}</p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <SectionIcon />
                <h4 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#183b74]">
                  Biografia
                </h4>
              </div>
              <p className="text-[13px] leading-5 text-[#374151]">{candidate.biografia}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <SectionIcon />
                <h4 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#183b74]">
                  Proposta Eleitoral
                </h4>
              </div>
              <p className="text-[13px] leading-5 text-[#374151]">{candidate.propostaEleitoral}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteConfirmationModal({
  isOpen,
  candidateName,
  officeName,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  candidateName: string;
  officeName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4">
      <div className="relative w-full max-w-sm rounded-[24px] border border-[#e5e7eb] bg-white px-5 pb-5 pt-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-full p-1 text-[#7b8794] transition hover:bg-[#f3f4f6] disabled:opacity-50"
          aria-label="Fechar"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[#16a34a]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 13.4L6.7 11.3l1.4-1.4 2.7 2.7 5.2-5.2 1.4 1.4-6.6 6.6z" />
            </svg>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.18em]">
              Confirmar voto
            </span>
          </div>

          <p className="mt-6 text-[15px] leading-6 text-[#374151]">
            Você está prestes a confirmar o seu voto.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Candidato</p>
          <p className="mt-1 text-[15px] font-extrabold text-[#111827]">{candidateName}</p>
          <div className="mt-3 h-px bg-[#e5e7eb]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Cargo</p>
          <p className="mt-1 text-[14px] font-semibold text-[#1f2937]">{officeName}</p>
        </div>

        <div className="mt-4 rounded-xl border border-[#f3d48f] bg-[#fff7e6] px-3 py-2">
          <p className="text-[11px] text-[#8a5a00]">
            Após confirmar, não será possível alterar esta escolha.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#f3f4f6] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rever escolha
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#16a34a] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" />
                A processar...
              </span>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ElectorElectionsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [detailsCandidateId, setDetailsCandidateId] = useState<string | null>(null);
  const [isVoteConfirmationOpen, setIsVoteConfirmationOpen] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const election = useMemo(() => {
    if (!electionId) return null;
    return electionVotingData[electionId] ?? null;
  }, [electionId]);

  const countdown = useElectionCountdown(
    election?.id ?? 'fallback-election',
    election?.initialCountdownSeconds ?? 1,
  );

  const selectedCandidate = useMemo(() => {
    if (!election || !selectedCandidateId) return null;
    return election.candidatos.find((candidate) => candidate.id === selectedCandidateId) ?? null;
  }, [election, selectedCandidateId]);

  const selectedDetailsCandidate = useMemo(() => {
    if (!election || !detailsCandidateId) return null;
    return election.candidatos.find((candidate) => candidate.id === detailsCandidateId) ?? null;
  }, [detailsCandidateId, election]);

  useEffect(() => {
    const shouldLockScroll = Boolean(selectedDetailsCandidate) || isVoteConfirmationOpen;
    if (!shouldLockScroll) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedDetailsCandidate, isVoteConfirmationOpen]);

  if (!election) {
    return (
      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0f172a]">Eleição não encontrada</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          Selecione uma eleição válida para continuar.
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

  const handleConfirmVote = () => {
    if (!selectedCandidate || isSubmittingVote) return;
    setIsSubmittingVote(true);

    const confirmedAt = new Date().toISOString();
    const confirmationCode = buildConfirmationCode();
    saveElectorVoteReceipt({
      electionId: election.id,
      candidateId: selectedCandidate.id,
      confirmedAt,
      confirmationCode,
    });

    window.setTimeout(() => {
      navigate('/eleitor/confirmacao');
    }, 900);
  };

  return (
    <>
      <section className="mx-auto w-full max-w-md rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
        <header>
          <h1 className="text-[18px] font-extrabold text-[#111827] sm:text-[20px]">
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

        <div className="mt-6 border-t border-[#eef0f4] pt-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-[3px] rounded-full bg-[#e8b21f]" />
            <div>
              <h2 className="text-[16px] font-extrabold text-[#1f2937]">{election.cargo}</h2>
              <p className="mt-1 text-[12px] text-[#6b7280]">{election.instrucao}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {election.candidatos.map((candidate) => {
              const isSelected = selectedCandidateId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedCandidateId(candidate.id);
                    }
                  }}
                  className={`w-full cursor-pointer rounded-2xl border px-3 py-3 transition ${
                    isSelected
                      ? 'border-[#3b82f6] bg-white shadow-[0_0_0_1px_rgba(59,130,246,0.05)]'
                      : 'border-[#e5e7eb] bg-[#fbfbfc]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CandidateAvatar
                      name={candidate.nome}
                      image={candidate.foto}
                      isBlankVote={candidate.isBlankVote}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-extrabold text-[#1f2937]">
                        {candidate.nome}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#6b7280]">{candidate.detalhe}</p>

                      {!candidate.isBlankVote && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailsCandidateId(candidate.id);
                          }}
                          className="mt-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7b8794]"
                        >
                          Ver mais
                        </button>
                      )}
                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        isSelected ? 'border-[#3b82f6]' : 'border-[#c5cad3]'
                      }`}
                    >
                      {isSelected && <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            disabled={!selectedCandidateId}
            onClick={() => setIsVoteConfirmationOpen(true)}
            className="w-full rounded-2xl bg-[#2d5fe1] px-4 py-4 text-[12px] font-extrabold uppercase tracking-[0.2em] text-white shadow-[0_8px_18px_rgba(45,95,225,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#9db9ff] disabled:shadow-none"
          >
            Confirmar voto
          </button>
        </div>
      </section>

      <CandidateDetailsModal
        candidate={selectedDetailsCandidate}
        onClose={() => setDetailsCandidateId(null)}
      />

      <VoteConfirmationModal
        isOpen={isVoteConfirmationOpen && Boolean(selectedCandidate)}
        candidateName={selectedCandidate?.nome ?? ''}
        officeName={election.cargo}
        isSubmitting={isSubmittingVote}
        onClose={() => {
          if (!isSubmittingVote) {
            setIsVoteConfirmationOpen(false);
          }
        }}
        onConfirm={handleConfirmVote}
      />
    </>
  );
}
