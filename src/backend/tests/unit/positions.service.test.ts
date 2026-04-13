import { beforeEach, describe, expect, it, vi } from 'vitest';

const { positionRepositoryMock } = vi.hoisted(() => ({
  positionRepositoryMock: {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/repositories/position.repository.js', () => ({
  positionRepository: positionRepositoryMock,
}));

import { positionsService } from '../../src/services/positions.service.js';

describe('PositionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPosition', () => {
    it('creates a position successfully', async () => {
      const inputData = {
        nome: 'Presidente',
        descricao: 'Cargo de presidente',
      };

      positionRepositoryMock.create.mockResolvedValue({
        id: 'pos-1',
        nome: 'Presidente',
        descricao: 'Cargo de presidente',
        eleicoes: [],
      });

      const result = await positionsService.createPosition(inputData);

      expect(result.message).toBe('Cargo criado com sucesso.');
      expect(result.data.nome).toBe('Presidente');
      expect(positionRepositoryMock.create).toHaveBeenCalledWith(inputData);
    });
  });

  describe('getPositionById', () => {
    it('returns position when found', async () => {
      positionRepositoryMock.findById.mockResolvedValue({
        id: 'pos-1',
        nome: 'Presidente',
        descricao: 'Cargo de presidente',
        eleicoes: [],
      });

      const result = await positionsService.getPositionById('pos-1');

      expect(result.message).toBe('Cargo encontrado com sucesso.');
      expect(result.data.id).toBe('pos-1');
    });

    it('throws error when position not found', async () => {
      positionRepositoryMock.findById.mockResolvedValue(null);

      await expect(positionsService.getPositionById('invalid-id')).rejects.toThrow(
        'Cargo não encontrado.',
      );
    });
  });

  describe('listPositions', () => {
    it('returns list of positions without filters', async () => {
      const positions = [
        { id: 'pos-1', nome: 'Presidente', descricao: null, eleicoes: [] },
        { id: 'pos-2', nome: 'Secretário', descricao: 'Cargo de secretário', eleicoes: [] },
      ];

      positionRepositoryMock.findAll.mockResolvedValue(positions);

      const result = await positionsService.listPositions();

      expect(result.message).toBe('Cargos listados com sucesso.');
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('returns filtered list of positions', async () => {
      const positions = [{ id: 'pos-1', nome: 'Presidente', descricao: null, eleicoes: [] }];

      positionRepositoryMock.findAll.mockResolvedValue(positions);

      const result = await positionsService.listPositions({ nome: 'Presidente' });

      expect(result.message).toBe('Cargos listados com sucesso.');
      expect(result.data).toHaveLength(1);
      expect(positionRepositoryMock.findAll).toHaveBeenCalledWith({ nome: 'Presidente' });
    });
  });

  describe('updatePosition', () => {
    it('updates position successfully', async () => {
      const existingPosition = {
        id: 'pos-1',
        nome: 'Presidente',
        descricao: 'Cargo de presidente',
        eleicoes: [],
      };

      const updatedPosition = {
        ...existingPosition,
        nome: 'Presidente Geral',
      };

      positionRepositoryMock.findById.mockResolvedValue(existingPosition);
      positionRepositoryMock.update.mockResolvedValue(updatedPosition);

      const result = await positionsService.updatePosition('pos-1', {
        nome: 'Presidente Geral',
      });

      expect(result.message).toBe('Cargo atualizado com sucesso.');
      expect(result.data.nome).toBe('Presidente Geral');
    });

    it('throws error when position not found', async () => {
      positionRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        positionsService.updatePosition('invalid-id', { nome: 'Teste' }),
      ).rejects.toThrow('Cargo não encontrado.');
    });
  });

  describe('deletePosition', () => {
    it('deletes position successfully', async () => {
      positionRepositoryMock.findById.mockResolvedValue({
        id: 'pos-1',
        nome: 'Presidente',
        descricao: null,
        eleicoes: [],
      });

      positionRepositoryMock.delete.mockResolvedValue({ id: 'pos-1', deleted: true });

      const result = await positionsService.deletePosition('pos-1');

      expect(result.message).toBe('Cargo eliminado com sucesso.');
      expect(result.data.deleted).toBe(true);
    });

    it('throws error when position not found', async () => {
      positionRepositoryMock.findById.mockResolvedValue(null);

      await expect(positionsService.deletePosition('invalid-id')).rejects.toThrow(
        'Cargo não encontrado.',
      );
    });
  });
});
