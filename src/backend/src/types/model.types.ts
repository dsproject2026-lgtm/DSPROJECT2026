import type { EntityId, Nullable, Timestamp } from './common.types.js';

export const PERFIS = ['ADMIN', 'GESTOR_ELEITORAL', 'AUDITOR', 'ELEITOR'] as const;
export type Perfil = (typeof PERFIS)[number];

export const ESTADOS_ELEICAO = [
  'RASCUNHO',
  'CANDIDATURAS_ABERTAS',
  'CANDIDATURAS_ENCERRADAS',
  'VOTACAO_ABERTA',
  'VOTACAO_ENCERRADA',
  'CONCLUIDA',
] as const;
export type EstadoEleicao = (typeof ESTADOS_ELEICAO)[number];

export const ESTADOS_CANDIDATO = ['PENDENTE', 'APROVADO', 'REJEITADO'] as const;
export type EstadoCandidato = (typeof ESTADOS_CANDIDATO)[number];

export interface CargoEntity {
  id: EntityId;
  nome: string;
  descricao: Nullable<string>;
}

export interface EleicaoEntity {
  id: EntityId;
  cargoId: EntityId;
  titulo: string;
  descricao: Nullable<string>;
  estado: EstadoEleicao;
  dataInicioCandidatura: Nullable<Timestamp>;
  dataFimCandidatura: Nullable<Timestamp>;
  dataInicioVotacao: Nullable<Timestamp>;
  dataFimVotacao: Nullable<Timestamp>;
}

export interface UtilizadorEntity {
  id: EntityId;
  codigo: string;
  nome: string;
  senhaHash: string;
  perfil: Perfil;
  activo: boolean;
  createdAt: Timestamp;
}

export type UtilizadorPublico = Omit<UtilizadorEntity, 'senhaHash'>;

export interface CandidatoEntity {
  id: EntityId;
  eleicaoId: EntityId;
  utilizadorId: EntityId;
  registadoPor: Nullable<EntityId>;
  nome: string;
  fotoUrl: Nullable<string>;
  biografia: Nullable<string>;
  proposta: Nullable<string>;
  estado: EstadoCandidato;
}

export interface ElegivelEntity {
  id: EntityId;
  eleicaoId: EntityId;
  utilizadorId: EntityId;
  jaVotou: boolean;
  importadoEm: Timestamp;
}

export interface VotoEntity {
  id: EntityId;
  candidatoId: EntityId;
  tokenAnonimo: string;
  dataHora: Timestamp;
}

export interface ComprovativoEntity {
  id: EntityId;
  utilizadorId: EntityId;
  eleicaoId: EntityId;
  codigoVerificacao: string;
  emitidoEm: Timestamp;
}

export interface LogAuditoriaEntity {
  id: EntityId;
  utilizadorId: Nullable<EntityId>;
  accao: string;
  entidade: Nullable<string>;
  entidadeId: Nullable<EntityId>;
  ip: Nullable<string>;
  timestamp: Timestamp;
}

export interface CargoComRelacoes extends CargoEntity {
  eleicoes: EleicaoEntity[];
}

export interface EleicaoComRelacoes extends EleicaoEntity {
  cargo: CargoEntity;
  candidatos: CandidatoEntity[];
  elegiveis: ElegivelEntity[];
  comprovativos: ComprovativoEntity[];
}

export interface UtilizadorComRelacoes extends UtilizadorPublico {
  elegiveis: ElegivelEntity[];
  comprovativos: ComprovativoEntity[];
  logsAuditoria: LogAuditoriaEntity[];
  candidaturas: CandidatoEntity[];
  candidatosRegistados: CandidatoEntity[];
}

export interface CandidatoComRelacoes extends CandidatoEntity {
  eleicao: EleicaoEntity;
  utilizador: UtilizadorPublico;
  registador: Nullable<UtilizadorPublico>;
  votos: VotoEntity[];
}

export interface ElegivelComRelacoes extends ElegivelEntity {
  eleicao: EleicaoEntity;
  utilizador: UtilizadorPublico;
}

export interface VotoComRelacoes extends VotoEntity {
  candidato: CandidatoEntity;
}

export interface ComprovativoComRelacoes extends ComprovativoEntity {
  utilizador: UtilizadorPublico;
  eleicao: EleicaoEntity;
}

export interface LogAuditoriaComRelacoes extends LogAuditoriaEntity {
  utilizador: Nullable<UtilizadorPublico>;
}

export interface CreateCargoInput {
  nome: string;
  descricao?: Nullable<string>;
}

export type UpdateCargoInput = Partial<CreateCargoInput>;

export interface CreateEleicaoInput {
  cargoId: EntityId;
  titulo: string;
  descricao?: Nullable<string>;
  estado?: EstadoEleicao;
  dataInicioCandidatura?: Nullable<Timestamp>;
  dataFimCandidatura?: Nullable<Timestamp>;
  dataInicioVotacao?: Nullable<Timestamp>;
  dataFimVotacao?: Nullable<Timestamp>;
}

export type UpdateEleicaoInput = Partial<CreateEleicaoInput>;

export interface CreateUtilizadorInput {
  codigo: string;
  nome: string;
  perfil: Perfil;
  activo?: boolean;
}

export interface CreateUtilizadorComSenhaHashInput extends CreateUtilizadorInput {
  senhaHash: string;
}

export interface UpdateUtilizadorInput {
  nome?: string;
  perfil?: Perfil;
  activo?: boolean;
  senhaHash?: string;
}

export interface CreateCandidatoInput {
  eleicaoId: EntityId;
  utilizadorId: EntityId;
  registadoPor?: Nullable<EntityId>;
  nome: string;
  fotoUrl?: Nullable<string>;
  biografia?: Nullable<string>;
  proposta?: Nullable<string>;
  estado?: EstadoCandidato;
}

export interface UpdateCandidatoInput {
  nome?: string;
  fotoUrl?: Nullable<string>;
  biografia?: Nullable<string>;
  proposta?: Nullable<string>;
  estado?: EstadoCandidato;
  registadoPor?: Nullable<EntityId>;
}

export interface CreateElegivelInput {
  eleicaoId: EntityId;
  utilizadorId: EntityId;
  jaVotou?: boolean;
  importadoEm?: Timestamp;
}

export interface UpdateElegivelInput {
  jaVotou?: boolean;
}

export interface CreateVotoInput {
  candidatoId: EntityId;
  tokenAnonimo: string;
  dataHora?: Timestamp;
}

export interface CreateComprovativoInput {
  utilizadorId: EntityId;
  eleicaoId: EntityId;
  codigoVerificacao: string;
  emitidoEm?: Timestamp;
}

export interface CreateLogAuditoriaInput {
  utilizadorId?: Nullable<EntityId>;
  accao: string;
  entidade?: Nullable<string>;
  entidadeId?: Nullable<EntityId>;
  ip?: Nullable<string>;
  timestamp?: Timestamp;
}
