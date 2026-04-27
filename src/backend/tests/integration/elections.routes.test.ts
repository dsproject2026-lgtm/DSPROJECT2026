import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/utils/app-error.js';

const { electionsServiceMock } = vi.hoisted(() => ({
  electionsServiceMock: {
    createElection: vi.fn(),
    getElectionById: vi.fn(),
    listElections: vi.fn(),
    listCandidateUsers: vi.fn(),
    updateElection: vi.fn(),
    deleteElection: vi.fn(),
  },
}));

vi.mock('../../src/services/elections.service.js', () => ({
  electionsService: electionsServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

type ElectionResponse = {
  success: boolean;
  data: {
    id: string;
    titulo: string;
    cargoId: string;
    estado: string;
  };
};

type ListElectionsResponse = {
  success: boolean;
  data: {
    items: Array<{ id: string; titulo: string; estado: string }>;
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

describe('elections routes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /elections', () => {
    it('returns list of all elections', async () => {
      electionsServiceMock.listElections.mockResolvedValue({
        message: 'Eleições listadas com sucesso.',
        data: [
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
        ],
        count: 2,
      });

      const response = await request(app).get('/api/v1/elections');
      const body = response.body as ListElectionsResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.count).toBe(2);
    });

    it('returns filtered list by estado', async () => {
      electionsServiceMock.listElections.mockResolvedValue({
        message: 'Eleições listadas com sucesso.',
        data: [
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
        ],
        count: 1,
      });

      const response = await request(app).get('/api/v1/elections?estado=CANDIDATURAS_ABERTAS');
      const body = response.body as ListElectionsResponse;

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(1);
      expect(electionsServiceMock.listElections).toHaveBeenCalledWith({
        estado: 'CANDIDATURAS_ABERTAS',
      });
    });

    it('returns filtered list by cargoId', async () => {
      const cargoId = '11111111-1111-4111-8111-111111111111';
      electionsServiceMock.listElections.mockResolvedValue({
        message: 'Eleições listadas com sucesso.',
        data: [
          {
            id: 'eleicao-1',
            cargoId,
            titulo: 'Eleição para Presidente 2026',
            estado: 'CANDIDATURAS_ABERTAS',
            cargo: { id: cargoId, nome: 'Presidente', descricao: null },
            candidatos: [],
            elegiveis: [],
            comprovativos: [],
          },
        ],
        count: 1,
      });

      const response = await request(app).get(`/api/v1/elections?cargoId=${cargoId}`);
      const body = response.body as ListElectionsResponse;

      expect(response.status).toBe(200);
      expect(electionsServiceMock.listElections).toHaveBeenCalledWith({ cargoId });
    });
  });

  describe('GET /elections/candidate-users', () => {
    const validGestorToken = generateAccessToken({
      sub: 'user-2',
      codigo: '2026002',
      perfil: 'GESTOR_ELEITORAL',
      purpose: 'ACCESS',
    });

    it('lists existing candidate users', async () => {
      electionsServiceMock.listCandidateUsers.mockResolvedValue({
        message: 'Candidatos disponíveis listados com sucesso.',
        data: [{ id: 'user-1', codigo: '026001', nome: 'Candidato Um', email: 'cand@up.ac.mz', activo: true }],
        count: 1,
      });

      const response = await request(app)
        .get('/api/v1/elections/candidate-users')
        .set('Authorization', `Bearer ${validGestorToken}`);

      const body = response.body as ListElectionsResponse;
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(electionsServiceMock.listCandidateUsers).toHaveBeenCalledWith(undefined);
    });
  });

  describe('GET /elections/:id', () => {
    it('returns election when found', async () => {
      electionsServiceMock.getElectionById.mockResolvedValue({
        message: 'Eleição encontrada com sucesso.',
        data: {
          id: 'eleicao-1',
          cargoId: 'cargo-1',
          titulo: 'Eleição para Presidente 2026',
          descricao: 'Eleição anual',
          estado: 'CANDIDATURAS_ABERTAS',
          cargo: { id: 'cargo-1', nome: 'Presidente', descricao: 'Cargo de presidente' },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      });

      const response = await request(app).get('/api/v1/elections/eleicao-1');
      const body = response.body as ElectionResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('eleicao-1');
    });

    it('returns 404 when election not found', async () => {
      electionsServiceMock.getElectionById.mockRejectedValue(
        new AppError('Eleição não encontrada.', 404, 'ELECTION_NOT_FOUND'),
      );

      const response = await request(app).get('/api/v1/elections/invalid-id');
      const body = response.body as ErrorResponse;

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ELECTION_NOT_FOUND');
    });
  });

  describe('POST /elections', () => {
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

    it('rejects create with ADMIN token (forbidden by current route policy)', async () => {
      const cargoId = '11111111-1111-4111-8111-111111111111';
      electionsServiceMock.createElection.mockResolvedValue({
        message: 'Eleição criada com sucesso.',
        data: {
          id: 'eleicao-new',
          cargoId,
          titulo: 'Nova Eleição',
          descricao: 'Descrição da eleição',
          estado: 'RASCUNHO',
          cargo: { id: cargoId, nome: 'Presidente', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      });

      const response = await request(app)
        .post('/api/v1/elections')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send({
          cargoId,
          titulo: 'Nova Eleição',
          descricao: 'Descrição da eleição',
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('creates election with GESTOR_ELEITORAL token', async () => {
      const cargoId = '22222222-2222-4222-8222-222222222222';
      electionsServiceMock.createElection.mockResolvedValue({
        message: 'Eleição criada com sucesso.',
        data: {
          id: 'eleicao-new-2',
          cargoId,
          titulo: 'Eleição do Gestor',
          estado: 'RASCUNHO',
          cargo: { id: cargoId, nome: 'Secretário', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      });

      const response = await request(app)
        .post('/api/v1/elections')
        .set('Authorization', `Bearer ${validGestorToken}`)
        .send({
          cargoId,
          titulo: 'Eleição do Gestor',
        });

      const body = response.body as ElectionResponse;

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
    });

    it('rejects create without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/elections')
        .send({
          cargoId: 'cargo-1',
          titulo: 'Eleição Não Autorizada',
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    it('rejects create with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/elections')
        .set('Authorization', `Bearer ${validGestorToken}`)
        .send({
          cargoId: 'invalid-uuid',
          titulo: 'A', // titulo muito curto
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
    });
  });

  describe('PATCH /elections/:id', () => {
    it('updates election successfully', async () => {
      electionsServiceMock.updateElection.mockResolvedValue({
        message: 'Eleição atualizada com sucesso.',
        data: {
          id: 'eleicao-1',
          cargoId: 'cargo-1',
          titulo: 'Eleição Atualizada',
          descricao: 'Nova descrição',
          estado: 'CANDIDATURAS_ABERTAS',
          cargo: { id: 'cargo-1', nome: 'Presidente', descricao: null },
          candidatos: [],
          elegiveis: [],
          comprovativos: [],
        },
      });

      const response = await request(app)
        .patch('/api/v1/elections/eleicao-1')
        .send({
          titulo: 'Eleição Atualizada',
          estado: 'CANDIDATURAS_ABERTAS',
        });

      const body = response.body as ElectionResponse;

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.titulo).toBe('Eleição Atualizada');
    });

    it('rejects update with invalid data', async () => {
      const response = await request(app)
        .patch('/api/v1/elections/eleicao-1')
        .send({
          titulo: 'A',
        });

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /elections/:id', () => {
    const validGestorToken = generateAccessToken({
      sub: 'user-1',
      codigo: '2026001',
      perfil: 'GESTOR_ELEITORAL',
      purpose: 'ACCESS',
    });

    it('deletes election successfully', async () => {
      electionsServiceMock.deleteElection.mockResolvedValue({
        message: 'Eleição eliminada com sucesso.',
        data: { id: 'eleicao-1', deleted: true },
      });

      const response = await request(app)
        .delete('/api/v1/elections/eleicao-1')
        .set('Authorization', `Bearer ${validGestorToken}`);

      const body = response.body as { success: boolean; data: { id: string; deleted: boolean } };

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deleted).toBe(true);
    });

    it('rejects delete with ADMIN profile', async () => {
      const adminToken = generateAccessToken({
        sub: 'user-2',
        codigo: '2026002',
        perfil: 'ADMIN',
        purpose: 'ACCESS',
      });

      const response = await request(app)
        .delete('/api/v1/elections/eleicao-1')
        .set('Authorization', `Bearer ${adminToken}`);

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('rejects delete without authentication', async () => {
      const response = await request(app).delete('/api/v1/elections/eleicao-1');

      const body = response.body as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });
  });
});
