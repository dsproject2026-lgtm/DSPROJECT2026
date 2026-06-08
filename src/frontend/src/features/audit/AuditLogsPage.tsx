import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { AuditLogItem, CommissionElectionItem } from '@/types/commission';

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0] ?? { vazio: '' });
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header] ?? '')).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
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

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [auditResponse, electionsResponse] = await Promise.all([
          commissionApi.listAuditLogs(selectedElectionId ? { electionId: selectedElectionId } : undefined),
          commissionApi.listElections(),
        ]);
        if (!isActive) return;
        setLogs(auditResponse.items);
        setElections(electionsResponse.items);
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar a auditoria.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.accao, log.entidade ?? '', log.entidadeId ?? '', log.ip ?? '', log.utilizador?.nome ?? '', log.utilizador?.codigo ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [logs, search]);

  const exportLogs = () => {
    downloadCsv(
      'registos-auditoria.csv',
      filtered.map((log) => ({
        data: formatDate(log.timestamp),
        utilizador: log.utilizador?.nome ?? 'Sistema',
        codigo: log.utilizador?.codigo ?? '-',
        accao: log.accao,
        entidade: log.entidade ?? '-',
        entidade_id: log.entidadeId ?? '-',
        ip: log.ip ?? '-',
      })),
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar auditoria...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Auditoria</h1>
          <p className="text-ui-sm text-[#475569]">Consulta dos registos de auditoria gravados na base de dados.</p>
        </div>
        <button type="button" onClick={exportLogs} className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white">
          <Download className="mr-2 h-4 w-4" />
          Exportar logs
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        <UiSelect
          value={selectedElectionId}
          onChange={setSelectedElectionId}
          options={[
            { value: '', label: 'Todas as eleicoes' },
            ...elections.map((election) => ({ value: election.id, label: election.titulo })),
          ]}
          ariaLabel="Filtrar auditoria por eleicao"
          className="w-full"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por accao, utilizador, entidade ou IP"
          className="h-11 w-full rounded-sm border border-[#d1d9e6] bg-white px-3 text-sm text-[#475569] outline-none focus:border-[#0b73c9]"
        />
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <UiTable
          ariaLabel="Registos de auditoria"
          columns={[
            { id: 'data', label: 'Data', className: 'font-semibold' },
            { id: 'utilizador', label: 'Utilizador', className: 'font-semibold' },
            { id: 'accao', label: 'Accao', className: 'font-semibold' },
            { id: 'entidade', label: 'Entidade', className: 'font-semibold' },
            { id: 'ip', label: 'IP', className: 'font-semibold' },
          ]}
          rows={filtered.map((log) => ({
            id: log.id,
            cells: [
              <span key={`${log.id}:data`} className="text-sm text-[#334155]">{formatDate(log.timestamp)}</span>,
              <span key={`${log.id}:utilizador`} className="text-sm font-semibold text-[#0f172a]">{log.utilizador?.nome ?? 'Sistema'}</span>,
              <span key={`${log.id}:accao`} className="text-sm text-[#334155]">{log.accao}</span>,
              <span key={`${log.id}:entidade`} className="text-sm text-[#334155]">{log.entidade ?? '-'}</span>,
              <span key={`${log.id}:ip`} className="text-sm text-[#334155]">{log.ip ?? '-'}</span>,
            ],
          }))}
          emptyMessage="Nenhum registo de auditoria encontrado."
        />
      </div>
    </section>
  );
}
