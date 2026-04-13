import type { CandidatoComRelacoes, EstadoCandidato } from './model.types.js';

export interface CreateCandidateApiInput {
    utilizadorId: string;
    nome: string;
    fotoUrl?: string | null | undefined;
    biografia?: string | null | undefined;
    proposta?: string | null | undefined;
    estado?: EstadoCandidato | undefined;
}

export interface UpdateCandidateApiInput {
    utilizadorId?: string | undefined;
    nome?: string | undefined;
    fotoUrl?: string | null | undefined;
    biografia?: string | null | undefined;
    proposta?: string | null | undefined;
    estado?: EstadoCandidato | undefined;
}

export interface ListCandidatesFilters {
    estado?: EstadoCandidato | undefined;
    nome?: string | undefined;
    utilizadorId?: string | undefined;
}

export type CandidateResponse = Omit<CandidatoComRelacoes, 'registadoPor' | 'registador'>;
