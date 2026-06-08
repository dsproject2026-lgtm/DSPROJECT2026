import type { ElegivelComRelacoes } from './model.types.js';

export type EligibleVoterResponse = ElegivelComRelacoes;

export interface ListEligibleVotersFilters {
  codigo?: string | undefined;
  nome?: string | undefined;
  jaVotou?: boolean | undefined;
}

export interface UpdateEligibleVoterInput {
  nome?: string | undefined;
  email?: string | null | undefined;
  ano?: number | null | undefined;
}

export interface ImportEligibleVotersSkippedItem {
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
}

export interface ImportEligibleVotersResult {
  imported: EligibleVoterResponse[];
  preview: Array<{
    codigo: string;
    nome: string;
    email: string | null;
    faculdade: string | null;
  }>;
  skipped: ImportEligibleVotersSkippedItem[];
  count: number;
  totalCount: number;
}
