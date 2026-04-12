import { electionsRepository } from '../repositories/elections.repository.js';
import type {
  CreateElectionApiInput,
  ListElectionsFilters,
  UpdateElectionApiInput,
} from '../types/eleicoes.types.js';
import { AppError } from '../utils/app-error.js';

class ElectionsService {
  async createElection(data: CreateElectionApiInput) {
    const cargo = await electionsRepository.findCargoById(data.cargoId);

    if (!cargo) {
      throw new AppError(
        `Cargo com ID ${data.cargoId} não encontrado.`,
        404,
        'ELECTION_CARGO_NOT_FOUND',
        { cargoId: data.cargoId },
      );
    }

    const election = await electionsRepository.create(data);

    return {
      message: 'Eleição criada com sucesso.',
      data: election,
    };
  }

  async getElectionById(id: string) {
    const election = await electionsRepository.findById(id);

    if (!election) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    return {
      message: 'Eleição encontrada com sucesso.',
      data: election,
    };
  }

  async listElections(filters?: ListElectionsFilters) {
    const elections = await electionsRepository.findAll(filters);

    return {
      message: 'Eleições listadas com sucesso.',
      data: elections,
      count: elections.length,
    };
  }

  async updateElection(id: string, partialData: UpdateElectionApiInput) {
    const existingElection = await electionsRepository.findById(id);

    if (!existingElection) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    if (partialData.cargoId && partialData.cargoId !== existingElection.cargoId) {
      const cargo = await electionsRepository.findCargoById(partialData.cargoId);

      if (!cargo) {
        throw new AppError(
          `Cargo com ID ${partialData.cargoId} não encontrado.`,
          404,
          'ELECTION_CARGO_NOT_FOUND',
          { cargoId: partialData.cargoId },
        );
      }
    }

    const updatedElection = await electionsRepository.update(id, partialData);

    return {
      message: 'Eleição atualizada com sucesso.',
      data: updatedElection,
    };
  }

  async deleteElection(id: string) {
    const existingElection = await electionsRepository.findById(id);

    if (!existingElection) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    if (existingElection.candidatos.length > 0) {
      throw new AppError(
        'Não é possível eliminar uma eleição que já tem candidatos registados.',
        400,
        'ELECTION_HAS_CANDIDATOS',
        { id },
      );
    }

    if (existingElection.elegiveis.length > 0) {
      throw new AppError(
        'Não é possível eliminar uma eleição que já tem eleitores elegíveis registados.',
        400,
        'ELECTION_HAS_ELEIGIVEIS',
        { id },
      );
    }

    await electionsRepository.delete(id);

    return {
      message: 'Eleição eliminada com sucesso.',
      data: { id, deleted: true },
    };
  }
}

export const electionsService = new ElectionsService();