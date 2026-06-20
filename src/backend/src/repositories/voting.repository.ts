import { prisma } from '../lib/prisma.js';
import { generateSecureToken } from '../utils/secure-token.js';

class VotingRepository {
  async findElectionById(electionId: string) {
    return prisma.eleicao.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        titulo: true,
        estado: true,
        dataInicioVotacao: true,
        dataFimVotacao: true,
        emDesempate: true,
        candidatosDesempate: true,
        numeroRodada: true,
      },
    });
  }

  async findEligibleVoter(electionId: string, userId: string) {
    return prisma.elegivel.findFirst({
      where: {
        eleicaoId: electionId,
        utilizadorId: userId,
      },
      select: {
        id: true,
        eleicaoId: true,
        utilizadorId: true,
        jaVotou: true,
        utilizador: {
          select: {
            activo: true,
          },
        },
      },
    });
  }

  async findUserById(userId: string) {
    return prisma.utilizador.findUnique({
      where: { id: userId },
      select: {
        id: true,
        perfil: true,
        activo: true,
      },
    });
  }

  async findApprovedCandidatesByElection(electionId: string, candidateIds?: string[]) {
    return prisma.candidato.findMany({
      where: {
        eleicaoId: electionId,
        ...(candidateIds && candidateIds.length > 0 ? { id: { in: candidateIds } } : {}),
        estado: 'APROVADO',
        utilizador: {
          activo: true,
        },
      },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        biografia: true,
        proposta: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findCandidateByIdForElection(candidatoId: string, electionId: string) {
    return prisma.candidato.findFirst({
      where: {
        id: candidatoId,
        eleicaoId: electionId,
      },
      select: {
        id: true,
        estado: true,
        utilizador: {
          select: {
            activo: true,
          },
        },
      },
    });
  }

  async castVote(params: {
    electionId: string;
    userId: string;
    eligibleId: string;
    candidateId: string;
    numeroRodada: number;
  }) {
    const receiptCode = `RCPT-${generateSecureToken().slice(0, 16).toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      const vote = await tx.voto.create({
        data: {
          candidatoId: params.candidateId,
          tokenAnonimo: generateSecureToken(),
          numeroRodada: params.numeroRodada,
        },
        select: {
          id: true,
          candidatoId: true,
          dataHora: true,
        },
      });

      await tx.elegivel.update({
        where: { id: params.eligibleId },
        data: { jaVotou: true },
      });

      const receipt = await tx.comprovativo.create({
        data: {
          utilizadorId: params.userId,
          eleicaoId: params.electionId,
          codigoVerificacao: receiptCode,
          numeroRodada: params.numeroRodada,
        },
        select: {
          codigoVerificacao: true,
          emitidoEm: true,
        },
      });

      return {
        vote,
        receipt,
      };
    });
  }

  async findReceiptByElectionAndUser(electionId: string, userId: string, numeroRodada: number) {
    return prisma.comprovativo.findFirst({
      where: {
        eleicaoId: electionId,
        utilizadorId: userId,
        numeroRodada,
      },
      select: {
        codigoVerificacao: true,
        emitidoEm: true,
      },
      orderBy: {
        emitidoEm: 'desc',
      },
    });
  }

  async findAllCandidatesByElection(electionId: string) {
    return prisma.candidato.findMany({
      where: {
        eleicaoId: electionId,
      },
      select: {
        id: true,
        nome: true,
        estado: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findVotesByElection(electionId: string, numeroRodada: number) {
    return prisma.voto.findMany({
      where: {
        candidato: {
          eleicaoId: electionId,
        },
        numeroRodada,
      },
      select: {
        candidatoId: true,
      },
    });
  }

  async countEligibleVotersByElection(electionId: string) {
    return prisma.elegivel.count({
      where: {
        eleicaoId: electionId,
        utilizador: {
          activo: true,
        },
      },
    });
  }
}

export const votingRepository = new VotingRepository();
