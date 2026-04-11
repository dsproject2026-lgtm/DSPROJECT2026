import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const electionNamesById: Record<string, string> = {
  '1': 'Eleições AEUP 2026',
  '2': 'Conselho Universitário',
  '3': 'Assembleia de Faculdade',
};

const candidateNamesById: Record<string, string> = {
  'ricardo-mondlane': 'Ricardo Mondlane',
  'ana-bela': 'Ana Bela Chissano',
  'sergio-mabunda': 'Sérgio Mabunda',
  'beatriz-sitoe': 'Beatriz Sitoe',
  'joao-mondlane': 'João Mondlane',
  'lucia-gove': 'Lúcia Gove',
  'samuel-ubisse': 'Samuel Ubisse',
  'voto-branco': 'Voto em Branco',
};

export function ElectorConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const electionId = searchParams.get('electionId') ?? '';
  const candidateId = searchParams.get('candidateId') ?? '';

  const electionName = useMemo(() => electionNamesById[electionId] ?? 'Eleição selecionada', [electionId]);
  const candidateName = useMemo(
    () => candidateNamesById[candidateId] ?? 'Candidato selecionado',
    [candidateId],
  );

  return (
    <section className="space-y-4 rounded-md border border-[#d9dee8] bg-white p-4 sm:p-5">
      <header>
        <h1 className="text-xl font-bold text-[#0f172a] sm:text-2xl">Comprovativo de Voto</h1>
        <p className="mt-1 text-sm text-[#475569]">
          Fluxo de confirmação concluído. Esta base está pronta para integração com comprovativo real.
        </p>
      </header>

      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm">
        <p>
          <strong>Eleição:</strong> {electionName}
        </p>
        <p className="mt-1">
          <strong>Seleção:</strong> {candidateName}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="rounded-md border border-[#d9dee8] px-3 py-2 text-sm text-[#334155]"
        >
          Novo voto
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(`/eleitor/resultados${electionId ? `?electionId=${encodeURIComponent(electionId)}` : ''}`)
          }
          className="rounded-md bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white"
        >
          Ver resultados
        </button>
      </div>
    </section>
  );
}

export function ElectorResultsPage() {
  const [searchParams] = useSearchParams();
  const electionId = searchParams.get('electionId') ?? '';
  const electionName = electionNamesById[electionId] ?? 'Eleição em foco';

  return (
    <section className="space-y-3 rounded-md border border-[#d9dee8] bg-white p-4 sm:p-5">
      <h1 className="text-xl font-bold text-[#0f172a] sm:text-2xl">Resultados</h1>
      <p className="text-sm text-[#475569]">
        Base da tela de resultados pronta para integração com endpoint de apuração.
      </p>
      <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3 text-sm text-[#334155]">
        Eleição: {electionName}
      </p>
    </section>
  );
}
