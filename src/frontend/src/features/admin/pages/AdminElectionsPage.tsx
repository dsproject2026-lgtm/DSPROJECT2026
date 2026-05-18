import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Eye, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { Chip, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionItem } from '@/types/commission';

export function AdminElectionsPage() {
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
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições.');
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
      abertas: elections.filter((item) => item.estado === 'ABERTA').length,
      concluidas: elections.filter((item) => item.estado === 'CONCLUIDA').length,
      programadas: elections.filter((item) => item.estado === 'PROGRAMADA').length,
    }),
    [elections],
  );

  if (isLoading) return <UiPageSkeleton />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Eleições</h1>
        <p className="text-ui-sm text-[#475569]">Consulta administrativa das eleições. A edição é exclusiva da comissão eleitoral.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total" value={stats.total} icon={<ListChecks className="h-6 w-6 text-[#0b73c9]" />} />
        <Metric label="Abertas" value={stats.abertas} icon={<Clock3 className="h-6 w-6 text-[#0b73c9]" />} />
        <Metric label="Concluídas" value={stats.concluidas} icon={<CheckCircle2 className="h-6 w-6 text-[#0b73c9]" />} />
        <Metric label="Programadas" value={stats.programadas} icon={<CalendarDays className="h-6 w-6 text-[#0b73c9]" />} />
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Eleições"
          columns={[
            { id: 'titulo', label: 'Título', className: 'font-semibold' },
            { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'acoes', label: 'Acções', className: 'font-semibold text-right' },
          ]}
          rows={elections.map((item) => ({
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
              <div key={`${item.id}:acoes`} className="flex justify-end">
                <button type="button" onClick={() => navigate(`/admin/eleicoes/detalhes/${item.id}`)} className="rounded-[8px] p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
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

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[46px] font-semibold leading-none text-[#0b73c9]">{value}</p>
        {icon}
      </div>
    </article>
  );
}
