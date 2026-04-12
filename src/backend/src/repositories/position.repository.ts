import { prisma } from '../lib/prisma.js';
import type { CreatePositionApiInput, ListPositionsFilters, UpdatePositionApiInput } from '../types/positions.types.js';
import type { EntityId } from '../types/common.types.js';



const positionWithRelationsSelect = {
    id: true,
    nome: true,
    descricao: true,
    eleicoes: {
        select: {
            id: true,
            titulo: true,
            estado: true,
        },
    },
} as const;

class PositionRepository {
    async create(data: CreatePositionApiInput) {
        return prisma.cargo.create({
            data: {
                nome: data.nome,
                descricao: data.descricao ?? null,
            },
            select: positionWithRelationsSelect,
        });
    }

    async findById(id: EntityId) {
        return prisma.cargo.findUnique({
            where: { id },
            select: positionWithRelationsSelect,
        });
    }

    async findAll(filters?: ListPositionsFilters) {
        return prisma.cargo.findMany({
            where: {
                ...(filters?.nome ? { nome: { contains: filters.nome, mode: 'insensitive' } } : {}),
            },
            select: positionWithRelationsSelect,
        });
    }

    async update(id: EntityId, data: UpdatePositionApiInput) {
        return prisma.cargo.update({
            where: { id },
            data: {
                ...(data.nome !== undefined ? { nome: data.nome } : {}),
                ...(data.descricao !== undefined ? { descricao: data.descricao ?? null } : {}),
            },
            select: positionWithRelationsSelect,
        });
    }

    async delete(id: EntityId) {
        return prisma.cargo.delete({
            where: { id },
            select: positionWithRelationsSelect,
        });
    }
}

export const positionRepository = new PositionRepository();
