import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { Chip, Spinner, UiPageSkeleton, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionDetailsItem } from '@/types/commission';
import type { BackendElectionState } from '@/types/elector';

const ESTADO_OPTIONS: Array<{ value: BackendElectionState; label: string }> = [
  { value: 'PENDENTE', label: 'PENDENTE' },
  { value: 'ABERTA', label: 'ABERTA' },
  { value: 'CONCLUIDA', label: 'CONCLUIDA' },
  { value: 'CANCELADA', label: 'CANCELADA' },
];

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function CommissionElectionDetailsPage() {
  const navigate = useNavigate();
  const { electionId } = useParams<{ electionId: string }>();

  const [election, setElection] = useState<CommissionElectionDetailsItem | null>(null);
  const [nextState, setNextState] = useState<BackendElectionState>('PENDENTE');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  useEffect(() => {
    if (!electionId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await commissionApi.getElectionById(electionId);
        if (!isActive) return;
        setElection(result);
        setNextState(result.estado);
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError
            ? cause.message
            : 'Não foi possível carregar os detalhes da eleição.';
        toast.danger(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [electionId]);

  const votedCount = useMemo(
    () => election?.elegiveis.filter((item) => item.jaVotou).length ?? 0,
    [election],
  );

  const updateElectionState = async () => {
    if (!electionId || !election) return;
    if (nextState === election.estado) return;

    try {
      setIsUpdatingState(true);
      await commissionApi.updateElection(electionId, { estado: nextState });
      const refreshed = await commissionApi.getElectionById(electionId);
      setElection(refreshed);
      setNextState(refreshed.estado);
      toast.success('Estado da eleição atualizado com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível atualizar o estado da eleição.';
      toast.danger(message);
    } finally {
      setIsUpdatingState(false);
    }
  };

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  if (!election) {
    return (
      <section className="space-y-4 rounded-sm border border-[#e2e8f0] bg-white p-5">
        <h1 className="text-ui-xl font-semibold text-[#0f172a]">Eleição não encontrada</h1>
        <p className="text-ui-sm text-[#64748b]">
          Não foi possível carregar os detalhes desta eleição.
        </p>
        <button
          type="button"
          onClick={() => navigate('/comissao/eleicoes/visualizar')}
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d1d5db] px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">
            Detalhes da Eleição
          </h1>
          <p className="text-ui-sm text-[#64748b]">{election.titulo}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/comissao/eleicoes/visualizar')}
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d1d5db] bg-white px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[8px] border border-[#e2e8f0] bg-white p-4">
          <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Estado</p>
          <div className="mt-2">
            <Chip
              size="sm"
              variant="soft"
              color={getStateChipColor(election.estado)}
              className="font-semibold"
            >
              {formatStateLabel(election.estado)}
            </Chip>
          </div>
        </article>
        <article className="rounded-[8px] border border-[#e2e8f0] bg-white p-4">
          <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Cargo</p>
          <p className="mt-2 text-ui-sm font-medium text-[#0f172a]">{election.cargo.nome}</p>
        </article>
        <article className="rounded-[8px] border border-[#e2e8f0] bg-white p-4">
          <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Candidatos</p>
          <p className="mt-2 text-ui-lg font-semibold text-[#0f172a]">{election.candidatos.length}</p>
        </article>
        <article className="rounded-[8px] border border-[#e2e8f0] bg-white p-4">
          <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Participação</p>
          <p className="mt-2 text-ui-lg font-semibold text-[#0f172a]">
            {votedCount}/{election.elegiveis.length}
          </p>
        </article>
      </div>

      <div className="rounded-[8px] border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-ui-base font-semibold text-[#0f172a]">Alterar estado</h2>
        <p className="mt-1 text-ui-sm font-medium text-[#64748b]">
          Selecione o novo estado da eleição e guarde a alteração.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <div className="w-full md:max-w-[260px]">
            <UiSelect
              value={nextState}
              onChange={(estado) => setNextState(estado as BackendElectionState)}
              options={ESTADO_OPTIONS}
              ariaLabel="Estado da eleição"
              isSearchable={false}
            />
          </div>
          <button
            type="button"
            onClick={() => void updateElectionState()}
            disabled={isUpdatingState || nextState === election.estado}
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#1a56db] px-4 text-ui-sm font-medium text-white transition hover:bg-[#1647c0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdatingState ? <Spinner size="sm" className="mr-2 text-white" /> : null}
            Guardar estado
          </button>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-ui-base font-semibold text-[#0f172a]">Calendário</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Início candidaturas</p>
            <p className="mt-1 text-ui-sm text-[#0f172a]">{formatDateTime(election.dataInicioCandidatura)}</p>
          </div>
          <div>
            <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Fim candidaturas</p>
            <p className="mt-1 text-ui-sm text-[#0f172a]">{formatDateTime(election.dataFimCandidatura)}</p>
          </div>
          <div>
            <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Início votação</p>
            <p className="mt-1 text-ui-sm text-[#0f172a]">{formatDateTime(election.dataInicioVotacao)}</p>
          </div>
          <div>
            <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">Fim votação</p>
            <p className="mt-1 text-ui-sm text-[#0f172a]">{formatDateTime(election.dataFimVotacao)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#e2e8f0] bg-white p-3">
        <UiTable
          ariaLabel="Candidatos da eleição"
          columns={[
            { id: 'nome', label: 'Candidato', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
          ]}
          rows={election.candidatos.map((candidate) => ({
            id: candidate.id,
            cells: [
              <span key={`${candidate.id}:nome`} className="text-ui-sm text-[#0f172a]">
                {candidate.nome}
              </span>,
              <Chip
                key={`${candidate.id}:estado`}
                size="sm"
                variant="soft"
                color={getStateChipColor(candidate.estado)}
                className="font-semibold"
              >
                {formatStateLabel(candidate.estado)}
              </Chip>,
            ],
          }))}
          emptyMessage="Esta eleição ainda não tem candidatos vinculados."
        />
      </div>
    </section>
  );
}
