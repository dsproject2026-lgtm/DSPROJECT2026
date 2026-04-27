import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, Spinner, UiSelect, UiTable, toast } from '@/components/ui';
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
  const [search, setSearch] = useState('');
  const [voteFilter, setVoteFilter] = useState<VoteFilter>('TODOS');
  const [bootLoading, setBootLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);

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
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar eleições.';
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
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar elegíveis.';
        toast.danger(message);
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

  if (bootLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar elegíveis...</span>
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
              placeholder="Pesquisar por nome, código, email ou utilizadorId"
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
            { id: 'voto', label: 'jáVotou', className: 'font-semibold' },
            { id: 'acoes', label: 'Ações', className: 'text-right font-semibold' },
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
                      {row.utilizador.activo ? 'ATIVO' : 'INATIVO'}
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
                    <div key={`${row.id}:actions`} className="text-right">
                      <button
                        type="button"
                        onClick={() => setDetailElector(row)}
                        className="inline-flex rounded p-1 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                        aria-label="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>,
                  ],
                }))
          }
          emptyMessage={
            !selectedElectionId
              ? 'Selecione uma eleição para visualizar os elegíveis.'
              : rowsLoading
                ? 'A carregar eleitores elegíveis...'
                : 'Nenhum eleitor elegível encontrado.'
          }
        />
      </div>

      {detailElector ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-md border border-[#d1d9e6] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Detalhes do Eleitor</h3>
              <button
                type="button"
                onClick={() => setDetailElector(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d1d9e6] text-[#64748b] transition hover:bg-[#f8fafc]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-74px)] overflow-y-auto px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">id</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.utilizador.id}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">codigo</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.utilizador.codigo}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">nome</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.utilizador.nome}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">email</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.utilizador.email ?? '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">perfil</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.utilizador.perfil}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">jaVotou</p>
                  <p className="mt-1 text-[14px] text-slate-700">{detailElector.jaVotou ? 'TRUE' : 'FALSE'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Importado em
                  </p>
                  <p className="mt-1 text-[14px] text-slate-700">{formatDateTime(detailElector.importadoEm)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
