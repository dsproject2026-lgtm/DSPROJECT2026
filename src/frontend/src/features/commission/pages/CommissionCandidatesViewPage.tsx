import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, ShieldCheck, ShieldX, Slash, Trash2, X } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, UiPageSkeleton, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CandidateItem, CandidateState, CommissionElectionItem } from '@/types/commission';

type CandidateStateFilter = 'TODOS' | CandidateState;

const STATUS_OPTIONS: Array<{ value: CandidateStateFilter; label: string }> = [
  { value: 'TODOS', label: 'Todos os estados' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'APROVADO', label: 'Aprovado' },
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
  const [bootLoading, setBootLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);

  const selectedElection = useMemo(
    () => elections.find((item) => item.id === selectedElectionId) ?? null,
    [elections, selectedElectionId],
  );

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
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições.';
        toast.danger(message);
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
        const message =
          cause instanceof ApiError ? cause.message : 'Falha ao carregar candidatos.';
        toast.danger(message);
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
        const confirmed = window.confirm('Pretende remover este candidato?');
        if (!confirmed) return;
        await commissionApi.deleteCandidate(selectedElectionId, candidateId);
        toast.success('Candidato removido.');
      }

      const refreshed = await commissionApi.listCandidates(selectedElectionId);
      setAllRows(refreshed.items);
      if (detailCandidate?.id === candidateId) {
        setDetailCandidate(refreshed.items.find((item) => item.id === candidateId) ?? null);
      }
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao executar ação do candidato.';
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
            placeholder="Selecione a eleição"
            ariaLabel="Eleição"
            options={elections.map((item) => ({
              value: item.id,
              label: item.titulo,
            }))}
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome, id, utilizadorId, código ou email"
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <UiSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as CandidateStateFilter)}
            ariaLabel="Estado do candidato"
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
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
            { id: 'acoes', label: 'Ações', className: 'font-semibold' },
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
                      <button
                        type="button"
                        onClick={() => setDetailCandidate(row)}
                        className="rounded p-1 transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                        aria-label="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'approve')}
                        className="rounded p-1 transition hover:bg-[#f0fdf4] hover:text-[#15803d] disabled:opacity-50"
                        aria-label="Aprovar"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'reject')}
                        className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:opacity-50"
                        aria-label="Rejeitar"
                      >
                        <ShieldX className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'suspend')}
                        className="rounded p-1 transition hover:bg-[#fffbeb] hover:text-[#b45309] disabled:opacity-50"
                        aria-label="Suspender"
                      >
                        <Slash className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busyCandidateId === row.id}
                        onClick={() => void runCandidateAction(row.id, 'delete')}
                        className="rounded p-1 transition hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:opacity-50"
                        aria-label="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>,
                  ],
                }))
          }
          emptyMessage={
            !selectedElectionId
              ? 'Selecione uma eleição para visualizar os candidatos.'
              : rowsLoading
                ? 'A carregar candidatos...'
                : 'Nenhum candidato encontrado.'
          }
        />
      </div>

      {detailCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Detalhes do Candidato</h3>
              <button
                type="button"
                onClick={() => setDetailCandidate(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                    Nome
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#0f172a]">{detailCandidate.nome}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.estado}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Utilizador
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.utilizador.nome}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Código
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.utilizador.codigo}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.utilizador.email ?? '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Biografia
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.biografia ?? '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Proposta
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailCandidate.proposta ?? '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Início da votação
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">
                    {formatDate(selectedElection?.dataInicioVotacao ?? null)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
