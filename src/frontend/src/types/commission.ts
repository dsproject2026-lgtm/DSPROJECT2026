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
  faculdadeId: string | null;
  titulo: string;
  descricao: string | null;
  estado: BackendElectionState;
  escopoEleitores: 'TODOS' | 'FACULDADE';
  dataInicioCandidatura: string | null;
  dataFimCandidatura: string | null;
  dataInicioVotacao: string | null;
  dataFimVotacao: string | null;
  emDesempate: boolean;
  candidatosDesempate: string[];
  numeroRodada: number;
  cargo: PositionItem;
  faculdade: FacultyItem | null;
}

export interface CourseItem {
  id: string;
  faculdadeId: string;
  nome: string;
}

export interface FacultyItem {
  id: string;
  nome: string;
  cursos: CourseItem[];
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
  faculdade: FacultyItem | null;
  curso: CourseItem | null;
  ano: number | null;
  perfil: 'ELEITOR' | 'CANDIDATO';
  activo: boolean;
}

export interface CandidateUserListResponse {
  items: CandidateUserItem[];
  count: number;
}

export interface CreateElectionInput {
  cargoId: string;
  faculdadeId?: string | null;
  titulo: string;
  descricao?: string | null;
  escopoEleitores?: 'TODOS' | 'FACULDADE';
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
  faculdadeId?: string | null;
  titulo?: string;
  descricao?: string | null;
  estado?: BackendElectionState;
  escopoEleitores?: 'TODOS' | 'FACULDADE';
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
  eleicao: {
    id: string;
    cargoId: string;
    titulo: string;
    estado: BackendElectionState;
    dataInicioCandidatura: string | null;
    dataFimCandidatura: string | null;
    dataInicioVotacao: string | null;
    dataFimVotacao: string | null;
  };
  utilizador: {
    id: string;
    codigo: string;
    nome: string;
    email: string | null;
    faculdade: FacultyItem | null;
    curso: CourseItem | null;
    ano: number | null;
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
  nome?: string;
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
    faculdade: FacultyItem | null;
    curso: CourseItem | null;
    ano: number | null;
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
  preview: Array<{
    codigo: string;
    nome: string;
    email: string | null;
    faculdade: string | null;
  }>;
  skipped: Array<{
    codigo: string;
    reason:
      | 'INVALID_CODE'
      | 'INVALID_EMAIL'
      | 'DUPLICATE_IN_FILE'
      | 'USER_NOT_FOUND'
      | 'ALREADY_REGISTERED'
      | 'ELECTION_NOT_PROGRAMMED'
      | 'FACULTY_MISMATCH'
      | 'USER_WITHOUT_FACULTY';
  }>;
  count: number;
  totalCount: number;
}

export interface FacultyListResponse {
  items: FacultyItem[];
  count: number;
}

export interface TeamMemberItem {
  id: string;
  utilizadorId: string;
  nome: string;
  email: string;
  perfil: 'GESTOR_ELEITORAL' | 'AUDITOR';
  codigo: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberListResponse {
  items: TeamMemberItem[];
  count: number;
}

export interface AuditLogItem {
  id: string;
  accao: string;
  entidade: string | null;
  entidadeId: string | null;
  ip: string | null;
  timestamp: string;
  utilizador: {
    id: string;
    codigo: string;
    nome: string;
    perfil: string;
  } | null;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  count: number;
}
