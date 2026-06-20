import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Eye, Pencil, Search, ShieldCheck, ShieldX, Slash, Trash2, X } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, ConfirmDialog, Spinner, UiPageSkeleton, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CandidateItem, CandidateState, CommissionElectionItem, UpdateCandidateInput } from '@/types/commission';

type CandidateStateFilter = 'TODOS' | CandidateState;

const STATUS_OPTIONS: Array<{ value: CandidateStateFilter; label: string }> = [
  { value: 'TODOS', label: 'Todos os estados' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'SUSPENSO', label: 'Suspenso' },
];

const CANDIDATE_STATE_OPTIONS: Array<{ value: CandidateState; label: string }> = [
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'SUSPENSO', label: 'Suspenso' },
];

function formatDate(value: string | null) {
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

export function CommissionCandidatesViewPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [allRows, setAllRows] = useState<CandidateItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStateFilter>('TODOS');
  const [detailCandidate, setDetailCandidate] = useState<CandidateItem | null>(null);
  const [editCandidate, setEditCandidate] = useState<CandidateItem | null>(null);
  const [editForm, setEditForm] = useState<UpdateCandidateInput>({});
  const [confirmAction, setConfirmAction] = useState<null | {
    candidate: CandidateItem;
    action: 'suspend' | 'delete';
  }>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);

  const selectedElection = useMemo(
    () => elections.find((item) => item.id === selectedElectionId) ?? null,
    [elections, selectedElectionId],
  );

  const refreshCandidates = async () => {
    if (!selectedElectionId) return;
    const refreshed = await commissionApi.listCandidates(selectedElectionId);
    setAllRows(refreshed.items);
    return refreshed.items;
  };

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setBootLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
        setSelectedElectionId((current) => current || response.items[0]?.id || '');
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições.');
      } finally {
        if (isActive) setBootLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedElectionId) {
      setAllRows([]);
      return;
    }

    let isActive = true;

    const loadCandidates = async () => {
      setRowsLoading(true);
      try {
        const response = await commissionApi.listCandidates(selectedElectionId);
        if (!isActive) return;
        setAllRows(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Falha ao carregar candidatos.');
      } finally {
        if (isActive) setRowsLoading(false);
      }
    };

    void loadCandidates();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchesStatus = statusFilter === 'TODOS' || row.estado === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [row.nome, row.id, row.utilizadorId, row.utilizador.codigo, row.utilizador.email ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [allRows, search, statusFilter]);

  const runCandidateAction = async (
    candidateId: string,
    action: 'approve' | 'reject' | 'suspend' | 'delete',
  ) => {
    if (!selectedElectionId) return;

    try {
      setBusyCandidateId(candidateId);
      if (action === 'approve') {
        await commissionApi.approveCandidate(selectedElectionId, candidateId);
        toast.success('Candidato aprovado.');
      } else if (action === 'reject') {
        await commissionApi.rejectCandidate(selectedElectionId, candidateId);
        toast.success('Candidato rejeitado.');
      } else if (action === 'suspend') {
        await commissionApi.suspendCandidate(selectedElectionId, candidateId);
        toast.success('Candidato suspenso.');
      } else {
        await commissionApi.deleteCandidate(selectedElectionId, candidateId);
        toast.success('Candidato eliminado.');
      }

      const refreshed = await refreshCandidates();
      if (detailCandidate?.id === candidateId) {
        setDetailCandidate(refreshed?.find((item) => item.id === candidateId) ?? null);
      }
      setConfirmAction(null);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao executar a ação do candidato.';
      toast.danger(message);
    } finally {
      setBusyCandidateId(null);
    }
  };

  const openEdit = (candidate: CandidateItem) => {
    setEditCandidate(candidate);
    setEditForm({
      nome: candidate.nome,
      fotoUrl: candidate.fotoUrl,
      biografia: candidate.biografia,
      proposta: candidate.proposta,
      estado: candidate.estado,
    });
  };

  const saveEdit = async () => {
    if (!selectedElectionId || !editCandidate) return;

    try {
      setBusyCandidateId(editCandidate.id);
      await commissionApi.updateCandidate(selectedElectionId, editCandidate.id, editForm);
      await refreshCandidates();
      setEditCandidate(null);
      toast.success('Candidato actualizado com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao actualizar candidato.';
      toast.danger(message);
    } finally {
      setBusyCandidateId(null);
    }
  };

  if (bootLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Candidatos por Eleição
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Consulte e faça a gestão dos candidatos vinculados por eleição.
        </p>
      </div>

      <CommissionSegmentTabs segment="candidatos" />

      <div className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-3 lg:grid-cols-[1fr_2fr_1fr]">
          <UiSelect
            value={selectedElectionId}
            onChange={setSelectedElectionId}
            placeholder="Seleccione a eleição"
            ariaLabel="Eleição"
            options={elections.map((item) => ({ value: item.id, label: item.titulo }))}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, id, utilizadorId, código ou e-mail"
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <UiSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as CandidateStateFilter)}
            ariaLabel="Estado do candidato"
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Candidatos por eleição"
          columns={[
            { id: 'candidato', label: 'Candidato', className: 'font-semibold' },
            { id: 'codigo', label: 'Código', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'accoes', label: 'Ações', className: 'font-semibold' },
          ]}
          rows={
            !selectedElectionId || rowsLoading
              ? []
              : filteredRows.map((row) => ({
                  id: row.id,
                  cells: [
                    <div key={`${row.id}:candidate`}>
                      <p className="text-base font-semibold text-[#0f172a]">{row.nome}</p>
                      <p className="text-sm text-[#64748b]">{row.utilizador.email ?? '-'}</p>
                    </div>,
                    <span key={`${row.id}:code`} className="text-base">{row.utilizador.codigo}</span>,
                    <Chip
                      key={`${row.id}:status`}
                      size="sm"
                      variant="soft"
                      color={getStateChipColor(row.estado)}
                      className="font-semibold"
                    >
                      {formatStateLabel(row.estado)}
                    </Chip>,
                    <div key={`${row.id}:actions`} className="flex flex-wrap gap-1 text-[#64748b]">
                      <IconButton label="Visualizar" onClick={() => setDetailCandidate(row)} icon={<Eye className="h-4 w-4" />} />
                      <IconButton label="Editar" onClick={() => openEdit(row)} icon={<Pencil className="h-4 w-4" />} />
                      <IconButton
                        label="Aprovar"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'approve')}
                        icon={<ShieldCheck className="h-4 w-4" />}
                      />
                      <IconButton
                        label="Rejeitar"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'reject')}
                        icon={<ShieldX className="h-4 w-4" />}
                      />
                      <IconButton
                        label="Suspender"
                        disabled={busyCandidateId === row.id}
                        onClick={() => setConfirmAction({ candidate: row, action: 'suspend' })}
                        icon={<Slash className="h-4 w-4" />}
                      />
                      <IconButton
                        label="Eliminar"
                        disabled={busyCandidateId === row.id}
                        danger
                        onClick={() => setConfirmAction({ candidate: row, action: 'delete' })}
                        icon={<Trash2 className="h-4 w-4" />}
                      />
                    </div>,
                  ],
                }))
          }
          emptyMessage={
            !selectedElectionId
              ? 'Seleccione uma eleição para visualizar os candidatos.'
              : rowsLoading
                ? 'A carregar candidatos...'
                : 'Nenhum candidato encontrado.'
          }
        />
      </div>

      {detailCandidate ? (
        <CandidateDetailsModal
          candidate={detailCandidate}
          votingStart={selectedElection?.dataInicioVotacao ?? null}
          onClose={() => setDetailCandidate(null)}
        />
      ) : null}

      {editCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Editar Candidato</h3>
              <button
                type="button"
                onClick={() => setEditCandidate(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-74px)] space-y-4 overflow-y-auto px-5 py-5">
              <TextField
                label="Nome"
                value={editForm.nome ?? ''}
                onChange={(nome) => setEditForm((current) => ({ ...current, nome }))}
              />
              <TextField
                label="URL da fotografia"
                value={editForm.fotoUrl ?? ''}
                onChange={(fotoUrl) => setEditForm((current) => ({ ...current, fotoUrl: fotoUrl || null }))}
              />
              <TextareaField
                label="Biografia"
                value={editForm.biografia ?? ''}
                onChange={(biografia) => setEditForm((current) => ({ ...current, biografia: biografia || null }))}
              />
              <TextareaField
                label="Proposta"
                value={editForm.proposta ?? ''}
                onChange={(proposta) => setEditForm((current) => ({ ...current, proposta: proposta || null }))}
              />
              <UiSelect
                value={editForm.estado ?? 'APROVADO'}
                onChange={(estado) => setEditForm((current) => ({ ...current, estado: estado as CandidateState }))}
                ariaLabel="Estado"
                options={CANDIDATE_STATE_OPTIONS}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditCandidate(null)}
                  className="inline-flex h-10 items-center rounded-[8px] border border-[#d1d9e6] px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={busyCandidateId === editCandidate.id}
                  className="inline-flex h-10 items-center rounded-[8px] bg-[#1a56db] px-4 text-ui-sm font-medium text-white transition hover:bg-[#1647c0] disabled:opacity-60"
                >
                  {busyCandidateId === editCandidate.id ? <Spinner size="sm" className="mr-2 text-white" /> : null}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.action === 'delete' ? 'Eliminar candidato' : 'Suspender candidato'}
        description={
          confirmAction?.action === 'delete'
            ? `Pretende eliminar "${confirmAction.candidate.nome}" desta eleição?`
            : `Pretende suspender "${confirmAction?.candidate.nome}"? Candidatos suspensos não aparecem no boletim de voto.`
        }
        confirmLabel={confirmAction?.action === 'delete' ? 'Eliminar' : 'Suspender'}
        tone={confirmAction?.action === 'delete' ? 'danger' : 'warning'}
        isLoading={confirmAction ? busyCandidateId === confirmAction.candidate.id : false}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          void runCandidateAction(confirmAction.candidate.id, confirmAction.action);
        }}
      />
    </section>
  );
}

function IconButton({
  label,
  icon,
  danger = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-1 transition disabled:opacity-50 ${
        danger ? 'hover:bg-[#fef2f2] hover:text-[#dc2626]' : 'hover:bg-[#f1f5f9] hover:text-[#0f172a]'
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function CandidateDetailsModal({
  candidate,
  votingStart,
  onClose,
}: {
  candidate: CandidateItem;
  votingStart: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Detalhes do Candidato</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Nome" value={candidate.nome} />
            <Detail label="Estado" value={formatStateLabel(candidate.estado)} />
            <Detail label="Utilizador" value={candidate.utilizador.nome} />
            <Detail label="Código" value={candidate.utilizador.codigo} />
            <Detail label="E-mail" value={candidate.utilizador.email ?? '-'} wide />
            <Detail label="Biografia" value={candidate.biografia ?? '-'} wide />
            <Detail label="Proposta" value={candidate.proposta ?? '-'} wide />
            <Detail label="Início da votação" value={formatDate(votingStart)} wide />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[#0f172a]">{value}</p>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[100px] w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
      />
    </label>
  );
}
