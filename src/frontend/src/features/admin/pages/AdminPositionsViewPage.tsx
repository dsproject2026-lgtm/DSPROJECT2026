import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Trash2 } from 'lucide-react';

import { positionsApi } from '@/api/positions.api';
import { Chip, Spinner, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { PositionItem } from '@/types/commission';

function getPositionStatus(position: PositionItem) {
  const states = position.eleicoes?.map((election) => election.estado) ?? [];
  if (states.includes('ABERTA')) return 'EM_USO';
  if (states.includes('PENDENTE')) return 'PLANEADO';
  if (states.length === 0) return 'SEM_ELEICOES';
  return 'HISTORICO';
}

export function AdminPositionsViewPage() {
  const [rows, setRows] = useState<PositionItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      toast.success('Lista de cargos atualizada.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível atualizar os cargos.';
      toast.danger(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const removePosition = async (id: string) => {
    const confirmed = window.confirm('Pretende remover este cargo?');
    if (!confirmed) return;

    try {
      setBusyId(id);
      await positionsApi.delete(id);
      await load(search);
      toast.success('Cargo removido com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível remover o cargo.';
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
          Consulte os cargos registados e respetiva utilização nas eleições.
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
            Atualizar
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
            { id: 'acoes', label: 'Ações', className: 'font-semibold text-right' },
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
                <div key={`${row.id}:acoes`} className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void removePosition(row.id)}
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
    </section>
  );
}
