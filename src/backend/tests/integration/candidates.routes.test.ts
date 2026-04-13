import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { candidatesServiceMock } = vi.hoisted(() => ({
    candidatesServiceMock: {
        createCandidate: vi.fn(),
        getCandidateById: vi.fn(),
        listCandidates: vi.fn(),
        updateCandidate: vi.fn(),
        deleteCandidate: vi.fn(),
        approveCandidate: vi.fn(),
        rejectCandidate: vi.fn(),
        suspendCandidate: vi.fn(),
    },
}));

vi.mock('../../src/services/candidates.service.js', () => ({
    candidatesService: candidatesServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

type ErrorResponse = {
    success: boolean;
    error: {
        code: string;
        message?: string;
    };
};

describe('candidates routes integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists candidates for election', async () => {
        candidatesServiceMock.listCandidates.mockResolvedValue({
            message: 'Candidatos listados com sucesso.',
            data: [
                {
                    id: '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf',
                    eleicaoId: '7163d892-e5c1-4fb2-bd70-7aa0349e61a7',
                    utilizadorId: '9bb166ce-5145-4767-bc1a-c29ff81f7760',
                    registadoPor: null,
                    nome: 'Candidato Um',
                    fotoUrl: null,
                    biografia: null,
                    proposta: null,
                    estado: 'PENDENTE',
                    eleicao: {
                        id: '7163d892-e5c1-4fb2-bd70-7aa0349e61a7',
                        cargoId: '27ff4f81-b7a5-4f2d-89ad-47b60fc0c90d',
                        titulo: 'Eleição 2026',
                        estado: 'CANDIDATURAS_ABERTAS',
                    },
                    utilizador: {
                        id: '9bb166ce-5145-4767-bc1a-c29ff81f7760',
                        codigo: '2026003',
                        nome: 'User Candidate',
                        email: 'candidate@example.com',
                        perfil: 'ELEITOR',
                        activo: true,
                        mustSetPassword: false,
                        createdAt: new Date().toISOString(),
                    },
                    registador: null,
                    votos: [],
                },
            ],
            count: 1,
        });

        const response = await request(app).get(
            '/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates',
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.count).toBe(1);
    });

    it('creates candidate with GESTOR_ELEITORAL token', async () => {
        const gestorToken = generateAccessToken({
            sub: 'f8584eb5-f35d-4148-a8fe-97e6122ec111',
            codigo: '2026001',
            perfil: 'GESTOR_ELEITORAL',
            purpose: 'ACCESS',
        });

        candidatesServiceMock.createCandidate.mockResolvedValue({
            message: 'Candidato registado com sucesso.',
            data: {
                id: '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf',
            },
        });

        const response = await request(app)
            .post('/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates')
            .set('Authorization', `Bearer ${gestorToken}`)
            .send({
                utilizadorId: '9bb166ce-5145-4767-bc1a-c29ff81f7760',
                nome: 'Candidato Um',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(candidatesServiceMock.createCandidate).toHaveBeenCalled();
    });

    it('rejects create candidate without auth', async () => {
        const response = await request(app)
            .post('/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates')
            .send({
                utilizadorId: '9bb166ce-5145-4767-bc1a-c29ff81f7760',
                nome: 'Candidato Um',
            });

        const body = response.body as ErrorResponse;

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('AUTH_TOKEN_REQUIRED');
    });

    it('approves candidate with GESTOR_ELEITORAL token', async () => {
        const gestorToken = generateAccessToken({
            sub: 'f8584eb5-f35d-4148-a8fe-97e6122ec111',
            codigo: '2026001',
            perfil: 'GESTOR_ELEITORAL',
            purpose: 'ACCESS',
        });

        candidatesServiceMock.approveCandidate.mockResolvedValue({
            message: 'Candidato aprovado com sucesso.',
            data: { id: '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf', estado: 'APROVADO' },
        });

        const response = await request(app)
            .patch('/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates/0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf/approve')
            .set('Authorization', `Bearer ${gestorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(candidatesServiceMock.approveCandidate).toHaveBeenCalledWith(
            '7163d892-e5c1-4fb2-bd70-7aa0349e61a7',
            '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf',
        );
    });

    it('rejects candidate with GESTOR_ELEITORAL token', async () => {
        const gestorToken = generateAccessToken({
            sub: 'f8584eb5-f35d-4148-a8fe-97e6122ec111',
            codigo: '2026001',
            perfil: 'GESTOR_ELEITORAL',
            purpose: 'ACCESS',
        });

        candidatesServiceMock.rejectCandidate.mockResolvedValue({
            message: 'Candidato rejeitado com sucesso.',
            data: { id: '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf', estado: 'REJEITADO' },
        });

        const response = await request(app)
            .patch('/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates/0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf/reject')
            .set('Authorization', `Bearer ${gestorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(candidatesServiceMock.rejectCandidate).toHaveBeenCalledWith(
            '7163d892-e5c1-4fb2-bd70-7aa0349e61a7',
            '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf',
        );
    });

    it('suspends candidate with GESTOR_ELEITORAL token', async () => {
        const gestorToken = generateAccessToken({
            sub: 'f8584eb5-f35d-4148-a8fe-97e6122ec111',
            codigo: '2026001',
            perfil: 'GESTOR_ELEITORAL',
            purpose: 'ACCESS',
        });

        candidatesServiceMock.suspendCandidate.mockResolvedValue({
            message: 'Candidato suspenso com sucesso.',
            data: { id: '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf', estado: 'SUSPENSO' },
        });

        const response = await request(app)
            .patch('/api/v1/elections/7163d892-e5c1-4fb2-bd70-7aa0349e61a7/candidates/0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf/suspend')
            .set('Authorization', `Bearer ${gestorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(candidatesServiceMock.suspendCandidate).toHaveBeenCalledWith(
            '7163d892-e5c1-4fb2-bd70-7aa0349e61a7',
            '0a25ef0f-3e31-4f17-bb9b-a2f27dc79ebf',
        );
    });
});
