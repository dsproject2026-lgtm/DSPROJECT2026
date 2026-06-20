import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, RefreshCw, Search, Trash2, X } from 'lucide-react';

import { positionsApi } from '@/api/positions.api';
import { Chip, ConfirmDialog, Spinner, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { PositionItem } from '@/types/commission';

function getPositionStatus(position: PositionItem) {
  const states = position.eleicoes?.map((election) => election.estado) ?? [];
  if (states.includes('ABERTA')) return 'EM_USO';
  if (states.includes('PROGRAMADA')) return 'PLANEADO';
  if (states.length === 0) return 'SEM_ELEICOES';
  return 'HISTORICO';
}

export function AdminPositionsViewPage() {
  const [rows, setRows] = useState<PositionItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<PositionItem | null>(null);
  const [positionToView, setPositionToView] = useState<PositionItem | null>(null);
  const [positionToEdit, setPositionToEdit] = useState<PositionItem | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });

  const load = async (query?: string) => {
    const response = await positionsApi.list(query);
    setRows(response.items);
  };

  useEffect(() => {
    let isActive = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const response = await positionsApi.list();
        if (!isActive) return;
        setRows(response.items);
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar os cargos.';
        toast.danger(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void boot();
    return () => {
      isActive = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.nome, row.descricao ?? ''].join(' ').toLowerCase().includes(query),
    );
  }, [rows, search]);

  const refresh = async () => {
    try {
      setIsRefreshing(true);
      await load();
      toast.success('Lista de cargos actualizada.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível actualizar os cargos.';
      toast.danger(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const removePosition = async () => {
    if (!positionToDelete) return;

    try {
      setBusyId(positionToDelete.id);
      await positionsApi.delete(positionToDelete.id);
      await load(search);
      setPositionToDelete(null);
      toast.success('Cargo removido com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível remover o cargo.';
      toast.danger(message);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (position: PositionItem) => {
    setPositionToEdit(position);
    setEditForm({
      nome: position.nome,
      descricao: position.descricao ?? '',
    });
  };

  const savePosition = async () => {
    if (!positionToEdit) return;
    if (!editForm.nome.trim()) {
      toast.danger('Informe o nome do cargo.');
      return;
    }

    try {
      setBusyId(positionToEdit.id);
      await positionsApi.update(positionToEdit.id, {
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim() || null,
      });
      await load(search);
      setPositionToEdit(null);
      toast.success('Cargo actualizado com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível actualizar o cargo.';
      toast.danger(message);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Visualizar Cargos
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Consulte os cargos registados e respectiva utilização nas eleições.
        </p>
      </div>

      <div className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por nome ou descrição"
              className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white pl-10 pr-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
            />
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#d1d9e6] bg-white px-4 text-sm font-medium text-[#111827] transition hover:bg-[#f8fafc] disabled:opacity-60"
          >
            {isRefreshing ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Cargos registados"
          columns={[
            { id: 'nome', label: 'Nome', className: 'font-semibold' },
            { id: 'descricao', label: 'Descrição', className: 'font-semibold' },
            { id: 'eleicoes', label: 'Eleições', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'accoes', label: 'Acções', className: 'font-semibold text-right' },
          ]}
          rows={filteredRows.map((row) => {
            const status = getPositionStatus(row);
            const electionCount = row.eleicoes?.length ?? 0;

            return {
              id: row.id,
              cells: [
                <span key={`${row.id}:nome`} className="font-semibold text-[#0f172a]">
                  {row.nome}
                </span>,
                <span key={`${row.id}:descricao`} className="text-[#475569]">
                  {row.descricao ?? '-'}
                </span>,
                <span key={`${row.id}:eleicoes`} className="text-[#475569]">
                  {electionCount}
                </span>,
                <Chip
                  key={`${row.id}:estado`}
                  size="sm"
                  variant="soft"
                  color={getStateChipColor(status)}
                  className="font-semibold"
                >
                  {formatStateLabel(status)}
                </Chip>,
                <div key={`${row.id}:acoes`} className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPositionToView(row)}
                    className="inline-flex rounded p-1 text-[#475569] transition hover:bg-[#f1f5f9]"
                    aria-label={`Visualizar cargo ${row.nome}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    disabled={busyId === row.id}
                    className="inline-flex rounded p-1 text-[#0b73c9] transition hover:bg-[#eff6ff] disabled:opacity-60"
                    aria-label={`Editar cargo ${row.nome}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPositionToDelete(row)}
                    disabled={busyId === row.id}
                    className="inline-flex rounded p-1 text-[#b91c1c] transition hover:bg-[#fef2f2] disabled:opacity-60"
                    aria-label={`Remover cargo ${row.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>,
              ],
            };
          })}
          emptyMessage="Nenhum cargo encontrado."
        />
      </div>

      <ConfirmDialog
        open={Boolean(positionToDelete)}
        title="Eliminar cargo"
        description={`Pretende eliminar o cargo "${positionToDelete?.nome ?? ''}"?`}
        confirmLabel="Eliminar"
        tone="danger"
        isLoading={positionToDelete ? busyId === positionToDelete.id : false}
        onCancel={() => setPositionToDelete(null)}
        onConfirm={() => void removePosition()}
      />

      {positionToView ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0f172a]">{positionToView.nome}</h2>
                <p className="text-sm text-[#64748b]">Detalhes do cargo</p>
              </div>
              <button type="button" onClick={() => setPositionToView(null)} className="rounded p-1 hover:bg-[#f1f5f9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-[#64748b]">Descrição</dt>
                <dd className="text-[#0f172a]">{positionToView.descricao ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#64748b]">Eleições associadas</dt>
                <dd className="text-[#0f172a]">{positionToView.eleicoes?.length ?? 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {positionToEdit ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-sm bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0f172a]">Editar cargo</h2>
                <p className="text-sm text-[#64748b]">{positionToEdit.nome}</p>
              </div>
              <button type="button" onClick={() => setPositionToEdit(null)} className="rounded p-1 hover:bg-[#f1f5f9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                  Nome
                </span>
                <input
                  value={editForm.nome}
                  onChange={(event) => setEditForm((current) => ({ ...current, nome: event.target.value }))}
                  className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                  Descrição
                </span>
                <textarea
                  value={editForm.descricao}
                  onChange={(event) => setEditForm((current) => ({ ...current, descricao: event.target.value }))}
                  className="min-h-24 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPositionToEdit(null)} className="h-10 rounded-md border border-[#d1d9e6] px-4 text-sm font-medium">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void savePosition()}
                disabled={busyId === positionToEdit.id}
                className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {busyId === positionToEdit.id ? <Spinner size="sm" className="mr-2 text-white" /> : null}
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
