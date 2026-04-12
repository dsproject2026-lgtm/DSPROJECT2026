import { beforeEach, describe, expect, it, vi } from 'vitest';

const { electionsRepositoryMock } = vi.hoisted(() => ({
  electionsRepositoryMock: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findCargoById: vi.fn(),
  },
}));

vi.mock('../../src/repositories/elections.repository.js', () => ({
  electionsRepository: electionsRepositoryMock,
}));

import { electionsService } from '../../src/services/elections.service.js';

describe('ElectionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createElection', () => {
    it('creates an election successfully', async () => {
      const inputData = {
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        descricao: 'Eleição anual',
      };

      electionsRepositoryMock.findCargoById.mockResolvedValue({
        id: 'cargo-1',
        nome: 'Presidente',
        descricao: 'Cargo de presidente',
      });

      electionsRepositoryMock.create.mockResolvedValue({
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        descricao: 'Eleição anual',
        estado: 'RASCUNHO',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: 'Cargo de presidente' },
        candidatos: [],
        elegiveis: [],
        comprovativos: [],
      });

      const result = await electionsService.createElection(inputData);

      expect(result.message).toBe('Eleição criada com sucesso.');
      expect(result.data.titulo).toBe('Eleição para Presidente 2026');
      expect(electionsRepositoryMock.findCargoById).toHaveBeenCalledWith('cargo-1');
      expect(electionsRepositoryMock.create).toHaveBeenCalledWith(inputData);
    });

    it('throws error when cargo not found', async () => {
      const inputData = {
        cargoId: 'cargo-invalid',
        titulo: 'Eleição Inválida',
      };

      electionsRepositoryMock.findCargoById.mockResolvedValue(null);

      await expect(electionsService.createElection(inputData)).rejects.toThrow(
        'Cargo com ID cargo-invalid não encontrado.',
      );
    });
  });

  describe('getElectionById', () => {
    it('returns election when found', async () => {
      electionsRepositoryMock.findById.mockResolvedValue({
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        descricao: 'Eleição anual',
        estado: 'CANDIDATURAS_ABERTAS',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: 'Cargo de presidente' },
        candidatos: [],
        elegiveis: [],
        comprovativos: [],
      });

      const result = await electionsService.getElectionById('eleicao-1');

      expect(result.message).toBe('Eleição encontrada com sucesso.');
      expect(result.data.id).toBe('eleicao-1');
    });

    it('throws error when election not found', async () => {
      electionsRepositoryMock.findById.mockResolvedValue(null);

      await expect(electionsService.getElectionById('invalid-id')).rejects.toThrow(
        'Eleição não encontrada.',
      );
    });
  });

  describe('listElections', () => {
    it('returns list of all elections without filters', async () => {
      const elections = [
        {
          id: 'eleicao-1',
          cargoId: 'cargo-1',
          titulo: 'Eleição para Presidente 2026',
          estado: 'CANDIDATURAS_ABERTAS',
          cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
        {
          id: 'eleicao-2',
          cargoId: 'cargo-2',
          titulo: 'Eleição para Secretário 2026',
          estado: 'RASCUNHO',
          cargo: { id: 'cargo-2', nome: 'Secretário', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      ];

      electionsRepositoryMock.findAll.mockResolvedValue(elections);

      const result = await electionsService.listElections();

      expect(result.message).toBe('Eleições listadas com sucesso.');
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('returns filtered list by estado', async () => {
      const elections = [
        {
          id: 'eleicao-1',
          cargoId: 'cargo-1',
          titulo: 'Eleição para Presidente 2026',
          estado: 'CANDIDATURAS_ABERTAS',
          cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      ];

      electionsRepositoryMock.findAll.mockResolvedValue(elections);

      const result = await electionsService.listElections({ estado: 'CANDIDATURAS_ABERTAS' });

      expect(result.message).toBe('Eleições listadas com sucesso.');
      expect(result.data).toHaveLength(1);
      expect(electionsRepositoryMock.findAll).toHaveBeenCalledWith({
        estado: 'CANDIDATURAS_ABERTAS',
      });
    });

    it('returns filtered list by cargoId', async () => {
      const elections = [
        {
          id: 'eleicao-1',
          cargoId: 'cargo-1',
          titulo: 'Eleição para Presidente 2026',
          estado: 'CANDIDATURAS_ABERTAS',
          cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      ];

      electionsRepositoryMock.findAll.mockResolvedValue(elections);

      const result = await electionsService.listElections({ cargoId: 'cargo-1' });

      expect(result.message).toBe('Eleições listadas com sucesso.');
      expect(electionsRepositoryMock.findAll).toHaveBeenCalledWith({ cargoId: 'cargo-1' });
    });
  });

  describe('updateElection', () => {
    it('updates election successfully', async () => {
      const existingElection = {
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        descricao: 'Descrição antiga',
        estado: 'RASCUNHO',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
        candidatos: [],
        elegiveis: [],
        comprovativos: [],
      };

      const updatedElection = {
        ...existingElection,
        titulo: 'Eleição para Presidente 2026 - Atualizada',
        estado: 'CANDIDATURAS_ABERTAS',
      };

      electionsRepositoryMock.findById.mockResolvedValue(existingElection);
      electionsRepositoryMock.update.mockResolvedValue(updatedElection);

      const result = await electionsService.updateElection('eleicao-1', {
        titulo: 'Eleição para Presidente 2026 - Atualizada',
        estado: 'CANDIDATURAS_ABERTAS',
      });

      expect(result.message).toBe('Eleição atualizada com sucesso.');
      expect(result.data.titulo).toBe('Eleição para Presidente 2026 - Atualizada');
    });

    it('throws error when election not found', async () => {
      electionsRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        electionsService.updateElection('invalid-id', { titulo: 'Novo Título' }),
      ).rejects.toThrow('Eleição não encontrada.');
    });

    it('validates cargoId exists when updating cargoId', async () => {
      const existingElection = {
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        estado: 'RASCUNHO',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
        candidatos: [],
        elegiveis: [],
        comprovativos: [],
      };

      electionsRepositoryMock.findById.mockResolvedValue(existingElection);
      electionsRepositoryMock.findCargoById.mockResolvedValue(null);

      await expect(
        electionsService.updateElection('eleicao-1', { cargoId: 'cargo-invalid' }),
      ).rejects.toThrow('Cargo com ID cargo-invalid não encontrado.');
    });
  });

  describe('deleteElection', () => {
    it('deletes election successfully when no candidatos or elegiveis', async () => {
      const election = {
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        estado: 'RASCUNHO',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
        candidatos: [],
        elegiveis: [],
        comprovativos: [],
      };

      electionsRepositoryMock.findById.mockResolvedValue(election);
      electionsRepositoryMock.delete.mockResolvedValue({ id: 'eleicao-1', titulo: 'Eleição' });

      const result = await electionsService.deleteElection('eleicao-1');

      expect(result.message).toBe('Eleição eliminada com sucesso.');
      expect(result.data.deleted).toBe(true);
    });

    it('throws error when election has candidatos', async () => {
      const election = {
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        estado: 'CANDIDATURAS_ABERTAS',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
        candidatos: [{ id: 'cand-1', nome: 'Candidato 1', estado: 'APROVADO' }],
        elegiveis: [],
        comprovativos: [],
      };

      electionsRepositoryMock.findById.mockResolvedValue(election);

      await expect(electionsService.deleteElection('eleicao-1')).rejects.toThrow(
        'Não é possível eliminar uma eleição que já tem candidatos registados.',
      );
    });

    it('throws error when election has elegiveis', async () => {
      const election = {
        id: 'eleicao-1',
        cargoId: 'cargo-1',
        titulo: 'Eleição para Presidente 2026',
        estado: 'CANDIDATURAS_ABERTAS',
        cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
        candidatos: [],
        elegiveis: [{ id: 'eleg-1', utilizadorId: 'user-1', jaVotou: false }],
        comprovativos: [],
      };

      electionsRepositoryMock.findById.mockResolvedValue(election);

      await expect(electionsService.deleteElection('eleicao-1')).rejects.toThrow(
        'Não é possível eliminar uma eleição que já tem eleitores elegíveis registados.',
      );
    });

    it('throws error when election not found', async () => {
      electionsRepositoryMock.findById.mockResolvedValue(null);

      await expect(electionsService.deleteElection('invalid-id')).rejects.toThrow(
        'Eleição não encontrada.',
      );
    });
  });
});
