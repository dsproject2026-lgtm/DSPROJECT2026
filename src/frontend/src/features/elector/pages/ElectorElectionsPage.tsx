import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { electionsApi } from '@/api/elections.api';
import { Spinner, toast } from '@/components/ui';
import { saveElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';
import { ApiError } from '@/lib/http/api-error';
import type { BallotCandidate, ElectionBallot } from '@/types/elector';

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function calculateRemainingSeconds(endDateIso: string | null) {
  if (!endDateIso) {
    return 0;
  }

  const endDate = new Date(endDateIso);

  if (Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((endDate.getTime() - Date.now()) / 1000));
}

function CandidateAvatar({ name, image }: { name: string; image?: string | null }) {
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

function CandidateDetailsModal({
  candidate,
  onClose,
}: {
  candidate: BallotCandidate | null;
  onClose: () => void;
}) {
  if (!candidate) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 font-sans">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg text-[#6b7280] transition hover:text-[#111827]"
          aria-label="Fechar"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>

        <div className="max-h-[92vh] overflow-y-auto px-5 pb-6 pt-5">
          <div className="flex flex-col items-center pt-2">
            <CandidateAvatar name={candidate.nome} image={candidate.fotoUrl} />
            <h3 className="mt-3 text-center text-xl font-bold capitalize text-[#111827]">{candidate.nome}</h3>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <h4 className="text-sm font-bold capitalize text-[#183b74]">Biografia</h4>
              <p className="mt-2 text-base leading-relaxed text-[#374151]">{candidate.biografia ?? 'Sem biografia disponível.'}</p>
            </div>

            <div>
              <h4 className="text-sm font-bold capitalize text-[#183b74]">Proposta Eleitoral</h4>
              <p className="mt-2 text-base leading-relaxed text-[#374151]">{candidate.proposta ?? 'Sem proposta disponível.'}</p>
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
  electionTitle,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  candidateName: string;
  electionTitle: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 px-4 font-sans">
      <div className="relative w-full max-w-xl rounded-lg border border-[#e5e7eb] bg-white px-5 pb-5 pt-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#7b8794] transition hover:bg-[#f3f4f6] disabled:opacity-50"
          aria-label="Fechar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>

        <p className="text-center text-base leading-relaxed text-[#374151]">Você está prestes a confirmar o seu voto.</p>

        <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
          <p className="text-sm font-semibold capitalize text-[#6b7280]">Candidato</p>
          <p className="mt-1 text-lg font-bold text-[#111827]">{candidateName}</p>
          <div className="mt-3 h-px bg-[#e5e7eb]" />
          <p className="mt-3 text-sm font-semibold capitalize text-[#6b7280]">Eleição</p>
          <p className="mt-1 text-base font-semibold text-[#1f2937]">{electionTitle}</p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-[#f3f4f6] px-4 py-3 text-base font-bold capitalize text-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rever
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-[#16a34a] px-4 py-3 text-base font-bold capitalize text-white disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isSubmitting ? 'A processar...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ElectorElectionsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();

  const [ballot, setBallot] = useState<ElectionBallot | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [detailsCandidateId, setDetailsCandidateId] = useState<string | null>(null);
  const [isVoteConfirmationOpen, setIsVoteConfirmationOpen] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!electionId) {
      setError('ID de eleição inválido.');
      setIsLoading(false);
      return;
    }

    if (!isUuid(electionId)) {
      setError('ID de eleição inválido. Atualize a página de eleições e selecione uma eleição válida.');
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await electionsApi.getBallot(electionId);

        if (!isActive) {
          return;
        }

        setBallot(result);
        setRemainingSeconds(calculateRemainingSeconds(result.election.dataFimVotacao));
      } catch (cause) {
        if (!isActive) {
          return;
        }

        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar o boletim de voto.';

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

  useEffect(() => {
    if (!ballot?.election.dataFimVotacao) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(ballot.election.dataFimVotacao));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [ballot?.election.dataFimVotacao]);

  const selectedCandidate = useMemo(() => {
    if (!ballot || !selectedCandidateId) return null;
    return ballot.candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;
  }, [ballot, selectedCandidateId]);

  const selectedDetailsCandidate = useMemo(() => {
    if (!ballot || !detailsCandidateId) return null;
    return ballot.candidates.find((candidate) => candidate.id === detailsCandidateId) ?? null;
  }, [ballot, detailsCandidateId]);

  const progressPercent = useMemo(() => {
    if (!ballot?.election.dataFimVotacao || remainingSeconds <= 0) {
      return 0;
    }

    const end = new Date(ballot.election.dataFimVotacao).getTime();
    const start = ballot.election.dataInicioVotacao ? new Date(ballot.election.dataInicioVotacao).getTime() : Date.now();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return 0;
    }

    const total = Math.floor((end - start) / 1000);
    if (total <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (remainingSeconds / total) * 100));
  }, [ballot?.election.dataFimVotacao, ballot?.election.dataInicioVotacao, remainingSeconds]);

  const handleConfirmVote = async () => {
    if (!ballot || !selectedCandidate || isSubmittingVote) {
      return;
    }

    setIsSubmittingVote(true);

    try {
      const result = await electionsApi.castVote(ballot.election.id, selectedCandidate.id);

      saveElectorVoteReceipt({
        electionId: result.electionId,
        candidateId: result.candidateId,
        confirmedAt: result.votedAt,
        confirmationCode: result.receiptCode,
        electionTitle: ballot.election.titulo,
        candidateName: selectedCandidate.nome,
      });

      toast.success('Voto confirmado com sucesso.');
      navigate('/eleitor/confirmacao');
    } catch (cause) {
      const message = cause instanceof ApiError ? cause.message : 'Não foi possível confirmar o voto.';
      toast.danger(message);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto flex min-h-[260px] w-full max-w-xl items-center justify-center rounded-lg bg-white p-5 font-sans shadow-sm">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-base font-medium capitalize">A Carregar Boletim...</span>
        </div>
      </section>
    );
  }

  if (error || !ballot) {
    return (
      <section className="mx-auto w-full max-w-xl rounded-lg bg-white p-5 font-sans shadow-sm">
        <h1 className="text-xl font-semibold capitalize text-[#0f172a]">Boletim Indisponível</h1>
        <p className="mt-2 text-base text-[#64748b]">{error ?? 'Não foi possível carregar os dados da eleição.'}</p>
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="mt-4 rounded-lg bg-[#2563eb] px-4 py-2 text-base font-medium text-white capitalize"
        >
          Voltar
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto w-full max-w-xl rounded-lg bg-white p-4 font-sans shadow-sm sm:p-5">
        <header>
          <h1 className="text-xl font-bold capitalize text-[#111827]">{ballot.election.titulo}</h1>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold capitalize text-[#555f6d]">Tempo Restante</span>
              <span className="text-base font-bold text-[#2b6edb]">{formatSeconds(remainingSeconds)}</span>
            </div>

            <div className="h-[4px] w-full rounded-full bg-[#e5e7eb]">
              <div
                className="h-[4px] rounded-full bg-[#e9b321] transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mt-6 border-t border-[#eef0f4] pt-5">
          <h2 className="text-lg font-bold capitalize text-[#1f2937]">Selecione um Candidato</h2>
          <p className="mt-1 text-sm text-[#6b7280]">Escolha um candidato aprovado para registar o seu voto.</p>

          <div className="mt-5 space-y-4">
            {ballot.candidates.map((candidate) => {
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
                  className={`w-full cursor-pointer rounded-lg border px-3 py-3 transition ${
                    isSelected
                      ? 'border-[#3b82f6] bg-white shadow-[0_0_0_1px_rgba(59,130,246,0.05)]'
                      : 'border-[#e5e7eb] bg-[#fbfbfc]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CandidateAvatar name={candidate.nome} image={candidate.fotoUrl} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold capitalize text-[#1f2937]">{candidate.nome}</p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailsCandidateId(candidate.id);
                        }}
                        className="mt-1 text-sm font-medium capitalize text-[#7b8794]"
                      >
                        Ver Mais
                      </button>
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
            className="w-full rounded-lg bg-[#2d5fe1] px-4 py-4 text-base font-bold capitalize text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#9db9ff] disabled:shadow-none"
          >
            Confirmar Voto
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
        electionTitle={ballot.election.titulo}
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
