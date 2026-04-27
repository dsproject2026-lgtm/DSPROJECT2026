import type { BackendElectionState } from './elector';

export type CandidateState = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'SUSPENSO';

export interface PositionItem {
  id: string;
  nome: string;
  descricao: string | null;
  eleicoes?: Array<{
    id: string;
    titulo: string;
    estado: BackendElectionState;
  }>;
}

export interface PositionListResponse {
  items: PositionItem[];
  count: number;
}

export interface CommissionElectionItem {
  id: string;
  cargoId: string;
  titulo: string;
  descricao: string | null;
  estado: BackendElectionState;
  dataInicioCandidatura: string | null;
  dataFimCandidatura: string | null;
  dataInicioVotacao: string | null;
  dataFimVotacao: string | null;
  cargo: PositionItem;
}

export interface CommissionElectionCandidateSummary {
  id: string;
  nome: string;
  estado: CandidateState;
}

export interface CommissionElectionEligibleSummary {
  id: string;
  utilizadorId: string;
  jaVotou: boolean;
}

export interface CommissionElectionReceiptSummary {
  id: string;
  codigoVerificacao: string;
  emitidoEm: string;
}

export interface CommissionElectionDetailsItem extends CommissionElectionItem {
  candidatos: CommissionElectionCandidateSummary[];
  elegiveis: CommissionElectionEligibleSummary[];
  comprovativos: CommissionElectionReceiptSummary[];
}

export interface CommissionElectionListResponse {
  items: CommissionElectionItem[];
  count: number;
}

export interface CandidateUserItem {
  id: string;
  codigo: string;
  nome: string;
  email: string | null;
  activo: boolean;
}

export interface CandidateUserListResponse {
  items: CandidateUserItem[];
  count: number;
}

export interface CreateElectionInput {
  cargoId: string;
  titulo: string;
  descricao?: string | null;
  estado?: BackendElectionState;
  dataInicioCandidatura?: string | null;
  dataFimCandidatura?: string | null;
  dataInicioVotacao?: string | null;
  dataFimVotacao?: string | null;
  candidatos?: Array<{
    utilizadorId: string;
    nome: string;
    fotoUrl?: string | null;
    biografia?: string | null;
    proposta?: string | null;
    estado?: CandidateState;
  }>;
}

export interface UpdateElectionInput {
  cargoId?: string;
  titulo?: string;
  descricao?: string | null;
  estado?: BackendElectionState;
  dataInicioCandidatura?: string | null;
  dataFimCandidatura?: string | null;
  dataInicioVotacao?: string | null;
  dataFimVotacao?: string | null;
}

export interface CandidateItem {
  id: string;
  eleicaoId: string;
  utilizadorId: string;
  nome: string;
  fotoUrl: string | null;
  biografia: string | null;
  proposta: string | null;
  estado: CandidateState;
  utilizador: {
    id: string;
    codigo: string;
    nome: string;
    email: string | null;
    perfil: string;
    activo: boolean;
    mustSetPassword: boolean;
    createdAt: string;
  };
}

export interface CandidateListResponse {
  items: CandidateItem[];
  count: number;
}

export interface CreateCandidateInput {
  utilizadorId: string;
  nome: string;
  fotoUrl?: string | null;
  biografia?: string | null;
  proposta?: string | null;
}

export interface UpdateCandidateInput {
  utilizadorId?: string;
  nome?: string;
  fotoUrl?: string | null;
  biografia?: string | null;
  proposta?: string | null;
  estado?: CandidateState;
}

export interface EligibleVoterItem {
  id: string;
  eleicaoId: string;
  utilizadorId: string;
  jaVotou: boolean;
  importadoEm: string;
  utilizador: {
    id: string;
    codigo: string;
    nome: string;
    email: string | null;
    perfil: string;
    activo: boolean;
    mustSetPassword: boolean;
    createdAt: string;
  };
}

export interface EligibleVoterListResponse {
  items: EligibleVoterItem[];
  count: number;
}

export interface ImportEligibleVotersResult {
  imported: EligibleVoterItem[];
  skipped: Array<{
    codigo: string;
    reason: 'INVALID_CODE' | 'USER_NOT_FOUND' | 'ALREADY_REGISTERED';
  }>;
  count: number;
  totalCount: number;
}
