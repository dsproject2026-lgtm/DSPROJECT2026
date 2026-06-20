import { electionsRepository } from '../repositories/elections.repository.js';
import { votingRepository } from '../repositories/voting.repository.js';
import { settingsService } from './settings.service.js';
import type {
  CreateElectionApiInput,
  ListElectionsFilters,
  UpdateElectionApiInput,
  ReopenElectionForTieApiInput,
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
      const conflictingElection = await electionsRepository.findActiveElectionByCargo(
        targetCargoId,
        {
          escopoEleitores: targetScope,
          faculdadeId: targetFacultyId,
        },
        id,
      );

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

      const [
        approvedCandidatesCount,
        approvedCandidatesWithoutPhotoCount,
        activeEligibleVotersCount,
      ] = await Promise.all([
        electionsRepository.countApprovedActiveCandidates(id),
        electionsRepository.countApprovedActiveCandidatesWithoutPhoto(id),
        electionsRepository.countActiveEligibleVoters(id),
      ]);

      if (
        approvedCandidatesCount === 0
        || activeEligibleVotersCount === 0
        || approvedCandidatesWithoutPhotoCount > 0
      ) {
        throw new AppError(
          'A eleição não pode ser aberta sem candidatos aprovados com foto e eleitores activos.',
          409,
          'ELECTION_INCOMPLETE',
          {
            id,
            approvedCandidatesCount,
            approvedCandidatesWithoutPhotoCount,
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

  async reopenElectionForTie(id: string, input: ReopenElectionForTieApiInput) {
    const election = await electionsRepository.findById(id);

    if (!election) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { id });
    }

    if (election.estado !== 'CONCLUIDA') {
      throw new AppError(
        'Apenas uma eleição concluída pode ser reaberta para desempate.',
        409,
        'ELECTION_NOT_CLOSED_FOR_TIEBREAK',
        { id, estado: election.estado },
      );
    }

    const dataInicioVotacao = this.parseOptionalDate(
      input.dataInicioVotacao,
      'dataInicioVotacao',
    );
    const dataFimVotacao = this.parseOptionalDate(input.dataFimVotacao, 'dataFimVotacao');

    if (!dataInicioVotacao || !dataFimVotacao || dataInicioVotacao >= dataFimVotacao) {
      throw new AppError(
        'O início da votação deve ser anterior ao fim da votação.',
        400,
        'ELECTION_VOTING_PERIOD_INVALID',
      );
    }

    if (dataFimVotacao <= new Date()) {
      throw new AppError(
        'A nova data de fim da votação deve estar no futuro.',
        400,
        'ELECTION_VOTING_END_MUST_BE_FUTURE',
      );
    }

    const conflictingElection = await electionsRepository.findActiveElectionByCargo(
      election.cargoId,
      {
        escopoEleitores: election.escopoEleitores,
        faculdadeId: election.faculdadeId,
      },
      id,
    );
    if (conflictingElection) {
      throw new AppError(
        'Já existe uma eleição em andamento para este cargo.',
        409,
        'ELECTION_ACTIVE_CONFLICT',
        { cargoId: election.cargoId, electionId: conflictingElection.id },
      );
    }

    const [candidates, votes, totalEligibleVoters] = await Promise.all([
      votingRepository.findAllCandidatesByElection(id),
      votingRepository.findVotesByElection(id, election.numeroRodada),
      votingRepository.countEligibleVotersByElection(id),
    ]);

    const votesByCandidate = votes.reduce<Record<string, number>>((accumulator, vote) => {
      accumulator[vote.candidatoId] = (accumulator[vote.candidatoId] ?? 0) + 1;
      return accumulator;
    }, {});
    const highestVoteCount = candidates.reduce(
      (highest, candidate) => Math.max(highest, votesByCandidate[candidate.id] ?? 0),
      0,
    );
    const tiedCandidateIds = candidates
      .filter((candidate) => (votesByCandidate[candidate.id] ?? 0) === highestVoteCount)
      .map((candidate) => candidate.id);

    if (highestVoteCount === 0 || tiedCandidateIds.length < 2) {
      throw new AppError(
        'A eleição não possui empate no primeiro lugar.',
        409,
        'ELECTION_HAS_NO_TIE',
        { id },
      );
    }

    const turnoutPercentage =
      totalEligibleVoters === 0 ? 0 : (votes.length / totalEligibleVoters) * 100;
    const resetAllVoters = turnoutPercentage >= 100;

    const reopenedElection = await electionsRepository.reopenForTie({
      electionId: id,
      dataInicioVotacao,
      dataFimVotacao,
      tiedCandidateIds,
      resetAllVoters,
    });

    return {
      message: resetAllVoters
        ? 'Eleição reaberta para desempate. Todos os eleitores podem votar novamente.'
        : 'Eleição reaberta para desempate. Os eleitores que ainda não votaram podem participar.',
      data: {
        election: reopenedElection,
        tiedCandidateIds,
        previousTurnoutPercentage: Number(turnoutPercentage.toFixed(2)),
        votersReset: resetAllVoters,
      },
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
