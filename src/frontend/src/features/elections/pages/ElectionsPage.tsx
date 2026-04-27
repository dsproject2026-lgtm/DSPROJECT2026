import { useEffect, useState } from 'react';

import { electionsApi } from '@/api/elections.api';
import { EmptyState } from '@/components/common/EmptyState';
import { PageTitle } from '@/components/common/PageTitle';
import { Spinner, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { ElectionSummary } from '@/types/election';

export function ElectionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elections, setElections] = useState<ElectionSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await electionsApi.list();
        setElections(Array.isArray(data) ? data : []);
      } catch (cause) {
        if (cause instanceof ApiError) {
          setError(cause.message);
          toast.danger(cause.message);
        } else {
          setError('Não foi possível carregar eleições.');
          toast.danger('Não foi possível carregar eleições.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div>
      <PageTitle
        title="Elections"
        subtitle="Estrutura preparada para listar e gerir eleições conforme os endpoints planejados."
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner color="accent" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && elections.length === 0 ? (
        <EmptyState
          title="Sem dados de eleições"
          message="Quando o endpoint /elections estiver implementado, os itens aparecerão aqui."
        />
      ) : null}

      {!isLoading && !error && elections.length > 0 ? (
        <div className="grid gap-3">
          {elections.map((election) => (
            <div key={election.id} className="rounded-lg border border-border bg-white p-4">
              <p className="font-semibold text-text-primary">{election.titulo}</p>
              <p className="mt-1 text-sm text-text-secondary">Estado: {election.estado}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
