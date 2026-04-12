import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { positionsServiceMock } = vi.hoisted(() => ({
  positionsServiceMock: {
    createPosition: vi.fn(),
    getPositionById: vi.fn(),
    listPositions: vi.fn(),
    updatePosition: vi.fn(),
    deletePosition: vi.fn(),
  },
}));

vi.mock('../../src/services/positions.service.js', () => ({
  positionsService: positionsServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

type PositionResponse = {
  success: boolean;
  data: {
    id: string;
    nome: string;
    descricao: string | null;
  };
};

type ListPositionsResponse = {
  success: boolean;
  data: {
    items: Array<{ id: string; nome: string }>;
    count: number;
  };
};

type ErrorResponse = {
  success: boolean;
  error: {
    code: string;
    message?: string;
  };
};

describe('positions routes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /positions', () => {
    it('returns list of all positions', async () => {
      positionsServiceMock.listPositions.mockResolvedValue({
        message: 'Cargos listados com sucesso.',
        data: [
          { id: 'pos-1', nome: 'Presidente', descricao: null, eleicoes: [] },
          { id: 'pos-2', nome: 'Secretário', descricao: 'Cargo de secretário', eleicoes: [] },
        ],
        count: 2,
      });

      const response = await request(app).get('/api/v1/positions');
      const body = response.body as ListPositionsResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.count).toBe(2);
    });

    it('returns filtered list of positions by nome', async () => {
      positionsServiceMock.listPositions.mockResolvedValue({
        message: 'Cargos listados com sucesso.',
        data: [{ id: 'pos-1', nome: 'Presidente', descricao: null, eleicoes: [] }],
        count: 1,
      });

      const response = await request(app).get('/api/v1/positions?nome=Presidente');
      const body = response.body as ListPositionsResponse;

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(1);
      expect(positionsServiceMock.listPositions).toHaveBeenCalledWith({ nome: 'Presidente' });
    });
  });

  describe('GET /positions/:id', () => {
    it('returns position when found', async () => {
      positionsServiceMock.getPositionById.mockResolvedValue({
        message: 'Cargo encontrado com sucesso.',
        data: {
          id: 'pos-1',
          nome: 'Presidente',
          descricao: 'Cargo de presidente',
          eleicoes: [],
        },
      });

      const response = await request(app).get('/api/v1/positions/pos-1');
      const body = response.body as PositionResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('pos-1');
    });

    it('returns 404 when position not found', async () => {
      positionsServiceMock.getPositionById.mockRejectedValue({
        statusCode: 404,
        code: 'POSITION_NOT_FOUND',
        message: 'Cargo não encontrado.',
      });

      const response = await request(app).get('/api/v1/positions/invalid-id');
      const body = response.body as ErrorResponse;

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('POSITION_NOT_FOUND');
    });
  });

  describe('POST /positions', () => {
    const validAdminToken = generateAccessToken({
      sub: 'user-1',
      codigo: '2026001',
      perfil: 'ADMIN',
      purpose: 'ACCESS',
    });

    const validGestorToken = generateAccessToken({
      sub: 'user-2',
      codigo: '2026002',
      perfil: 'GESTOR_ELEITORAL',
      purpose: 'ACCESS',
    });

    it('creates position with ADMIN token', async () => {
      positionsServiceMock.createPosition.mockResolvedValue({
        message: 'Cargo criado com sucesso.',
        data: {
          id: 'pos-new',
          nome: 'Tesoureiro',
          descricao: 'Cargo de tesoureiro',
          eleicoes: [],
        },
      });

      const response = await request(app)
        .post('/api/v1/positions')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({
          nome: 'Tesoureiro',
          descricao: 'Cargo de tesoureiro',
        });

      const body = response.body as PositionResponse;

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('pos-new');
    });

    it('creates position with GESTOR_ELEITORAL token', async () => {
      positionsServiceMock.createPosition.mockResolvedValue({
        message: 'Cargo criado com sucesso.',
        data: {
          id: 'pos-new-2',
          nome: 'Vogal',
          descricao: null,
          eleicoes: [],
        },
      });

      const response = await request(app)
        .post('/api/v1/positions')
        .set('Authorization', `Bearer ${validGestorToken}`)
        .send({
          nome: 'Vogal',
        });

      const body = response.body as PositionResponse;

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('rejects create without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/positions')
        .send({
          nome: 'Tesoureiro',
          descricao: 'Cargo de tesoureiro',
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    it('rejects create with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/positions')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({
          nome: 'A', // nome muito curto (min 3 chars)
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('PUT /positions/:id', () => {
    const validAdminToken = generateAccessToken({
      sub: 'user-1',
      codigo: '2026001',
      perfil: 'ADMIN',
      purpose: 'ACCESS',
    });

    it('updates position successfully', async () => {
      positionsServiceMock.updatePosition.mockResolvedValue({
        message: 'Cargo atualizado com sucesso.',
        data: {
          id: 'pos-1',
          nome: 'Presidente Geral',
          descricao: 'Nova descrição',
          eleicoes: [],
        },
      });

      const response = await request(app)
        .put('/api/v1/positions/pos-1')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({
          nome: 'Presidente Geral',
          descricao: 'Nova descrição',
        });

      const body = response.body as PositionResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.nome).toBe('Presidente Geral');
    });

    it('rejects update without authentication', async () => {
      const response = await request(app)
        .put('/api/v1/positions/pos-1')
        .send({
          nome: 'Presidente Atualizado',
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });
  });

  describe('DELETE /positions/:id', () => {
    const validAdminToken = generateAccessToken({
      sub: 'user-1',
      codigo: '2026001',
      perfil: 'ADMIN',
      purpose: 'ACCESS',
    });

    it('deletes position successfully', async () => {
      positionsServiceMock.deletePosition.mockResolvedValue({
        message: 'Cargo eliminado com sucesso.',
        data: { id: 'pos-1', deleted: true },
      });

      const response = await request(app)
        .delete('/api/v1/positions/pos-1')
        .set('Authorization', `Bearer ${validAdminToken}`);

      const body = response.body as { success: boolean; data: { id: string; deleted: boolean } };

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deleted).toBe(true);
    });

    it('rejects delete without ADMIN profile', async () => {
      const gestorToken = generateAccessToken({
        sub: 'user-2',
        codigo: '2026002',
        perfil: 'GESTOR_ELEITORAL',
        purpose: 'ACCESS',
      });

      const response = await request(app)
        .delete('/api/v1/positions/pos-1')
        .set('Authorization', `Bearer ${gestorToken}`);

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INSUFFICIENT_PROFILE');
    });

    it('rejects delete without authentication', async () => {
      const response = await request(app).delete('/api/v1/positions/pos-1');

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });
  });
});
