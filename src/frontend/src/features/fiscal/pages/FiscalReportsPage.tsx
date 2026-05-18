import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { electionsApi } from '@/api/elections.api';
import { Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { CommissionElectionItem } from '@/types/commission';
import type { ElectionResults } from '@/types/elector';

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

export function FiscalReportsPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
        setSelectedElectionId(response.items[0]?.id ?? '');
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

  useEffect(() => {
    if (!selectedElectionId) {
      setResults(null);
      return;
    }

    let isActive = true;
    const loadResults = async () => {
      setIsResultsLoading(true);
      try {
        const response = await electionsApi.getResults(selectedElectionId);
        if (!isActive) return;
        setResults(response);
      } catch (cause) {
        if (!isActive) return;
        setResults(null);
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os resultados.');
      } finally {
        if (isActive) setIsResultsLoading(false);
      }
    };
    void loadResults();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  const exportReport = () => {
    if (!results) return;
    downloadCsv(
      `relatorio-${results.election.id}.csv`,
      results.candidates.map((candidate) => ({
        eleicao: results.election.titulo,
        estado: results.election.estado,
        candidato: candidate.nome,
        estado_candidato: candidate.estado,
        votos: String(candidate.votes),
        percentagem: `${candidate.percentage.toFixed(2)}%`,
        total_votos: String(results.summary.totalVotes),
        eleitores_elegiveis: String(results.summary.totalEligibleVoters),
        participacao: `${results.summary.turnoutPercentage.toFixed(2)}%`,
        vencedor: results.winner?.nome ?? '-',
      })),
    );
    toast.success('Relatório exportado com sucesso.');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar relatórios...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight text-[#0f172a]">Relatórios</h1>
          <p className="text-ui-sm text-[#475569]">Gere relatórios CSV com base nos resultados reais das eleições.</p>
        </div>
        <button type="button" onClick={exportReport} disabled={!results} className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white disabled:opacity-60">
          <Download className="mr-2 h-4 w-4" />
          Exportar relatório
        </button>
      </div>

      <div className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <UiSelect
          value={selectedElectionId}
          onChange={setSelectedElectionId}
          ariaLabel="Eleição"
          placeholder="Seleccione uma eleição"
          options={elections.map((election) => ({ value: election.id, label: election.titulo }))}
        />
      </div>

      {isResultsLoading ? (
        <div className="rounded-sm border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
          A carregar resultados...
        </div>
      ) : results ? (
        <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
          <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-5 py-4">
            <FileText className="h-4 w-4 text-[#1A56DB]" />
            <h2 className="text-ui-base font-semibold text-[#0f172a]">{results.election.titulo}</h2>
          </div>
          <UiTable
            ariaLabel="Relatório por candidato"
            columns={[
              { id: 'candidato', label: 'Candidato', className: 'font-semibold' },
              { id: 'votos', label: 'Votos', className: 'font-semibold' },
              { id: 'percentagem', label: 'Percentagem', className: 'font-semibold' },
            ]}
            rows={results.candidates.map((candidate) => ({
              id: candidate.id,
              cells: [
                <span key={`${candidate.id}:nome`} className="text-sm font-semibold text-[#0f172a]">{candidate.nome}</span>,
                <span key={`${candidate.id}:votos`} className="text-sm text-[#334155]">{candidate.votes}</span>,
                <span key={`${candidate.id}:percentagem`} className="text-sm text-[#334155]">{candidate.percentage.toFixed(2)}%</span>,
              ],
            }))}
            emptyMessage="Sem candidatos para esta eleição."
          />
        </div>
      ) : (
        <div className="rounded-sm border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
          Sem relatório disponível para a eleição seleccionada.
        </div>
      )}
    </section>
  );
}
