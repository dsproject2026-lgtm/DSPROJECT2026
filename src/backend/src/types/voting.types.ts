import type { EstadoEleicao } from './model.types.js';

export interface BallotCandidateItem {
  id: string;
  nome: string;
  fotoUrl: string | null;
  biografia: string | null;
  proposta: string | null;
}

export interface ElectionBallotResponse {
  election: {
    id: string;
    titulo: string;
    estado: EstadoEleicao;
    dataInicioVotacao: Date | null;
    dataFimVotacao: Date | null;
  };
  candidates: BallotCandidateItem[];
}

export interface CastVoteInput {
  candidatoId: string;
}

export interface CastVoteResponse {
  receiptCode: string;
  votedAt: Date;
  electionId: string;
  candidateId: string;
}

export interface VoteStatusResponse {
  electionId: string;
  hasVoted: boolean;
  votedAt: Date | null;
  receiptCode: string | null;
}

export interface ElectionResultCandidateItem {
  id: string;
  nome: string;
  estado: string;
  votes: number;
  percentage: number;
}

export interface ElectionResultsResponse {
  election: {
    id: string;
    titulo: string;
    estado: EstadoEleicao;
  };
  summary: {
    totalEligibleVoters: number;
    totalVotes: number;
    turnoutPercentage: number;
  };
  candidates: ElectionResultCandidateItem[];
  winner: {
    candidateId: string;
    nome: string;
    votes: number;
  } | null;
}