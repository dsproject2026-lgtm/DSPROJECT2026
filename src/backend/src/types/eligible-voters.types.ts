import type { ElegivelComRelacoes } from './model.types.js';

export type EligibleVoterResponse = ElegivelComRelacoes;

export interface ListEligibleVotersFilters {
  codigo?: string | undefined;
  nome?: string | undefined;
  jaVotou?: boolean | undefined;
}

export interface ImportEligibleVotersSkippedItem {
  codigo: string;
  reason: 'INVALID_CODE' | 'USER_NOT_FOUND' | 'ALREADY_REGISTERED';
}

export interface ImportEligibleVotersResult {
  imported: EligibleVoterResponse[];
  skipped: ImportEligibleVotersSkippedItem[];
  count: number;
  totalCount: number;
}