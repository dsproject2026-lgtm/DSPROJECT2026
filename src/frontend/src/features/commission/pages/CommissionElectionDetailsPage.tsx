import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { Chip, ConfirmDialog, Spinner, UiPageSkeleton, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { ELECTION_STATE_OPTIONS, formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionDetailsItem } from '@/types/commission';
import type { BackendElectionState } from '@/types/elector';

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
  const location = useLocation();
  const { electionId } = useParams<{ electionId: string }>();
  const isAdminView = location.pathname.startsWith('/admin');
  const backPath = isAdminView ? '/admin/eleicoes' : '/comissao/eleicoes/visualizar';
  const editPath = isAdminView
    ? `/admin/eleicoes/registrar?edit=${encodeURIComponent(electionId ?? '')}`
    : `/comissao/eleicoes/registrar?edit=${encodeURIComponent(electionId ?? '')}`;

  const [election, setElection] = useState<CommissionElectionDetailsItem | null>(null);
  const [nextState, setNextState] = useState<BackendElectionState>('PROGRAMADA');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

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
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os detalhes da eleição.');
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

  const approvedCandidatesCount = useMemo(
    () => election?.candidatos.filter((candidate) => candidate.estado === 'APROVADO').length ?? 0,
    [election],
  );

  const updateElectionState = async () => {
    if (!electionId || !election) return;
    if (nextState === election.estado) return;

    if (nextState === 'ABERTA' && (approvedCandidatesCount === 0 || election.elegiveis.length === 0)) {
      setShowIncompleteDialog(true);
      return;
    }

    try {
      setIsUpdatingState(true);
      await commissionApi.updateElection(electionId, { estado: nextState });
      const refreshed = await commissionApi.getElectionById(electionId);
      setElection(refreshed);
      setNextState(refreshed.estado);
      toast.success('Estado da eleição actualizado com sucesso.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'ELECTION_INCOMPLETE') {
        setShowIncompleteDialog(true);
        return;
      }
      toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível actualizar o estado da eleição.');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const deleteIncompleteElection = async () => {
    if (!electionId) return;

    try {
      setIsUpdatingState(true);
      await commissionApi.deleteElection(electionId);
      toast.success('Eleição eliminada com sucesso.');
      navigate(backPath);
    } catch (cause) {
      toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível eliminar a eleição.');
    } finally {
      setIsUpdatingState(false);
      setShowIncompleteDialog(false);
    }
  };

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  if (!election) {
    return (
      <section className="space-y-4 rounded-sm border border-[#e2e8f0] bg-white p-5">
        <h1 className="text-ui-xl font-semibold text-[#0f172a]">Eleição não encontrada</h1>
        <p className="text-ui-sm text-[#64748b]">Não foi possível carregar os detalhes desta eleição.</p>
        <button
          type="button"
          onClick={() => navigate(backPath)}
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
          <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Detalhes da Eleição</h1>
          <p className="text-ui-sm text-[#64748b]">{election.titulo}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d1d5db] bg-white px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Estado">
          <Chip size="sm" variant="soft" color={getStateChipColor(election.estado)} className="font-semibold">
            {formatStateLabel(election.estado)}
          </Chip>
        </SummaryCard>
        <SummaryCard label="Cargo" value={election.cargo.nome} />
        <SummaryCard label="Candidatos" value={`${election.candidatos.length}`} />
        <SummaryCard label="Participação" value={`${votedCount}/${election.elegiveis.length}`} />
      </div>

      {!isAdminView ? (
        <div className="rounded-[8px] border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-ui-base font-semibold text-[#0f172a]">Alterar estado</h2>
          <p className="mt-1 text-ui-sm font-medium text-[#64748b]">
            Seleccione o novo estado da eleição e guarde a alteração.
          </p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <div className="w-full md:max-w-[260px]">
              <UiSelect
                value={nextState}
                onChange={(estado) => setNextState(estado as BackendElectionState)}
                options={[...ELECTION_STATE_OPTIONS]}
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
      ) : null}

      <div className="rounded-[8px] border border-[#e2e8f0] bg-white p-5">
        <h2 className="text-ui-base font-semibold text-[#0f172a]">Calendário</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Info label="Início candidaturas" value={formatDateTime(election.dataInicioCandidatura)} />
          <Info label="Fim candidaturas" value={formatDateTime(election.dataFimCandidatura)} />
          <Info label="Início votação" value={formatDateTime(election.dataInicioVotacao)} />
          <Info label="Fim votação" value={formatDateTime(election.dataFimVotacao)} />
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

      <ConfirmDialog
        open={showIncompleteDialog}
        title="Eleição incompleta"
        description="Esta eleição não tem candidatos aprovados ou eleitores suficientes para ser aberta. Deseja editar os dados e ganhar mais tempo para importar eleitores e promover candidatos?"
        confirmLabel="Editar eleição"
        cancelLabel="Eliminar eleição"
        tone="warning"
        isLoading={isUpdatingState}
        onCancel={() => void deleteIncompleteElection()}
        onConfirm={() => navigate(editPath)}
      />
    </section>
  );
}

function SummaryCard({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <article className="rounded-[8px] border border-[#e2e8f0] bg-white p-4">
      <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <div className="mt-2 text-ui-sm font-medium text-[#0f172a]">{children ?? value}</div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ui-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="mt-1 text-ui-sm text-[#0f172a]">{value}</p>
    </div>
  );
}
