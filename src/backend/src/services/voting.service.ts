import { votingRepository } from '../repositories/voting.repository.js';
import { electionsService } from './elections.service.js';
import { settingsService } from './settings.service.js';
import { sseService } from '../sse/sse.service.js';
import type {
  CastVoteInput,
  CastVoteResponse,
  ElectionBallotResponse,
  ElectionResultsResponse,
  VoteStatusResponse,
} from '../types/voting.types.js';
import { AppError } from '../utils/app-error.js';

class VotingService {
  private async resolveEligibleVoter(electionId: string, userId: string) {
    const eligibleVoter = await votingRepository.findEligibleVoter(electionId, userId);

    if (!eligibleVoter) {
      throw new AppError(
        'Utilizador não elegível para votar nesta eleição.',
        403,
        'VOTER_NOT_ELIGIBLE',
        { electionId, userId },
      );
    }

    if (!eligibleVoter.utilizador.activo) {
      throw new AppError(
        'Utilizador suspenso não pode votar nesta eleição.',
        403,
        'VOTER_SUSPENDED',
        { electionId, userId },
      );
    }

    return eligibleVoter;
  }

  async getBallot(electionId: string, userId: string) {
    const election = await votingRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    if (election.estado !== 'ABERTA') {
      throw new AppError(
        'A votacao desta eleicao nao esta aberta.',
        409,
        'ELECTION_VOTING_NOT_OPEN',
        { electionId, estado: election.estado },
      );
    }

    await this.resolveEligibleVoter(electionId, userId);

    const candidates = await votingRepository.findApprovedCandidatesByElection(
      electionId,
      election.emDesempate ? election.candidatosDesempate : undefined,
    );

    const data: ElectionBallotResponse = {
      election: {
        id: election.id,
        titulo: election.titulo,
        estado: election.estado,
        dataInicioVotacao: election.dataInicioVotacao,
        dataFimVotacao: election.dataFimVotacao,
        emDesempate: election.emDesempate,
        numeroRodada: election.numeroRodada,
      },
      candidates,
    };

    return {
      message: 'Boletim de voto carregado com sucesso.',
      data,
    };
  }

  async castVote(electionId: string, userId: string, input: CastVoteInput) {
    const election = await votingRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    if (election.estado !== 'ABERTA') {
      throw new AppError(
        'A votacao desta eleicao nao esta aberta.',
        409,
        'ELECTION_VOTING_NOT_OPEN',
        { electionId, estado: election.estado },
      );
    }

    const eligibleVoter = await this.resolveEligibleVoter(electionId, userId);

    if (eligibleVoter.jaVotou) {
      throw new AppError(
        'Este utilizador ja votou nesta eleicao.',
        409,
        'VOTER_ALREADY_VOTED',
        { electionId, userId },
      );
    }

    const candidate = await votingRepository.findCandidateByIdForElection(input.candidatoId, electionId);

    if (!candidate) {
      throw new AppError(
        'Candidato nao encontrado nesta eleicao.',
        404,
        'VOTE_CANDIDATE_NOT_FOUND',
        { electionId, candidatoId: input.candidatoId },
      );
    }

    if (candidate.estado !== 'APROVADO') {
      throw new AppError(
        'Só é permitido votar em candidatos aprovados.',
        409,
        'VOTE_CANDIDATE_NOT_APPROVED',
        { electionId, candidatoId: input.candidatoId, estado: candidate.estado },
      );
    }

    if (
      election.emDesempate
      && !election.candidatosDesempate.includes(input.candidatoId)
    ) {
      throw new AppError(
        'Na votação de desempate só é permitido votar nos candidatos empatados.',
        409,
        'VOTE_CANDIDATE_NOT_IN_TIEBREAK',
        { electionId, candidatoId: input.candidatoId },
      );
    }

    if (!candidate.utilizador.activo) {
      throw new AppError(
        'Candidato suspenso não pode receber votos.',
        409,
        'VOTE_CANDIDATE_SUSPENDED',
        { electionId, candidatoId: input.candidatoId },
      );
    }

    const result = await votingRepository.castVote({
      electionId,
      userId,
      eligibleId: eligibleVoter.id,
      candidateId: input.candidatoId,
      numeroRodada: election.numeroRodada,
    });

    const data: CastVoteResponse = {
      receiptCode: result.receipt.codigoVerificacao,
      votedAt: result.vote.dataHora,
      electionId,
      candidateId: result.vote.candidatoId,
    };

    sseService.broadcast('vote_cast', {
      electionId,
      candidateId: result.vote.candidatoId,
      votedAt: result.vote.dataHora,
      receiptCode: result.receipt.codigoVerificacao,
    });

    return {
      message: 'Voto registado com sucesso.',
      data,
    };
  }

  async getMyVoteStatus(electionId: string, userId: string) {
    const election = await votingRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const eligibleVoter = await votingRepository.findEligibleVoter(electionId, userId);

    if (!eligibleVoter) {
      const data: VoteStatusResponse = {
        electionId,
        isEligible: false,
        hasVoted: false,
        votedAt: null,
        receiptCode: null,
      };

      return {
        message: 'Estado de voto carregado com sucesso.',
        data,
      };
    }

    const receipt = await votingRepository.findReceiptByElectionAndUser(
      electionId,
      userId,
      election.numeroRodada,
    );

    const data: VoteStatusResponse = {
      electionId,
      isEligible: true,
      hasVoted: eligibleVoter.jaVotou,
      votedAt: receipt?.emitidoEm ?? null,
      receiptCode: receipt?.codigoVerificacao ?? null,
    };

    return {
      message: 'Estado de voto carregado com sucesso.',
      data,
    };
  }

  async getElectionResults(electionId: string) {
    await electionsService.syncElectionStates();

    const election = await votingRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const { settings } = await settingsService.getSystemSettings();

    if (!settings.allowImmediateResults && election.estado !== 'CONCLUIDA') {
      throw new AppError(
        'Os resultados desta eleicao ainda nao estao disponiveis.',
        409,
        'ELECTION_RESULTS_NOT_AVAILABLE',
        { electionId, estado: election.estado },
      );
    }

    const [candidates, votes, totalEligibleVoters] = await Promise.all([
      votingRepository.findAllCandidatesByElection(electionId),
      votingRepository.findVotesByElection(electionId, election.numeroRodada),
      votingRepository.countEligibleVotersByElection(electionId),
    ]);

    const votesByCandidate = votes.reduce<Record<string, number>>((accumulator, vote) => {
      accumulator[vote.candidatoId] = (accumulator[vote.candidatoId] ?? 0) + 1;
      return accumulator;
    }, {});

    const totalVotes = votes.length;

    const candidateResults = candidates
      .map((candidate) => {
        const candidateVotes = votesByCandidate[candidate.id] ?? 0;
        const percentage = totalVotes === 0 ? 0 : Number(((candidateVotes / totalVotes) * 100).toFixed(2));

        return {
          id: candidate.id,
          nome: candidate.nome,
          estado: candidate.estado,
          votes: candidateVotes,
          percentage,
        };
      })
      .sort((candidateA, candidateB) => {
        if (candidateB.votes !== candidateA.votes) {
          return candidateB.votes - candidateA.votes;
        }

        return candidateA.nome.localeCompare(candidateB.nome);
      });

    const topCandidate = candidateResults[0] ?? null;
    const hasTieForFirstPlace =
      topCandidate !== null
      && candidateResults.filter((candidate) => candidate.votes === topCandidate.votes).length > 1;

    const winner =
      !topCandidate || topCandidate.votes === 0 || hasTieForFirstPlace
        ? null
        : {
            candidateId: topCandidate.id,
            nome: topCandidate.nome,
            votes: topCandidate.votes,
          };

    const turnoutPercentage =
      totalEligibleVoters === 0 ? 0 : Number(((totalVotes / totalEligibleVoters) * 100).toFixed(2));

    const data: ElectionResultsResponse = {
      election: {
        id: election.id,
        titulo: election.titulo,
        estado: election.estado,
        emDesempate: election.emDesempate,
        numeroRodada: election.numeroRodada,
      },
      summary: {
        totalEligibleVoters,
        totalVotes,
        turnoutPercentage,
      },
      candidates: candidateResults,
      winner,
      hasTieForFirstPlace,
      tiedCandidates: hasTieForFirstPlace && topCandidate
        ? candidateResults
            .filter((candidate) => candidate.votes === topCandidate.votes)
            .map(({ id, nome, votes }) => ({ id, nome, votes }))
        : [],
    };

    return {
      message: 'Resultados da eleicao carregados com sucesso.',
      data,
    };
  }
}

export const votingService = new VotingService();
