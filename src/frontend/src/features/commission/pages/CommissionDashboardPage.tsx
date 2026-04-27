import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { Chip, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionItem } from '@/types/commission';

function isOpenVoting(election: CommissionElectionItem) {
  return election.estado === 'ABERTA';
}

function isConcluded(election: CommissionElectionItem) {
  return election.estado === 'CONCLUIDA';
}

export function CommissionDashboardPage() {
  const navigate = useNavigate();
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar o dashboard.';
        toast.danger(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: elections.length,
      emVotacao: elections.filter(isOpenVoting).length,
      concluidas: elections.filter(isConcluded).length,
      pendente: elections.filter((item) => item.estado === 'PENDENTE').length,
    }),
    [elections],
  );

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Dashboard da Comissão
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Acompanhe o estado das eleições e os principais indicadores da comissão.
        </p>
      </div>

      <CommissionSegmentTabs segment="eleicoes" />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Total</p>
          <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{stats.total}</p>
        </article>
        <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Votação aberta</p>
          <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{stats.emVotacao}</p>
        </article>
        <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Concluídas</p>
          <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{stats.concluidas}</p>
        </article>
        <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Pendente</p>
          <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{stats.pendente}</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Eleições"
          columns={[
            { id: 'titulo', label: 'Título', className: 'font-semibold' },
            { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'acoes', label: 'Ações', className: 'font-semibold text-right' },
          ]}
          rows={elections.map((item) => ({
            id: item.id,
            cells: [
              <div key={`${item.id}:titulo`}>
                <p className="text-base font-semibold text-[#0f172a]">{item.titulo}</p>
                <p className="text-sm text-[#64748b]">{item.descricao ?? '-'}</p>
              </div>,
              <span key={`${item.id}:cargo`} className="text-base">{item.cargo.nome}</span>,
              <Chip
                key={`${item.id}:estado`}
                size="sm"
                variant="soft"
                color={getStateChipColor(item.estado)}
                className="font-semibold"
              >
                {formatStateLabel(item.estado)}
              </Chip>,
              <div key={`${item.id}:acoes`} className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/comissao/eleicoes/detalhes/${item.id}`)}
                  className="rounded-[8px] p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  aria-label={`Visualizar detalhes da eleição ${item.titulo}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>,
            ],
          }))}
          emptyMessage="Nenhuma eleição disponível."
        />
      </div>
    </section>
  );
}
