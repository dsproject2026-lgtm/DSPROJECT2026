import e from 'express';
import type  {EntityId, Nullable} from './common.types.js';
import type {CargoComRelacoes,CargoEntity,CreateCargoInput,UpdateCargoInput} from './model.types.js';

export interface CreatePositionApiInput {
    nome: string;
    descricao?: string | null | undefined;   
}
 export interface UpdatePositionApiInput {
    nome?: string | undefined;
    descricao?: string | null | undefined;   
}

// OUTPUTS

export type PositionResponse = CargoComRelacoes;

export interface ListPositionsFilters {
    nome?: string | undefined;
}   