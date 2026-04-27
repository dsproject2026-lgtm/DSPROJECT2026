import { electionsRepository } from '../repositories/elections.repository.js';
import type {
  CreateElectionApiInput,
  ListElectionsFilters,
  UpdateElectionApiInput,
} from '../types/eleicoes.types.js';
import { AppError } from '../utils/app-error.js';

const ACTIVE_ELECTION_STATES = new Set(['ABERTA']);

class ElectionsService {
  async createElection(data: CreateElectionApiInput, registadoPor?: string) {
    const cargo = await electionsRepository.findCargoById(data.cargoId);

    if (!cargo) {
      throw new AppError(
        `Cargo com ID ${data.cargoId} não encontrado.`,
        404,
        'ELECTION_CARGO_NOT_FOUND',
        { cargoId: data.cargoId },
      );
    }

    const requestedState = data.estado ?? 'PENDENTE';

    if (ACTIVE_ELECTION_STATES.has(requestedState)) {
      const activeElection = await electionsRepository.findActiveElectionByCargo(data.cargoId);

      if (activeElection) {
        throw new AppError(
          'Já existe uma eleição em andamento para este cargo.',
          409,
          'ELECTION_ACTIVE_CONFLICT',
          {
            cargoId: data.cargoId,
            electionId: activeElection.id,
            estado: activeElection.estado,
          },
        );
      }
    }

    if (data.candidatos && data.candidatos.length > 0) {
      const seen = new Set<string>();
      const duplicatedUserId = data.candidatos.find((candidate) => {
        if (seen.has(candidate.utilizadorId)) return true;
        seen.add(candidate.utilizadorId);
        return false;
      })?.utilizadorId;

      if (duplicatedUserId) {
        throw new AppError(
          'Não é permitido vincular o mesmo utilizador mais de uma vez na mesma eleição.',
          400,
          'ELECTION_CANDIDATE_DUPLICATED_USER',
          { utilizadorId: duplicatedUserId },
        );
      }

      const requestedUserIds = [...seen];
      const users = await electionsRepository.findUsersByIds(requestedUserIds);
      const existingUserIds = new Set(users.map((user) => user.id));
      const missingUserId = requestedUserIds.find((id) => !existingUserIds.has(id));

      if (missingUserId) {
        throw new AppError(
          'Utilizador não encontrado para vincular candidatura.',
          404,
          'USER_NOT_FOUND',
          { utilizadorId: missingUserId },
        );
      }

      const invalidProfileUserId = users.find((user) => user.perfil !== 'CANDIDATO')?.id;
      if (invalidProfileUserId) {
        throw new AppError(
          'Apenas utilizadores com perfil CANDIDATO podem ser vinculados na eleição.',
          400,
          'ELECTION_CANDIDATE_PROFILE_INVALID',
          { utilizadorId: invalidProfileUserId },
        );
      }
    }

    const election = await electionsRepository.create(data, registadoPor);
    await electionsRepository.assignAllActiveElectorsAsEligible(election.id);

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

  async listCandidateUsers(search?: string) {
    const users = await electionsRepository.findCandidateUsers(search);

    return {
      message: 'Candidatos disponíveis listados com sucesso.',
      data: users,
      count: users.length,
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

    const targetCargoId = partialData.cargoId ?? existingElection.cargoId;
    const targetState = partialData.estado ?? existingElection.estado;

    if (ACTIVE_ELECTION_STATES.has(targetState)) {
      const conflictingElection = await electionsRepository.findActiveElectionByCargo(targetCargoId, id);

      if (conflictingElection) {
        throw new AppError(
          'Já existe uma eleição em andamento para este cargo.',
          409,
          'ELECTION_ACTIVE_CONFLICT',
          {
            cargoId: targetCargoId,
            electionId: conflictingElection.id,
            estado: conflictingElection.estado,
          },
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
