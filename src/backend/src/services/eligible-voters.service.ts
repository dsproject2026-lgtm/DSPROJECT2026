import { eligibleVotersRepository } from '../repositories/eligible-voters.repository.js';
import { authService } from './auth.service.js';
import type {
  EligibleVoterResponse,
  ImportEligibleVotersResult,
  ListEligibleVotersFilters,
} from '../types/eligible-voters.types.js';
import { AppError } from '../utils/app-error.js';

type CsvVoterRow = {
  codigo: string;
  nome?: string;
  email?: string;
  faculdade?: string;
  ano?: string;
};

class EligibleVotersService {
  async listEligibleVoters(electionId: string, filters?: ListEligibleVotersFilters) {
    const election = await eligibleVotersRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const eligibleVoters = await eligibleVotersRepository.findAllByElection(electionId, filters);

    return {
      message: 'Eleitores elegiveis listados com sucesso.',
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
      throw new AppError('Eleicao nao encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    if (election.estado !== 'PROGRAMADA') {
      throw new AppError(
        'Eleitores so podem ser importados quando a eleicao esta programada.',
        409,
        'ELECTION_NOT_PROGRAMMED',
        { electionId, estado: election.estado },
      );
    }

    const rows = this.parseCsvRows(csvContent);

    if (rows.length === 0) {
      throw new AppError('O ficheiro CSV nao contem codigos validos.', 400, 'ELEGIVEIS_CSV_EMPTY');
    }

    const imported: EligibleVoterResponse[] = [];
    const skipped: ImportEligibleVotersResult['skipped'] = [];

    for (const row of rows) {
      const codigo = row.codigo.trim();

      if (!codigo) {
        skipped.push({ codigo: row.codigo, reason: 'INVALID_CODE' });
        continue;
      }

      let user = await eligibleVotersRepository.findUserByCodigo(codigo);

      if (!user) {
        if (!row.nome || !row.email) {
          skipped.push({ codigo, reason: 'USER_NOT_FOUND' });
          continue;
        }

        if (election.escopoEleitores === 'FACULDADE' && !election.faculdadeId) {
          skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
          continue;
        }

        const createdUser = await authService.createUser({
          codigo,
          nome: row.nome,
          email: row.email,
          perfil: 'ELEITOR',
          activo: true,
          mustSetPassword: true,
          ...(election.escopoEleitores === 'FACULDADE' ? { faculdadeId: election.faculdadeId } : {}),
          ...(row.ano && Number.isInteger(Number(row.ano)) ? { ano: Number(row.ano) } : {}),
        });

        await authService.startFirstAccess({ codigo });
        user = await eligibleVotersRepository.findUserByCodigo(createdUser.codigo);

        if (!user) {
          skipped.push({ codigo, reason: 'USER_NOT_FOUND' });
          continue;
        }
      }

      if (election.escopoEleitores === 'FACULDADE') {
        if (!user.faculdadeId) {
          skipped.push({ codigo, reason: 'USER_WITHOUT_FACULTY' });
          continue;
        }

        if (user.faculdadeId !== election.faculdadeId) {
          skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
          continue;
        }
      }

      if (row.faculdade && user.faculdade?.nome) {
        const csvFaculty = this.normalizeName(row.faculdade);
        const userFaculty = this.normalizeName(user.faculdade.nome);
        if (csvFaculty !== userFaculty) {
          skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
          continue;
        }
      }

      const existingEligibleVoter = await eligibleVotersRepository.findByElectionAndUser(electionId, user.id);

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
      totalCount: rows.length,
    };

    return {
      message: 'Eleitores elegiveis importados com sucesso.',
      data: result,
    };
  }

  private parseCsvRows(csvContent: string): CsvVoterRow[] {
    const normalizedContent = csvContent.replace(/\r\n/g, '\n').trim();

    if (!normalizedContent) {
      return [];
    }

    const rows = normalizedContent
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    if (rows.length === 0) {
      return [];
    }

    const separator = rows[0]?.includes(';') ? ';' : rows[0]?.includes('\t') ? '\t' : ',';
    const firstColumns = this.splitCsvLine(rows[0] ?? '', separator);
    const normalizedHeaders = firstColumns.map((column) => this.normalizeName(column));
    const hasHeader = normalizedHeaders.includes('codigo');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    const codigoIndex = hasHeader ? normalizedHeaders.indexOf('codigo') : 0;
    const faculdadeIndex = hasHeader ? normalizedHeaders.indexOf('faculdade') : -1;
    const nomeIndex = hasHeader ? normalizedHeaders.indexOf('nome') : -1;
    const emailIndex = hasHeader ? normalizedHeaders.indexOf('email') : -1;
    const anoIndex = hasHeader ? normalizedHeaders.indexOf('ano') : -1;

    return dataRows
      .map((row) => {
        const columns = this.splitCsvLine(row, separator);
        return {
          codigo: columns[codigoIndex]?.trim() ?? '',
          ...(nomeIndex >= 0 ? { nome: columns[nomeIndex]?.trim() ?? '' } : {}),
          ...(emailIndex >= 0 ? { email: columns[emailIndex]?.trim() ?? '' } : {}),
          ...(faculdadeIndex >= 0 ? { faculdade: columns[faculdadeIndex]?.trim() ?? '' } : {}),
          ...(anoIndex >= 0 ? { ano: columns[anoIndex]?.trim() ?? '' } : {}),
        };
      })
      .filter((row) => Boolean(row.codigo));
  }

  private splitCsvLine(line: string, separator: string) {
    return line.split(separator).map((value) => value.trim().replace(/^"|"$/g, ''));
  }

  private normalizeName(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
}

export const eligibleVotersService = new EligibleVotersService();
