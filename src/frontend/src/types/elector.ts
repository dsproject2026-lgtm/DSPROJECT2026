export type BackendElectionState =
  | 'PENDENTE'
  | 'ABERTA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface ElectionCargo {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface ElectionListItem {
  id: string;
  titulo: string;
  descricao: string | null;
  estado: BackendElectionState;
  dataInicioVotacao: string | null;
  dataFimVotacao: string | null;
  cargo: ElectionCargo;
}

export interface ElectionListResponse {
  items: ElectionListItem[];
  count: number;
}

export interface BallotCandidate {
  id: string;
  nome: string;
  fotoUrl: string | null;
  biografia: string | null;
  proposta: string | null;
}

export interface ElectionBallot {
  election: {
    id: string;
    titulo: string;
    estado: BackendElectionState;
    dataInicioVotacao: string | null;
    dataFimVotacao: string | null;
  };
  candidates: BallotCandidate[];
}

export interface CastVoteResult {
  receiptCode: string;
  votedAt: string;
  electionId: string;
  candidateId: string;
}

export interface VoteStatusResult {
  electionId: string;
  hasVoted: boolean;
  votedAt: string | null;
  receiptCode: string | null;
}

export interface ElectionResults {
  election: {
    id: string;
    titulo: string;
    estado: BackendElectionState;
  };
  summary: {
    totalEligibleVoters: number;
    totalVotes: number;
    turnoutPercentage: number;
  };
  candidates: Array<{
    id: string;
    nome: string;
    estado: string;
    votes: number;
    percentage: number;
  }>;
  winner: {
    candidateId: string;
    nome: string;
    votes: number;
  } | null;
}
