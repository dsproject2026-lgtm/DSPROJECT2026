import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Eye, ShieldCheck, Users, Vote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { commissionApi } from '@/api/commission.api';
import { Chip, UiPageSkeleton, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { AuditLogItem, CommissionElectionItem, TeamMemberItem } from '@/types/commission';

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-PT').format(value);
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [team, setTeam] = useState<TeamMemberItem[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [electionsResponse, teamResponse, auditResponse] = await Promise.all([
          commissionApi.listElections(),
          commissionApi.listTeamMembers(),
          commissionApi.listAuditLogs(),
        ]);
        if (!isActive) return;
        setElections(electionsResponse.items);
        setTeam(teamResponse.items);
        setLogs(auditResponse.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Nao foi possivel carregar o painel administrativo.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const abertas = elections.filter((item) => item.estado === 'ABERTA').length;
    const concluidas = elections.filter((item) => item.estado === 'CONCLUIDA').length;
    return {
      totalElections: elections.length,
      abertas,
      concluidas,
      teamActive: team.filter((item) => item.activo).length,
      auditCount: logs.length,
    };
  }, [elections, logs.length, team]);

  const recentElections = [...elections]
    .sort((a, b) => String(b.dataInicioVotacao ?? '').localeCompare(String(a.dataInicioVotacao ?? '')))
    .slice(0, 5);

  if (isLoading) return <UiPageSkeleton />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Painel de Controlo</h1>
        <p className="text-ui-sm text-[#475569]">Indicadores reais do sistema eleitoral.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Eleicoes" value={metrics.totalElections} icon={<Vote className="h-5 w-5" />} />
        <Metric title="Abertas" value={metrics.abertas} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Metric title="Equipa activa" value={metrics.teamActive} icon={<Users className="h-5 w-5" />} />
        <Metric title="Registos de auditoria" value={metrics.auditCount} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <div className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-ui-lg font-semibold text-[#0f172a]">Eleicoes recentes</h2>
          <button type="button" onClick={() => navigate('/admin/eleicoes')} className="text-ui-sm font-semibold text-[#1A56DB]">
            Ver todas
          </button>
        </div>
        <UiTable
          ariaLabel="Eleicoes recentes"
          columns={[
            { id: 'titulo', label: 'Titulo', className: 'font-semibold' },
            { id: 'cargo', label: 'Cargo', className: 'font-semibold' },
            { id: 'estado', label: 'Estado', className: 'font-semibold' },
            { id: 'accao', label: 'Accao', className: 'text-right font-semibold' },
          ]}
          rows={recentElections.map((election) => ({
            id: election.id,
            cells: [
              <span key={`${election.id}:titulo`} className="text-sm font-semibold text-[#0f172a]">{election.titulo}</span>,
              <span key={`${election.id}:cargo`} className="text-sm text-[#334155]">{election.cargo.nome}</span>,
              <Chip key={`${election.id}:estado`} size="sm" variant="soft" color={getStateChipColor(election.estado)} className="font-semibold">
                {formatStateLabel(election.estado)}
              </Chip>,
              <div key={`${election.id}:accao`} className="flex justify-end">
                <button type="button" onClick={() => navigate(`/admin/eleicoes/detalhes/${election.id}`)} className="rounded-[8px] p-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]" aria-label="Visualizar">
                  <Eye className="h-4 w-4" />
                </button>
              </div>,
            ],
          }))}
          emptyMessage="Nenhuma eleicao registada."
        />
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
