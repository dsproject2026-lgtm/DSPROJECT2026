import { eligibleVotersRepository } from '../repositories/eligible-voters.repository.js';
import { authService } from './auth.service.js';
import type {
  EligibleVoterResponse,
  ImportEligibleVotersResult,
  ListEligibleVotersFilters,
  UpdateEligibleVoterInput,
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
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    const eligibleVoters = await eligibleVotersRepository.findAllByElection(electionId, filters);

    return {
      message: 'Eleitores elegíveis listados com sucesso.',
      data: eligibleVoters,
      count: eligibleVoters.length,
    };
  }

  async previewEligibleVoters(electionId: string, csvContent: string): Promise<{
    message: string;
    data: ImportEligibleVotersResult;
  }> {
    const result = await this.processCsvRows(electionId, csvContent, true);

    return {
      message: 'Pré-visualização de eleitores concluída com sucesso.',
      data: result,
    };
  }

  async importEligibleVoters(electionId: string, csvContent: string): Promise<{
    message: string;
    data: ImportEligibleVotersResult;
  }> {
    const result = await this.processCsvRows(electionId, csvContent, false);

    return {
      message: 'Eleitores elegíveis importados com sucesso.',
      data: result,
    };
  }

  async updateEligibleVoter(electionId: string, id: string, data: UpdateEligibleVoterInput) {
    const eligibleVoter = await eligibleVotersRepository.findByIdForElection(id, electionId);

    if (!eligibleVoter) {
      throw new AppError('Eleitor elegível não encontrado.', 404, 'ELIGIBLE_VOTER_NOT_FOUND', {
        electionId,
        id,
      });
    }

    await eligibleVotersRepository.updateUser(eligibleVoter.utilizadorId, data);
    const updated = await eligibleVotersRepository.findByIdForElection(id, electionId);

    return {
      message: 'Eleitor actualizado com sucesso.',
      data: updated,
    };
  }

  async updateEligibleVoterStatus(electionId: string, id: string, activo: boolean) {
    const eligibleVoter = await eligibleVotersRepository.findByIdForElection(id, electionId);

    if (!eligibleVoter) {
      throw new AppError('Eleitor elegível não encontrado.', 404, 'ELIGIBLE_VOTER_NOT_FOUND', {
        electionId,
        id,
      });
    }

    await eligibleVotersRepository.updateUserStatus(eligibleVoter.utilizadorId, activo);
    const updated = await eligibleVotersRepository.findByIdForElection(id, electionId);

    return {
      message: activo ? 'Eleitor reactivado com sucesso.' : 'Eleitor suspenso com sucesso.',
      data: updated,
    };
  }

  async deleteEligibleVoter(electionId: string, id: string) {
    const eligibleVoter = await eligibleVotersRepository.findByIdForElection(id, electionId);

    if (!eligibleVoter) {
      throw new AppError('Eleitor elegível não encontrado.', 404, 'ELIGIBLE_VOTER_NOT_FOUND', {
        electionId,
        id,
      });
    }

    if (eligibleVoter.jaVotou) {
      throw new AppError(
        'Eleitores que já votaram não podem ser eliminados da eleição.',
        409,
        'ELIGIBLE_VOTER_ALREADY_VOTED',
        { electionId, id },
      );
    }

    await eligibleVotersRepository.delete(id);

    return {
      message: 'Eleitor eliminado da eleição com sucesso.',
      data: { id, deleted: true },
    };
  }

  private async processCsvRows(
    electionId: string,
    csvContent: string,
    previewOnly: boolean,
  ): Promise<ImportEligibleVotersResult> {
    const election = await eligibleVotersRepository.findElectionById(electionId);

    if (!election) {
      throw new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND', { electionId });
    }

    if (election.estado !== 'PROGRAMADA') {
      throw new AppError(
        'Eleitores só podem ser importados quando a eleição está programada.',
        409,
        'ELECTION_NOT_PROGRAMMED',
        { electionId, estado: election.estado },
      );
    }

    const rows = this.parseCsvRows(csvContent);

    if (rows.length === 0) {
      throw new AppError('O ficheiro CSV não contém códigos válidos.', 400, 'ELEGIVEIS_CSV_EMPTY');
    }

    const imported: EligibleVoterResponse[] = [];
    const preview: ImportEligibleVotersResult['preview'] = [];
    const skipped: ImportEligibleVotersResult['skipped'] = [];
    const seenCodes = new Set<string>();

    for (const row of rows) {
      const codigo = row.codigo.trim();

      if (!codigo) {
        skipped.push({ codigo: row.codigo, reason: 'INVALID_CODE' });
        continue;
      }

      const normalizedCode = codigo.toLowerCase();
      if (seenCodes.has(normalizedCode)) {
        skipped.push({ codigo, reason: 'DUPLICATE_IN_FILE' });
        continue;
      }
      seenCodes.add(normalizedCode);

      if (row.email && !this.isValidEmail(row.email)) {
        skipped.push({ codigo, reason: 'INVALID_EMAIL' });
        continue;
      }

      const csvFacultyMatchesElection =
        election.escopoEleitores === 'FACULDADE' &&
        row.faculdade &&
        election.faculdade?.nome &&
        this.normalizeName(row.faculdade) === this.normalizeName(election.faculdade.nome);

      if (
        election.escopoEleitores === 'FACULDADE' &&
        row.faculdade &&
        election.faculdadeId &&
        !csvFacultyMatchesElection
      ) {
        skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
        continue;
      }

      const csvFaculty =
        row.faculdade && election.escopoEleitores !== 'FACULDADE'
          ? await this.resolveCsvFaculty(row.faculdade, !previewOnly)
          : null;

      let user = await eligibleVotersRepository.findUserByCodigo(codigo);

      if (!user) {
        if (!row.nome || !row.email) {
          skipped.push({ codigo, reason: 'USER_NOT_FOUND' });
          continue;
        }

        if (election.escopoEleitores === 'FACULDADE') {
          if (!election.faculdadeId || !row.faculdade) {
            skipped.push({ codigo, reason: 'USER_WITHOUT_FACULTY' });
            continue;
          }

          if (!csvFacultyMatchesElection) {
            skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
            continue;
          }
        }

        const targetFacultyId =
          election.escopoEleitores === 'FACULDADE' ? election.faculdadeId : csvFaculty?.id;
        const targetFacultyName =
          election.escopoEleitores === 'FACULDADE' ? election.faculdade?.nome : csvFaculty?.nome;

        if (previewOnly) {
          preview.push({
            codigo,
            nome: row.nome,
            email: row.email,
            faculdade: targetFacultyName ?? row.faculdade ?? null,
          });
          continue;
        }

        const createdUser = await authService.createUser({
          codigo,
          nome: row.nome,
          email: row.email,
          perfil: 'ELEITOR',
          activo: true,
          mustSetPassword: true,
          ...(targetFacultyId ? { faculdadeId: targetFacultyId } : {}),
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

      if (csvFaculty) {
        if (user.faculdadeId && user.faculdadeId !== csvFaculty.id) {
          skipped.push({ codigo, reason: 'FACULTY_MISMATCH' });
          continue;
        }

        if (!user.faculdadeId && !previewOnly) {
          user = await eligibleVotersRepository.updateUserFaculty(user.id, csvFaculty.id);
        }
      }

      const existingEligibleVoter = await eligibleVotersRepository.findByElectionAndUser(electionId, user.id);

      if (existingEligibleVoter) {
        skipped.push({ codigo, reason: 'ALREADY_REGISTERED' });
        continue;
      }

      preview.push({
        codigo,
        nome: user.nome,
        email: user.email,
        faculdade: user.faculdade?.nome ?? election.faculdade?.nome ?? csvFaculty?.nome ?? null,
      });

      if (!previewOnly) {
        const createdEligibleVoter = await eligibleVotersRepository.create(electionId, user.id);
        imported.push(createdEligibleVoter);
      }
    }

    return {
      imported,
      preview,
      skipped,
      count: previewOnly ? preview.length : imported.length,
      totalCount: rows.length,
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

  private async resolveCsvFaculty(nome: string, createIfMissing: boolean) {
    const normalizedFaculty = nome.trim();

    if (!normalizedFaculty) {
      return null;
    }

    const existingFaculty = await eligibleVotersRepository.findFacultyByName(normalizedFaculty);
    if (existingFaculty || !createIfMissing) {
      return existingFaculty ?? { id: '', nome: normalizedFaculty };
    }

    return eligibleVotersRepository.createFaculty(normalizedFaculty);
  }

  private normalizeName(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
}

export const eligibleVotersService = new EligibleVotersService();
