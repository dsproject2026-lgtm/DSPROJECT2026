import { positionRepository } from '../repositories/position.repository.js';
import type {
  CreatePositionApiInput,
  ListPositionsFilters,
  UpdatePositionApiInput,
} from '../types/positions.types.js';
import { AppError } from '../utils/app-error.js';

class PositionsService {
  async createPosition(data: CreatePositionApiInput) {
    const position = await positionRepository.create(data);

    return {
      message: 'Cargo criado com sucesso.',
      data: position,
    };
  }

  async getPositionById(id: string) {
    const position = await positionRepository.findById(id);

    if (!position) {
      throw new AppError('Cargo não encontrado.', 404, 'POSITION_NOT_FOUND', { id });
    }

    return {
      message: 'Cargo encontrado com sucesso.',
      data: position,
    };
  }

  async listPositions(filters?: ListPositionsFilters) {
    const positions = await positionRepository.findAll(filters);

    return {
      message: 'Cargos listados com sucesso.',
      data: positions,
      count: positions.length,
    };
  }

  async updatePosition(id: string, partialData: UpdatePositionApiInput) {
    const existingPosition = await positionRepository.findById(id);

    if (!existingPosition) {
      throw new AppError('Cargo não encontrado.', 404, 'POSITION_NOT_FOUND', { id });
    }

    const updatedPosition = await positionRepository.update(id, partialData);

    return {
      message: 'Cargo atualizado com sucesso.',
      data: updatedPosition,
    };
  }

  async deletePosition(id: string) {
    const existingPosition = await positionRepository.findById(id);

    if (!existingPosition) {
      throw new AppError('Cargo não encontrado.', 404, 'POSITION_NOT_FOUND', { id });
    }

    await positionRepository.delete(id);

    return {
      message: 'Cargo eliminado com sucesso.',
      data: { id, deleted: true },
    };
  }
}

export const positionsService = new PositionsService();
