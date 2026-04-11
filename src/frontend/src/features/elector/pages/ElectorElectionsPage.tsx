import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface CandidateOption {
  id: string;
  nome: string;
  detalhe: string;
}

interface ElectionVotingData {
  id: string;
  titulo: string;
  tempoRestante: string;
  candidatos: CandidateOption[];
}

const electionVotingData: Record<string, ElectionVotingData> = {
  '1': {
    id: '1',
    titulo: 'Eleições AEUP 2026',
    tempoRestante: '04:12:45',
    candidatos: [
      { id: 'ricardo-mondlane', nome: 'Ricardo Mondlane', detalhe: 'Lic. em Engenharia Informática' },
      { id: 'ana-bela', nome: 'Ana Bela Chissano', detalhe: 'Lic. em Direito' },
      { id: 'sergio-mabunda', nome: 'Sérgio Mabunda', detalhe: 'Lic. em Gestão de Empresas' },
      { id: 'voto-branco', nome: 'Voto em Branco', detalhe: 'Não selecionar nenhum candidato' },
    ],
  },
  '2': {
    id: '2',
    titulo: 'Conselho Universitário',
    tempoRestante: '12:01:10',
    candidatos: [
      { id: 'beatriz-sitoe', nome: 'Beatriz Sitoe', detalhe: 'Representantes de Curso' },
      { id: 'joao-mondlane', nome: 'João Mondlane', detalhe: 'Representantes de Curso' },
      { id: 'voto-branco', nome: 'Voto em Branco', detalhe: 'Não selecionar nenhum candidato' },
    ],
  },
  '3': {
    id: '3',
    titulo: 'Assembleia de Faculdade',
    tempoRestante: '09:58:22',
    candidatos: [
      { id: 'lucia-gove', nome: 'Lúcia Gove', detalhe: 'Faculdade de Ciências da Terra' },
      { id: 'samuel-ubisse', nome: 'Samuel Ubisse', detalhe: 'Faculdade de Ciências da Terra' },
      { id: 'voto-branco', nome: 'Voto em Branco', detalhe: 'Não selecionar nenhum candidato' },
    ],
  },
};

export function ElectorElectionsPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const election = useMemo(() => {
    if (!electionId) {
      return null;
    }

    return electionVotingData[electionId] ?? null;
  }, [electionId]);

  if (!election) {
    return (
      <section className="space-y-3 rounded-md border border-[#d9dee8] bg-white p-4 sm:p-5">
        <h1 className="text-lg font-semibold text-[#0f172a] sm:text-xl">Eleição não encontrada</h1>
        <p className="text-sm text-[#475569]">
          Selecione uma eleição na área de voto para continuar o fluxo.
        </p>
        <Link to="/eleitor/dashboard" className="inline-block text-sm font-semibold text-[#1d4ed8]">
          Voltar para o voto
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-md border border-[#d9dee8] bg-white p-4 sm:p-5">
      <header>
        <h1 className="text-xl font-bold text-[#0f172a] sm:text-2xl">{election.titulo}</h1>
        <p className="mt-1 text-sm text-[#475569]">Tempo restante: {election.tempoRestante}</p>
      </header>

      <div className="space-y-2">
        {election.candidatos.map((candidate) => {
          const isSelected = candidate.id === selectedCandidateId;

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedCandidateId(candidate.id)}
              className={`w-full rounded-md border p-3 text-left ${
                isSelected ? 'border-[#1d4ed8] bg-[#eff6ff]' : 'border-[#d9dee8] bg-[#f8fafc]'
              }`}
            >
              <p className="text-sm font-semibold text-[#0f172a]">{candidate.nome}</p>
              <p className="text-xs text-[#64748b]">{candidate.detalhe}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate('/eleitor/dashboard')}
          className="rounded-md border border-[#d9dee8] px-3 py-2 text-sm text-[#334155] sm:w-auto"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={!selectedCandidateId}
          onClick={() =>
            navigate(
              `/eleitor/confirmacao?electionId=${encodeURIComponent(election.id)}&candidateId=${encodeURIComponent(
                selectedCandidateId ?? '',
              )}`,
            )
          }
          className="rounded-md bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#93c5fd] sm:w-auto"
        >
          Confirmar voto
        </button>
      </div>
    </section>
  );
}
