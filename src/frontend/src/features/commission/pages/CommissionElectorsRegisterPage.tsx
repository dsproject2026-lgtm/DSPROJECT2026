import { useEffect, useState, type FormEvent } from 'react';
import { Eye, Upload } from 'lucide-react';

import { commissionApi } from '@/api/commission.api';
import { Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { CommissionSegmentTabs } from '@/features/commission/components/CommissionSegmentTabs';
import { ApiError } from '@/lib/http/api-error';
import type { CommissionElectionItem, ImportEligibleVotersResult } from '@/types/commission';

const SKIP_REASON_LABELS: Record<string, string> = {
  INVALID_CODE: 'Código inválido',
  INVALID_EMAIL: 'E-mail inválido',
  DUPLICATE_IN_FILE: 'Duplicado no ficheiro',
  USER_NOT_FOUND: 'Utilizador não encontrado e dados insuficientes para criar',
  ALREADY_REGISTERED: 'Já está registado nesta eleição',
  ELECTION_NOT_PROGRAMMED: 'A eleição não está programada',
  FACULTY_MISMATCH: 'Faculdade diferente da eleição',
  USER_WITHOUT_FACULTY: 'Utilizador sem faculdade',
};

export function CommissionElectorsRegisterPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [electionId, setElectionId] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ImportEligibleVotersResult | null>(null);
  const [result, setResult] = useState<ImportEligibleVotersResult | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsBootLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        const programmed = response.items.filter((item) => item.estado === 'PROGRAMADA');
        setElections(programmed);
        setElectionId(programmed[0]?.id || '');
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
      setPreview(null);
      setResult(null);
      return;
    }

    setCsvContent(await file.text());
    setFileName(file.name);
    setPreview(null);
    setResult(null);
  };

  const ensureReady = () => {
    if (!electionId) {
      toast.danger('Seleccione uma eleição.');
      return false;
    }

    if (csvRowsCount === 0) {
      toast.danger('Seleccione um ficheiro CSV com pelo menos um eleitor.');
      return false;
    }

    return true;
  };

  const previewImport = async () => {
    if (!ensureReady()) return;

    try {
      setIsPreviewing(true);
      const previewResult = await commissionApi.previewEligibleVotersCsv(electionId, csvContent);
      setPreview(previewResult);
      setResult(null);
      toast.success('Pré-visualização concluída.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao pré-visualizar eleitores.';
      toast.danger(message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ensureReady()) return;

    if (!preview) {
      toast.warning('Faça a pré-visualização antes de importar.');
      return;
    }

    if (preview.preview.length === 0) {
      toast.warning('Não existem eleitores válidos para importar.');
      return;
    }

    try {
      setIsImporting(true);
      const importResult = await commissionApi.importEligibleVotersCsv(electionId, csvContent);
      setResult(importResult);
      toast.success('Importação de eleitores concluída.');
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Falha ao importar eleitores.';
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
          Carregue um ficheiro CSV e confirme a pré-visualização antes de importar.
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
              onChange={(value) => {
                setElectionId(value);
                setPreview(null);
                setResult(null);
              }}
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
              Colunas aceites: <code>codigo,nome,email,faculdade,ano</code>.
            </p>
            {fileName ? <p className="mt-2 text-sm font-semibold text-[#0f172a]">{fileName}</p> : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#64748b]">{csvRowsCount} linha(s) detectadas.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void previewImport()}
              disabled={isPreviewing || isImporting}
              className="inline-flex h-10 items-center rounded-md border border-[#d1d9e6] bg-white px-4 text-sm font-medium text-[#0f172a] transition hover:bg-[#f8fafc] disabled:opacity-60"
            >
              {isPreviewing ? <Spinner size="sm" className="mr-2" /> : <Eye className="mr-2 h-4 w-4" />}
              Pré-visualizar
            </button>
            <button
              type="submit"
              disabled={isImporting || !preview}
              className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60"
            >
              {isImporting ? <Spinner size="sm" className="mr-2 text-white" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar CSV
            </button>
          </div>
        </div>
      </form>

      {preview ? <ImportPreview title="Pré-visualização" data={preview} /> : null}
      {result ? <ImportPreview title="Resultado da importação" data={result} imported /> : null}
    </section>
  );
}

function ImportPreview({
  title,
  data,
  imported = false,
}: {
  title: string;
  data: ImportEligibleVotersResult;
  imported?: boolean;
}) {
  return (
    <section className="space-y-4 rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
      <div>
        <h2 className="text-[20px] font-semibold text-[#0f172a]">{title}</h2>
        <p className="mt-1 text-base text-[#334155]">
          {imported ? 'Importados' : 'Serão importados'}: <strong>{data.count}</strong> de{' '}
          <strong>{data.totalCount}</strong>.
        </p>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0]">
        <UiTable
          ariaLabel="Eleitores aceites"
          columns={[
            { id: 'codigo', label: 'Código', className: 'font-semibold' },
            { id: 'nome', label: 'Nome', className: 'font-semibold' },
            { id: 'email', label: 'E-mail', className: 'font-semibold' },
            { id: 'faculdade', label: 'Faculdade', className: 'font-semibold' },
          ]}
          rows={data.preview.map((item) => ({
            id: `${item.codigo}:${item.email ?? ''}`,
            cells: [
              <span key={`${item.codigo}:codigo`} className="text-sm">{item.codigo}</span>,
              <span key={`${item.codigo}:nome`} className="text-sm">{item.nome}</span>,
              <span key={`${item.codigo}:email`} className="text-sm">{item.email ?? '-'}</span>,
              <span key={`${item.codigo}:faculdade`} className="text-sm">{item.faculdade ?? '-'}</span>,
            ],
          }))}
          emptyMessage="Nenhum eleitor válido para importar."
        />
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e2e8f0]">
        <UiTable
          ariaLabel="Eleitores ignorados"
          columns={[
            { id: 'codigo', label: 'Código', className: 'font-semibold' },
            { id: 'motivo', label: 'Motivo', className: 'font-semibold' },
          ]}
          rows={data.skipped.map((item, index) => ({
            id: `${item.codigo}:${item.reason}:${index}`,
            cells: [
              <span key={`${item.codigo}:code`} className="text-sm">{item.codigo || '-'}</span>,
              <span key={`${item.codigo}:reason`} className="text-sm">
                {SKIP_REASON_LABELS[item.reason] ?? item.reason}
              </span>,
            ],
          }))}
          emptyMessage="Nenhum eleitor foi ignorado."
        />
      </div>
    </section>
  );
}
