import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, FileText, ShieldCheck, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { electionsApi } from '@/api/elections.api';
import { Chip, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { AuditLogItem, CommissionElectionItem } from '@/types/commission';

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function FiscalDashboardPage() {
  const navigate = useNavigate();
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [electionsResponse, auditResponse] = await Promise.all([
          commissionApi.listElections(),
          commissionApi.listAuditLogs(),
        ]);
        const resultResponses = await Promise.allSettled(
          electionsResponse.items.map((election) => electionsApi.getResults(election.id)),
        );
        if (!isActive) return;
        setElections(electionsResponse.items);
        setLogs(auditResponse.items);
        setTotalVotes(
          resultResponses.reduce((total, item) => {
            if (item.status !== 'fulfilled') return total;
            return total + item.value.summary.totalVotes;
          }, 0),
        );
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Nao foi possivel carregar o painel de fiscalizacao.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(
    () => ({
      elections: elections.length,
      open: elections.filter((item) => item.estado === 'ABERTA').length,
      logs: logs.length,
      votes: totalVotes,
    }),
    [elections, logs.length, totalVotes],
  );

  const recentLogs = logs.slice(0, 5);

  if (isLoading) return <UiPageSkeleton />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Painel de Fiscalizacao</h1>
        <p className="text-ui-sm text-[#475569]">Visao real de eleicoes, votos e auditoria.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Eleicoes" value={metrics.elections} icon={<Vote className="h-5 w-5" />} />
        <Metric title="Em curso" value={metrics.open} icon={<ShieldCheck className="h-5 w-5" />} />
        <Metric title="Votos registados" value={metrics.votes} icon={<FileText className="h-5 w-5" />} />
        <Metric title="Registos de auditoria" value={metrics.logs} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
            <h2 className="text-ui-lg font-semibold text-[#0f172a]">Eleicoes</h2>
            <button type="button" onClick={() => navigate('/fiscal/resultados')} className="text-ui-sm font-semibold text-[#1A56DB]">
              Ver resultados
            </button>
          </div>
          <UiTable
            ariaLabel="Eleicoes fiscalizadas"
            columns={[
              { id: 'titulo', label: 'Titulo', className: 'font-semibold' },
              { id: 'estado', label: 'Estado', className: 'font-semibold' },
            ]}
            rows={elections.slice(0, 5).map((election) => ({
              id: election.id,
              cells: [
                <span key={`${election.id}:titulo`} className="text-sm font-semibold text-[#0f172a]">{election.titulo}</span>,
                <Chip key={`${election.id}:estado`} size="sm" variant="soft" color={getStateChipColor(election.estado)} className="font-semibold">
                  {formatStateLabel(election.estado)}
                </Chip>,
              ],
            }))}
            emptyMessage="Nenhuma eleicao registada."
          />
        </div>

        <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
          <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
            <h2 className="text-ui-lg font-semibold text-[#0f172a]">Auditoria recente</h2>
            <button type="button" onClick={() => navigate('/fiscal/auditoria')} className="text-ui-sm font-semibold text-[#1A56DB]">
              Ver auditoria
            </button>
          </div>
          <UiTable
            ariaLabel="Auditoria recente"
            columns={[
              { id: 'accao', label: 'Accao', className: 'font-semibold' },
              { id: 'utilizador', label: 'Utilizador', className: 'font-semibold' },
            ]}
            rows={recentLogs.map((log) => ({
              id: log.id,
              cells: [
                <span key={`${log.id}:accao`} className="text-sm text-[#334155]">{log.accao}</span>,
                <span key={`${log.id}:utilizador`} className="text-sm font-semibold text-[#0f172a]">{log.utilizador?.nome ?? 'Sistema'}</span>,
              ],
            }))}
            emptyMessage="Nenhum registo de auditoria encontrado."
          />
        </div>
      </div>
    </section>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{title}</p>
        <div className="text-[#0b73c9]">{icon}</div>
      </div>
      <p className="mt-3 text-[42px] font-semibold leading-none text-[#0b73c9]">{formatNumber(value)}</p>
    </article>
  );
}
