import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
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
  const location = useLocation();
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAllElectionsView = location.pathname.includes('/eleicoes/visualizar');

  useEffect(() => {
    let isActive = true;
    const boot = async () => {
      setIsLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar o painel.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      isActive = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: elections.length,
      emVotacao: elections.filter(isOpenVoting).length,
      concluidas: elections.filter(isConcluded).length,
      pendente: elections.filter((item) => item.estado === 'PROGRAMADA').length,
    }),
    [elections],
  );

  const visibleElections = useMemo(
    () => (isAllElectionsView ? elections : elections.slice(0, 5)),
    [elections, isAllElectionsView],
  );

  if (isLoading) {
    return <UiPageSkeleton />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Visão Geral
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Acompanhe o estado das eleições e os principais indicadores da comissão.
        </p>
      </div>

      {/* <CommissionSegmentTabs segment="eleicoes" /> */}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={stats.total} icon={<ListChecks className="h-6 w-6 text-[#0b73c9]" />} onClick={() => navigate('/comissao/eleicoes/visualizar')} />
        <MetricCard label="Votação aberta" value={stats.emVotacao} icon={<Clock3 className="h-6 w-6 text-[#0b73c9]" />} onClick={() => navigate('/comissao/eleicoes/visualizar')} />
        <MetricCard label="Concluídas" value={stats.concluidas} icon={<CheckCircle2 className="h-6 w-6 text-[#0b73c9]" />} onClick={() => navigate('/comissao/resultados')} />
        <MetricCard label="Programadas" value={stats.pendente} icon={<CalendarDays className="h-6 w-6 text-[#0b73c9]" />} onClick={() => navigate('/comissao/eleicoes/visualizar')} />
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-ui-lg font-semibold text-[#0f172a]">
            {isAllElectionsView ? 'Todas as eleições' : 'Eleições recentes'}
          </h2>
          {!isAllElectionsView ? (
            <button
              type="button"
              onClick={() => navigate('/comissao/eleicoes/visualizar')}
              className="text-ui-sm font-semibold text-[#0b73c9] hover:underline"
            >
              Ver todas
            </button>
          ) : null}
        </div>

        <UiTable
          ariaLabel="Eleições"
          columns={[
            { id: 'titulo', label: 'Título', className: 'font-semibold' },
            { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
          ]}
          rows={visibleElections.map((item) => ({
            id: item.id,
            cells: [
              <div key={`${item.id}:titulo`}>
                <p className="text-base font-semibold text-[#0f172a]">{item.titulo}</p>
                <p className="text-sm text-[#64748b]">{item.descricao ?? '-'}</p>
              </div>,
              <span key={`${item.id}:cargo`} className="text-base">{item.cargo.nome}</span>,
              <Chip key={`${item.id}:estado`} size="sm" variant="soft" color={getStateChipColor(item.estado)} className="font-semibold">
                {formatStateLabel(item.estado)}
              </Chip>,
            ],
          }))}
          emptyMessage="Nenhuma eleição disponível."
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm border border-[#e2e8f0] bg-white p-5 text-left shadow-none transition hover:border-[#bfdbfe] hover:bg-[#f8fafc]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[46px] font-semibold leading-none text-[#0b73c9]">{value}</p>
        {icon}
      </div>
    </button>
  );
}
