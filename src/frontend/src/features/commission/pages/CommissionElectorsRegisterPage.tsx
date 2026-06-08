import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { ApiError } from '@/lib/http/api-error';
import type { CommissionElectionItem } from '@/types/commission';

export function CommissionElectorsRegisterPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [electionId, setElectionId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    importedCount: number;
    totalCount: number;
    skipped: Array<{ codigo: string; reason: string }>;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
        setElectionId(response.items[0]?.id || '');
      } catch (cause) {
        if (!isActive) return;
        toast.danger(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as eleições.');
      } finally {
        if (isActive) setIsBootLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const csvRowsCount = csvContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith('codigo')).length;

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setCsvContent('');
      setFileName('');
      return;
    }

    setCsvContent(await file.text());
    setFileName(file.name);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!electionId) {
      toast.danger('Seleccione uma eleição.');
      return;
    }

    if (csvRowsCount === 0) {
      toast.danger('Seleccione um ficheiro CSV com pelo menos um eleitor.');
      return;
    }

    try {
      setIsImporting(true);
      const importResult = await commissionApi.importEligibleVotersCsv(electionId, csvContent);
      setResult({
        importedCount: importResult.count,
        totalCount: importResult.totalCount,
        skipped: importResult.skipped,
      });
      toast.success('Importação de elegíveis concluída.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao importar elegíveis.';
      toast.danger(message);
    } finally {
      setIsImporting(false);
    }
  };

  if (isBootLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar dados...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Importar Eleitores Elegíveis
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Carregue um ficheiro CSV. Se a eleição for de uma faculdade, só serão importados eleitores dessa faculdade.
        </p>
      </div>

      <CommissionSegmentTabs segment="estudantes" />

      <form onSubmit={submit} className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <div className="grid gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Eleição
            </label>
            <UiSelect
              value={electionId}
              onChange={setElectionId}
              placeholder="Seleccione"
              ariaLabel="Eleição"
              options={elections.map((item) => ({ value: item.id, label: item.titulo }))}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              Ficheiro CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
              className="block w-full rounded-sm border border-[#d1d9e6] bg-white px-3 py-2 text-sm text-[#475569] file:mr-4 file:rounded-sm file:border-0 file:bg-[#1A56DB] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <p className="mt-1 text-sm text-[#64748b]">
              Colunas aceites: <code>codigo,nome,email,faculdade,ano</code>. O nome e o e-mail permitem criar o eleitor no primeiro acesso.
            </p>
            {fileName ? <p className="mt-2 text-sm font-semibold text-[#0f172a]">{fileName}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-[#64748b]">{csvRowsCount} linha(s) prontas para importar.</p>
          <button
            type="submit"
            disabled={isImporting}
            className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
          >
            {isImporting ? <Spinner size="sm" className="mr-2 text-white" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar CSV
          </button>
        </div>
      </form>

      {result ? (
        <section className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
          <h2 className="text-[20px] font-semibold text-[#0f2c12]">Resultado da importação</h2>
          <p className="mt-2 text-base text-[#334155]">
            Importados: <strong>{result.importedCount}</strong> de <strong>{result.totalCount}</strong>.
          </p>

          {result.skipped.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-sm border border-[#e2e8f0]">
              <UiTable
                ariaLabel="Códigos ignorados"
                columns={[
                  { id: 'codigo', label: 'Código', className: 'font-semibold' },
                  { id: 'motivo', label: 'Motivo', className: 'font-semibold' },
                ]}
                rows={result.skipped.map((item) => ({
                  id: `${item.codigo}:${item.reason}`,
                  cells: [
                    <span key={`${item.codigo}:code`} className="text-sm">{item.codigo}</span>,
                    <span key={`${item.codigo}:reason`} className="text-sm">{item.reason}</span>,
                  ],
                }))}
              />
            </div>
          ) : (
            <p className="mt-3 rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
              Nenhum código foi ignorado.
            </p>
          )}
        </section>
      ) : null}
    </section>
  );
}
