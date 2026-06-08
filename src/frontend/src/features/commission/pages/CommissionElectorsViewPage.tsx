import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Eye, Pencil, RotateCcw, Search, Slash, Trash2, X } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, ConfirmDialog, Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionItem, EligibleVoterItem } from '@/types/commission';

type VoteFilter = 'TODOS' | 'JA_VOTOU' | 'NAO_VOTOU';

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function CommissionElectorsViewPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [rows, setRows] = useState<EligibleVoterItem[]>([]);
  const [detailElector, setDetailElector] = useState<EligibleVoterItem | null>(null);
  const [editElector, setEditElector] = useState<EligibleVoterItem | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', email: '', ano: '' });
  const [confirmAction, setConfirmAction] = useState<null | {
    elector: EligibleVoterItem;
    action: 'suspend' | 'reactivate' | 'delete';
  }>(null);
  const [search, setSearch] = useState('');
  const [voteFilter, setVoteFilter] = useState<VoteFilter>('TODOS');
  const [bootLoading, setBootLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [busyElectorId, setBusyElectorId] = useState<string | null>(null);

  const refreshRows = async () => {
    if (!selectedElectionId) return;
    const response = await commissionApi.listEligibleVoters(selectedElectionId);
    setRows(response.items);
    return response.items;
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
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar eleições.');
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
      setRows([]);
      return;
    }

    let isActive = true;
    const load = async () => {
      setRowsLoading(true);
      try {
        const response = await commissionApi.listEligibleVoters(selectedElectionId);
        if (!isActive) return;
        setRows(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar eleitores elegíveis.');
      } finally {
        if (isActive) setRowsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        query.length === 0 ||
        [row.utilizador.nome, row.utilizador.codigo, row.utilizador.email ?? '', row.utilizador.id]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesVote =
        voteFilter === 'TODOS' ||
        (voteFilter === 'JA_VOTOU' ? row.jaVotou : !row.jaVotou);
      return matchesQuery && matchesVote;
    });
  }, [rows, search, voteFilter]);

  const openEdit = (elector: EligibleVoterItem) => {
    setEditElector(elector);
    setEditForm({
      nome: elector.utilizador.nome,
      email: elector.utilizador.email ?? '',
      ano: elector.utilizador.ano?.toString() ?? '',
    });
  };

  const saveEdit = async () => {
    if (!selectedElectionId || !editElector) return;

    try {
      setBusyElectorId(editElector.id);
      await commissionApi.updateEligibleVoter(selectedElectionId, editElector.id, {
        nome: editForm.nome.trim(),
        email: editForm.email.trim() || null,
        ano: editForm.ano.trim() ? Number(editForm.ano) : null,
      });
      await refreshRows();
      setEditElector(null);
      toast.success('Eleitor actualizado com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível actualizar o eleitor.';
      toast.danger(message);
    } finally {
      setBusyElectorId(null);
    }
  };

  const runAction = async () => {
    if (!selectedElectionId || !confirmAction) return;
    const { elector, action } = confirmAction;

    try {
      setBusyElectorId(elector.id);
      if (action === 'delete') {
        await commissionApi.deleteEligibleVoter(selectedElectionId, elector.id);
        toast.success('Eleitor eliminado da eleição.');
      } else {
        await commissionApi.updateEligibleVoterStatus(selectedElectionId, elector.id, action === 'reactivate');
        toast.success(action === 'reactivate' ? 'Eleitor reactivado.' : 'Eleitor suspenso.');
      }
      await refreshRows();
      setConfirmAction(null);
      if (detailElector?.id === elector.id) setDetailElector(null);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível executar a ação.';
      toast.danger(message);
    } finally {
      setBusyElectorId(null);
    }
  };

  if (bootLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar eleitores...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Eleitores Elegíveis
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Consulte os estudantes elegíveis por eleição e acompanhe o estado de votação.
        </p>
      </div>

      <CommissionSegmentTabs segment="estudantes" />

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
              placeholder="Pesquisar por nome, código, e-mail ou utilizadorId"
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>

          <UiSelect
            value={voteFilter}
            onChange={(value) => setVoteFilter(value as VoteFilter)}
            ariaLabel="Filtro de votação"
            options={[
              { value: 'TODOS', label: 'Todos' },
              { value: 'JA_VOTOU', label: 'Já votou' },
              { value: 'NAO_VOTOU', label: 'Ainda não votou' },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Eleitores elegíveis"
          columns={[
            { id: 'codigo', label: 'Código', className: 'font-semibold' },
            { id: 'utilizador', label: 'Utilizador', className: 'font-semibold' },
            { id: 'activo', label: 'Activo', className: 'font-semibold' },
            { id: 'voto', label: 'Voto', className: 'font-semibold' },
            { id: 'accoes', label: 'Ações', className: 'text-right font-semibold' },
          ]}
          rows={
            !selectedElectionId || rowsLoading
              ? []
              : filteredRows.map((row) => ({
                  id: row.id,
                  cells: [
                    <span key={`${row.id}:code`} className="text-base font-semibold text-[#0f172a]">
                      {row.utilizador.codigo}
                    </span>,
                    <div key={`${row.id}:user`}>
                      <p className="text-base font-semibold text-[#0f172a]">{row.utilizador.nome}</p>
                      <p className="text-sm text-[#64748b]">{row.utilizador.email ?? '-'}</p>
                    </div>,
                    <Chip
                      key={`${row.id}:active`}
                      size="sm"
                      variant="soft"
                      color={getStateChipColor(row.utilizador.activo ? 'ATIVO' : 'INATIVO')}
                      className="font-semibold"
                    >
                      {row.utilizador.activo ? 'ACTIVO' : 'SUSPENSO'}
                    </Chip>,
                    <Chip
                      key={`${row.id}:voted`}
                      size="sm"
                      variant="soft"
                      color={getStateChipColor(row.jaVotou ? 'JA_VOTOU' : 'FALSE')}
                      className="font-semibold"
                    >
                      {row.jaVotou ? 'JÁ VOTOU' : 'NÃO VOTOU'}
                    </Chip>,
                    <div key={`${row.id}:actions`} className="flex justify-end gap-1 text-[#64748b]">
                      <IconButton label="Visualizar" onClick={() => setDetailElector(row)} icon={<Eye className="h-4 w-4" />} />
                      <IconButton label="Editar" onClick={() => openEdit(row)} icon={<Pencil className="h-4 w-4" />} />
                      {row.utilizador.activo ? (
                        <IconButton
                          label="Suspender"
                          disabled={busyElectorId === row.id}
                          onClick={() => setConfirmAction({ elector: row, action: 'suspend' })}
                          icon={<Slash className="h-4 w-4" />}
                        />
                      ) : (
                        <IconButton
                          label="Reactivar"
                          disabled={busyElectorId === row.id}
                          onClick={() => setConfirmAction({ elector: row, action: 'reactivate' })}
                          icon={<RotateCcw className="h-4 w-4" />}
                        />
                      )}
                      <IconButton
                        label="Eliminar"
                        danger
                        disabled={busyElectorId === row.id}
                        onClick={() => setConfirmAction({ elector: row, action: 'delete' })}
                        icon={<Trash2 className="h-4 w-4" />}
                      />
                    </div>,
                  ],
                }))
          }
          emptyMessage={
            !selectedElectionId
              ? 'Seleccione uma eleição para visualizar os eleitores.'
              : rowsLoading
                ? 'A carregar eleitores elegíveis...'
                : 'Nenhum eleitor elegível encontrado.'
          }
        />
      </div>

      {detailElector ? <ElectorDetailsModal elector={detailElector} onClose={() => setDetailElector(null)} /> : null}

      {editElector ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="w-full max-w-xl rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Editar Eleitor</h3>
              <button
                type="button"
                onClick={() => setEditElector(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <TextField label="Nome" value={editForm.nome} onChange={(nome) => setEditForm((current) => ({ ...current, nome }))} />
              <TextField label="E-mail" value={editForm.email} onChange={(email) => setEditForm((current) => ({ ...current, email }))} />
              <TextField label="Ano" type="number" value={editForm.ano} onChange={(ano) => setEditForm((current) => ({ ...current, ano }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditElector(null)}
                  className="inline-flex h-10 items-center rounded-[8px] border border-[#d1d9e6] px-4 text-ui-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={busyElectorId === editElector.id}
                  className="inline-flex h-10 items-center rounded-[8px] bg-[#1a56db] px-4 text-ui-sm font-medium text-white transition hover:bg-[#1647c0] disabled:opacity-60"
                >
                  {busyElectorId === editElector.id ? <Spinner size="sm" className="mr-2 text-white" /> : null}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.action === 'delete'
            ? 'Eliminar eleitor'
            : confirmAction?.action === 'reactivate'
              ? 'Reactivar eleitor'
              : 'Suspender eleitor'
        }
        description={
          confirmAction?.action === 'delete'
            ? `Pretende eliminar "${confirmAction.elector.utilizador.nome}" desta eleição?`
            : confirmAction?.action === 'reactivate'
              ? `Pretende reactivar "${confirmAction.elector.utilizador.nome}"?`
              : `Pretende suspender "${confirmAction?.elector.utilizador.nome}"? Eleitores suspensos não poderão votar.`
        }
        confirmLabel={
          confirmAction?.action === 'delete'
            ? 'Eliminar'
            : confirmAction?.action === 'reactivate'
              ? 'Reactivar'
              : 'Suspender'
        }
        tone={confirmAction?.action === 'delete' ? 'danger' : 'warning'}
        isLoading={confirmAction ? busyElectorId === confirmAction.elector.id : false}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void runAction()}
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

function ElectorDetailsModal({ elector, onClose }: { elector: EligibleVoterItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Detalhes do Eleitor</h3>
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
            <Detail label="ID" value={elector.utilizador.id} />
            <Detail label="Código" value={elector.utilizador.codigo} />
            <Detail label="Nome" value={elector.utilizador.nome} />
            <Detail label="E-mail" value={elector.utilizador.email ?? '-'} />
            <Detail label="Perfil" value={elector.utilizador.perfil} />
            <Detail label="Voto" value={elector.jaVotou ? 'Já votou' : 'Não votou'} />
            <Detail label="Importado em" value={formatDateTime(elector.importadoEm)} wide />
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
      <p className="mt-1 text-sm text-[#0f172a]">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
      />
    </label>
  );
}
