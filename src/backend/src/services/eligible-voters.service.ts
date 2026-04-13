import { eligibleVotersRepository } from '../repositories/eligible-voters.repository.js';
import type {
  EligibleVoterResponse,
  ImportEligibleVotersResult,
  ListEligibleVotersFilters,
} from '../types/eligible-voters.types.js';
import { AppError } from '../utils/app-error.js';

class EligibleVotersService {
  async listEligibleVoters(electionId: string, filters?: ListEligibleVotersFilters) {
    const election = await eligibleVotersRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const eligibleVoters = await eligibleVotersRepository.findAllByElection(electionId, filters);

    return {
      message: 'Eleitores elegíveis listados com sucesso.',
      data: eligibleVoters,
      count: eligibleVoters.length,
    };
  }

  async importEligibleVoters(electionId: string, csvContent: string): Promise<{
    message: string;
    data: ImportEligibleVotersResult;
  }> {
    const election = await eligibleVotersRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const codes = this.parseCsvCodes(csvContent);

    if (codes.length === 0) {
      throw new AppError(
        'O ficheiro CSV não contém códigos válidos.',
        400,
        'ELEGIVEIS_CSV_EMPTY',
      );
    }

    const imported: EligibleVoterResponse[] = [];
    const skipped: ImportEligibleVotersResult['skipped'] = [];

    for (const rawCode of codes) {
      const codigo = rawCode.trim();

      if (!codigo) {
        skipped.push({ codigo: rawCode, reason: 'INVALID_CODE' });
        continue;
      }

      const user = await eligibleVotersRepository.findUserByCodigo(codigo);

      if (!user) {
        skipped.push({ codigo, reason: 'USER_NOT_FOUND' });
        continue;
      }

      const existingEligibleVoter = await eligibleVotersRepository.findByElectionAndUser(
        electionId,
        user.id,
      );

      if (existingEligibleVoter) {
        skipped.push({ codigo, reason: 'ALREADY_REGISTERED' });
        continue;
      }

      const createdEligibleVoter = await eligibleVotersRepository.create(electionId, user.id);
      imported.push(createdEligibleVoter);
    }

    const result: ImportEligibleVotersResult = {
      imported,
      skipped,
      count: imported.length,
      totalCount: codes.length,
    };

    return {
      message: 'Eleitores elegíveis importados com sucesso.',
      data: result,
    };
  }

  private parseCsvCodes(csvContent: string) {
    const normalizedContent = csvContent.replace(/\r\n/g, '\n').trim();

    if (!normalizedContent) {
      return [] as string[];
    }

    const rows = normalizedContent
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      return [] as string[];
    }

    const [firstRow, ...otherRows] = rows;

    if (!firstRow) {
      return [] as string[];
    }

    const dataRows = firstRow.toLowerCase() === 'codigo' ? otherRows : rows;

    return dataRows
      .map((row) => row.split(/[;,\t]/)[0]?.trim().replace(/^"|"$/g, ''))
      .filter((codigo): codigo is string => Boolean(codigo));
  }
}

export const eligibleVotersService = new EligibleVotersService();