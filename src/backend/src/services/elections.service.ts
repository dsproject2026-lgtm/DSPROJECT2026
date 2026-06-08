import { electionsRepository } from '../repositories/elections.repository.js';
import { settingsService } from './settings.service.js';
import type {
  CreateElectionApiInput,
  ListElectionsFilters,
  UpdateElectionApiInput,
} from '../types/eleicoes.types.js';
import { AppError } from '../utils/app-error.js';

const ACTIVE_ELECTION_STATES = new Set(['ABERTA']);

class ElectionsService {
  async syncElectionStates() {
    const { settings } = await settingsService.getSystemSettings();

    if (!settings.autoCloseElection) {
      return 0;
    }

    return electionsRepository.syncElectionStates();
  }

  async createElection(data: CreateElectionApiInput, registadoPor?: string) {
    const cargo = await electionsRepository.findCargoById(data.cargoId);

    if (!cargo) {
      throw new AppError(`Cargo com ID ${data.cargoId} nao encontrado.`, 404, 'ELECTION_CARGO_NOT_FOUND', {
        cargoId: data.cargoId,
      });
    }

    await this.validateVotingScope(data.escopoEleitores ?? 'TODOS', data.faculdadeId ?? null);
    this.validateElectionDates(data);

    const election = await electionsRepository.create(data, registadoPor);
    await electionsRepository.assignEligibleElectorsForElection(election.id, {
      escopoEleitores: data.escopoEleitores ?? 'TODOS',
      faculdadeId: data.faculdadeId ?? null,
    });

    return {
      message: 'Eleição criada com sucesso.',
      data: election,
    };
  }

  async getElectionById(id: string) {
    await this.syncElectionStates();

    const election = await electionsRepository.findById(id);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    return {
      message: 'Eleicao encontrada com sucesso.',
      data: election,
    };
  }

  async listElections(filters?: ListElectionsFilters) {
    await this.syncElectionStates();

    const elections = await electionsRepository.findAll(filters);

    return {
      message: 'Eleicoes listadas com sucesso.',
      data: elections,
      count: elections.length,
    };
  }

  async listCandidateUsers(search?: string, electionId?: string) {
    const users = electionId
      ? await electionsRepository.findEligibleCandidateUsers(electionId, search)
      : await electionsRepository.findCandidateUsers(search);

    return {
      message: 'Candidatos disponiveis listados com sucesso.',
      data: users,
      count: users.length,
    };
  }

  async updateElection(id: string, partialData: UpdateElectionApiInput) {
    const existingElection = await electionsRepository.findById(id);

    if (!existingElection) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    const isOnlyStateChange = Object.keys(partialData).every((key) => key === 'estado');
    if (existingElection.estado === 'ABERTA' && !isOnlyStateChange) {
      throw new AppError(
        'Eleicoes abertas nao podem ser editadas. Apenas consulta e resultados ficam disponiveis.',
        409,
        'ELECTION_OPEN_READ_ONLY',
        { id },
      );
    }

    if (partialData.cargoId && partialData.cargoId !== existingElection.cargoId) {
      const cargo = await electionsRepository.findCargoById(partialData.cargoId);

      if (!cargo) {
        throw new AppError(
          `Cargo com ID ${partialData.cargoId} nao encontrado.`,
          404,
          'ELECTION_CARGO_NOT_FOUND',
          { cargoId: partialData.cargoId },
        );
      }
    }

    const targetScope = partialData.escopoEleitores ?? existingElection.escopoEleitores;
    const targetFacultyId =
      partialData.faculdadeId !== undefined ? partialData.faculdadeId : existingElection.faculdadeId;
    await this.validateVotingScope(targetScope, targetFacultyId);
    this.validateElectionDates({
      dataInicioCandidatura:
        partialData.dataInicioCandidatura !== undefined
          ? partialData.dataInicioCandidatura
          : existingElection.dataInicioCandidatura?.toISOString(),
      dataFimCandidatura:
        partialData.dataFimCandidatura !== undefined
          ? partialData.dataFimCandidatura
          : existingElection.dataFimCandidatura?.toISOString(),
      dataInicioVotacao:
        partialData.dataInicioVotacao !== undefined
          ? partialData.dataInicioVotacao
          : existingElection.dataInicioVotacao?.toISOString(),
      dataFimVotacao:
        partialData.dataFimVotacao !== undefined
          ? partialData.dataFimVotacao
          : existingElection.dataFimVotacao?.toISOString(),
    });

    const targetCargoId = partialData.cargoId ?? existingElection.cargoId;
    const targetState = partialData.estado ?? existingElection.estado;

    if (ACTIVE_ELECTION_STATES.has(targetState)) {
      const conflictingElection = await electionsRepository.findActiveElectionByCargo(targetCargoId, id);

      if (conflictingElection) {
        throw new AppError(
          'Ja existe uma eleicao em andamento para este cargo.',
          409,
          'ELECTION_ACTIVE_CONFLICT',
          {
            cargoId: targetCargoId,
            electionId: conflictingElection.id,
            estado: conflictingElection.estado,
          },
        );
      }

      const [approvedCandidatesCount, activeEligibleVotersCount] = await Promise.all([
        electionsRepository.countApprovedActiveCandidates(id),
        electionsRepository.countActiveEligibleVoters(id),
      ]);

      if (approvedCandidatesCount === 0 || activeEligibleVotersCount === 0) {
        throw new AppError(
          'A eleição não pode ser aberta sem candidatos aprovados e eleitores activos.',
          409,
          'ELECTION_INCOMPLETE',
          {
            id,
            approvedCandidatesCount,
            activeEligibleVotersCount,
          },
        );
      }
    }

    const updatedElection = await electionsRepository.update(id, partialData);

    return {
      message: 'Eleicao atualizada com sucesso.',
      data: updatedElection,
    };
  }

  async deleteElection(id: string) {
    const existingElection = await electionsRepository.findById(id);

    if (!existingElection) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    if (existingElection.estado === 'ABERTA') {
      throw new AppError(
        'Eleicoes abertas nao podem ser eliminadas.',
        409,
        'ELECTION_OPEN_READ_ONLY',
        { id },
      );
    }

    await electionsRepository.delete(id);

    return {
      message: 'Eleicao eliminada com sucesso.',
      data: { id, deleted: true },
    };
  }

  private async validateVotingScope(escopoEleitores: string, faculdadeId: string | null) {
    if (escopoEleitores === 'FACULDADE' && !faculdadeId) {
      throw new AppError(
        'Selecione uma faculdade para eleicoes restritas a uma faculdade.',
        400,
        'ELECTION_FACULTY_REQUIRED',
      );
    }

    if (escopoEleitores === 'TODOS' && faculdadeId) {
      throw new AppError(
        'Eleicoes abertas a todos nao devem ter faculdade selecionada.',
        400,
        'ELECTION_FACULTY_NOT_ALLOWED',
      );
    }

    if (faculdadeId) {
      const faculdade = await electionsRepository.findFaculdadeById(faculdadeId);
      if (!faculdade) {
        throw new AppError('Faculdade nao encontrada.', 404, 'FACULTY_NOT_FOUND', { faculdadeId });
      }
    }
  }

  private validateElectionDates(data: Pick<
    CreateElectionApiInput,
    | 'dataInicioCandidatura'
    | 'dataFimCandidatura'
    | 'dataInicioVotacao'
    | 'dataFimVotacao'
  >) {
    const candidaturaInicio = this.parseOptionalDate(data.dataInicioCandidatura, 'dataInicioCandidatura');
    const candidaturaFim = this.parseOptionalDate(data.dataFimCandidatura, 'dataFimCandidatura');
    const votacaoInicio = this.parseOptionalDate(data.dataInicioVotacao, 'dataInicioVotacao');
    const votacaoFim = this.parseOptionalDate(data.dataFimVotacao, 'dataFimVotacao');

    if (!votacaoInicio || !votacaoFim) {
      throw new AppError(
        'Informe o inicio e o fim da votacao.',
        400,
        'ELECTION_VOTING_PERIOD_REQUIRED',
      );
    }

    if (candidaturaInicio && candidaturaFim && candidaturaInicio >= candidaturaFim) {
      throw new AppError(
        'O inicio da candidatura deve ser anterior ao fim da candidatura.',
        400,
        'ELECTION_CANDIDACY_PERIOD_INVALID',
      );
    }

    if (votacaoInicio >= votacaoFim) {
      throw new AppError(
        'O inicio da votacao deve ser anterior ao fim da votacao.',
        400,
        'ELECTION_VOTING_PERIOD_INVALID',
      );
    }

    if (candidaturaFim && candidaturaFim > votacaoInicio) {
      throw new AppError(
        'O periodo de candidatura deve terminar antes do inicio da votacao.',
        400,
        'ELECTION_CANDIDACY_OVERLAPS_VOTING',
      );
    }
  }

  private parseOptionalDate(value: string | null | undefined, field: string) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`O campo ${field} deve conter uma data valida.`, 400, 'ELECTION_DATE_INVALID', {
        field,
      });
    }

    return date;
  }
}

export const electionsService = new ElectionsService();
