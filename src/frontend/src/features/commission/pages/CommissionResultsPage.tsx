import { useEffect, useState } from 'react';

import { electionsApi } from '@/api/elections.api';
import { commissionApi } from '@/api/commission.api';
import { Chip, Spinner, UiSelect, UiTable, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { formatStateLabel, getStateChipColor } from '@/lib/ui/state-chip';
import type { CommissionElectionItem } from '@/types/commission';
import type { ElectionResults } from '@/types/elector';

export function CommissionResultsPage() {
  const [elections, setElections] = useState<CommissionElectionItem[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isResultsLoading, setIsResultsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsBootLoading(true);
      try {
        const response = await commissionApi.listElections();
        if (!isActive) return;
        setElections(response.items);
        setSelectedElectionId(response.items[0]?.id || '');
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar eleições.';
        toast.danger(message);
      } finally {
        if (isActive) setIsBootLoading(false);
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

    const load = async () => {
      setIsResultsLoading(true);
      try {
        const response = await electionsApi.getResults(selectedElectionId);
        if (!isActive) return;
        setResults(response);
      } catch (cause) {
        if (!isActive) return;
        setResults(null);
        const message =
          cause instanceof ApiError
            ? cause.message
            : 'Não foi possível carregar resultados desta eleição.';
        toast.danger(message);
      } finally {
        if (isActive) setIsResultsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [selectedElectionId]);

  if (isBootLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="flex items-center gap-3 text-[#334155]">
          <Spinner color="accent" />
          <span className="text-sm font-semibold">A carregar resultados...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
          Resultados
        </h1>
        <p className="text-ui-sm text-[#475569]">
          Acompanhe os resultados e a participação de cada eleição.
        </p>
      </div>

      <div className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
          Eleição
        </label>
        <UiSelect
          value={selectedElectionId}
          onChange={setSelectedElectionId}
          placeholder="Selecione"
          ariaLabel="Eleição"
          options={elections.map((item) => ({
            value: item.id,
            label: item.titulo,
          }))}
        />
      </div>

      {!selectedElectionId ? (
        <section className="rounded-sm border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
          Selecione uma eleição para ver os resultados.
        </section>
      ) : isResultsLoading ? (
        <section className="rounded-sm border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
          A carregar resultados...
        </section>
      ) : !results ? (
        <section className="rounded-sm border border-[#e2e8f0] bg-white p-6 text-center text-sm text-[#64748b]">
          Sem resultados disponíveis para esta eleição.
        </section>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
                Eleitores elegíveis
              </p>
              <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">
                {results.summary.totalEligibleVoters}
              </p>
            </article>
            <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
                Total de votos
              </p>
              <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">{results.summary.totalVotes}</p>
            </article>
            <article className="rounded-sm border border-[#e2e8f0] bg-white p-5 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
                Participação
              </p>
              <p className="mt-3 text-[46px] font-semibold leading-none text-[#0b73c9]">
                {results.summary.turnoutPercentage.toFixed(2)}%
              </p>
            </article>
          </div>

          <div className="overflow-hidden rounded-sm border border-[#e2e8f0] bg-white shadow-none">
            <UiTable
              ariaLabel="Resultados por candidato"
              columns={[
                { id: 'candidato', label: 'Candidato', className: 'font-semibold' },
                { id: 'estado', label: 'Estado', className: 'font-semibold' },
                { id: 'votos', label: 'Votos', className: 'font-semibold' },
                { id: 'percentual', label: 'Percentual', className: 'font-semibold' },
              ]}
              rows={results.candidates.map((candidate) => ({
                id: candidate.id,
                cells: [
                  <span key={`${candidate.id}:name`} className="text-base">{candidate.nome}</span>,
                  <Chip
                    key={`${candidate.id}:state`}
                    size="sm"
                    variant="soft"
                    color={getStateChipColor(candidate.estado)}
                    className="font-semibold"
                  >
                    {formatStateLabel(candidate.estado)}
                  </Chip>,
                  <span key={`${candidate.id}:votes`} className="text-base">{candidate.votes}</span>,
                  <span key={`${candidate.id}:pct`} className="text-base">{candidate.percentage.toFixed(2)}%</span>,
                ],
              }))}
            />
          </div>

          {results.winner ? (
            <section className="rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
              Vencedor: <strong>{results.winner.nome}</strong> com {results.winner.votes} voto(s).
            </section>
          ) : (
            <section className="rounded-sm border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#64748b]">
              Ainda sem vencedor definido.
            </section>
          )}
        </>
      )}
    </section>
  );
}
