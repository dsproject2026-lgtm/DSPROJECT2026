import type {
  EstadoCandidato,
  EstadoEleicao,
  EleicaoComRelacoes,
  UpdateEleicaoInput,
} from './model.types.js';

export interface CreateElectionCandidateApiInput {
  utilizadorId: string;
  nome: string;
  fotoUrl?: string | null | undefined;
  biografia?: string | null | undefined;
  proposta?: string | null | undefined;
  estado?: EstadoCandidato | undefined;
}

export interface CreateElectionApiInput {
  cargoId: string;
  titulo: string;
  descricao?: string | null | undefined;
  estado?: EstadoEleicao | undefined;
  dataInicioCandidatura?: string | null | undefined; // ISO 8601 datetime
  dataFimCandidatura?: string | null | undefined;
  dataInicioVotacao?: string | null | undefined;
  dataFimVotacao?: string | null | undefined;
  candidatos?: CreateElectionCandidateApiInput[] | undefined;
}

export interface UpdateElectionApiInput {
  cargoId?: string | undefined;
  titulo?: string | undefined;
  descricao?: string | null | undefined;
  estado?: EstadoEleicao | undefined;
  dataInicioCandidatura?: string | null | undefined;
  dataFimCandidatura?: string | null | undefined;
  dataInicioVotacao?: string | null | undefined;
  dataFimVotacao?: string | null | undefined;
}


// OUTPUTS

export type ElectionResponse = EleicaoComRelacoes;

export interface ListElectionsFilters {
  estado?: EstadoEleicao | undefined;
  cargoId?: string | undefined;
}
