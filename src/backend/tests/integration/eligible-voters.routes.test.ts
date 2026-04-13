import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { eligibleVotersServiceMock } = vi.hoisted(() => ({
    eligibleVotersServiceMock: {
        listEligibleVoters: vi.fn(),
        importEligibleVoters: vi.fn(),
    },
}));

vi.mock('../../src/services/eligible-voters.service.js', () => ({
    eligibleVotersService: eligibleVotersServiceMock,
}));

import { createApp } from '../../src/app.js';
import { generateAccessToken } from '../../src/utils/auth-token.js';

const app = createApp();

type EligibleVotersResponse = {
    success: boolean;
    data: {
        items: Array<{ id: string; utilizadorId: string; jaVotou: boolean }>;
        count: number;
    };
};

describe('eligible voters routes integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const electionId = '11111111-1111-4111-8111-111111111111';

    describe('GET /elections/:electionId/eligible-voters', () => {
        it('returns eligible voters for authenticated auditor', async () => {
            eligibleVotersServiceMock.listEligibleVoters.mockResolvedValue({
                message: 'Eleitores elegíveis listados com sucesso.',
                data: [
                    {
                        id: 'eleg-1',
                        eleicaoId: 'eleicao-1',
                        utilizadorId: 'user-1',
                        jaVotou: false,
                        importadoEm: '2026-04-13T10:00:00.000Z',
                        eleicao: {
                            id: 'eleicao-1',
                            cargoId: 'cargo-1',
                            titulo: 'Eleição 2026',
                            estado: 'CANDIDATURAS_ABERTAS',
                        },
                        utilizador: {
                            id: 'user-1',
                            codigo: '2026001',
                            nome: 'Ana Silva',
                            email: 'ana@example.com',
                            perfil: 'ELEITOR',
                            activo: true,
                            mustSetPassword: false,
                            createdAt: '2026-04-13T09:00:00.000Z',
                        },
                    },
                ],
                count: 1,
            });

            const auditorToken = generateAccessToken({
                sub: 'user-1',
                codigo: '2026001',
                perfil: 'AUDITOR',
                purpose: 'ACCESS',
            });

            const response = await request(app)
                .get(`/api/v1/elections/${electionId}/eligible-voters`)
                .set('Authorization', `Bearer ${auditorToken}`);

            const body = response.body as EligibleVotersResponse;

            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.items).toHaveLength(1);
        });

        it('rejects unauthenticated requests', async () => {
            const response = await request(app).get(`/api/v1/elections/${electionId}/eligible-voters`);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_TOKEN_REQUIRED');
        });
    });

    describe('POST /elections/:electionId/eligible-voters/import-csv', () => {
        it('imports eligible voters with ADMIN token', async () => {
            eligibleVotersServiceMock.importEligibleVoters.mockResolvedValue({
                message: 'Eleitores elegíveis importados com sucesso.',
                data: {
                    imported: [
                        {
                            id: 'eleg-1',
                            eleicaoId: 'eleicao-1',
                            utilizadorId: 'user-1',
                            jaVotou: false,
                            importadoEm: '2026-04-13T10:00:00.000Z',
                            eleicao: {
                                id: 'eleicao-1',
                                cargoId: 'cargo-1',
                                titulo: 'Eleição 2026',
                                estado: 'CANDIDATURAS_ABERTAS',
                            },
                            utilizador: {
                                id: 'user-1',
                                codigo: '2026001',
                                nome: 'Ana Silva',
                                email: 'ana@example.com',
                                perfil: 'ELEITOR',
                                activo: true,
                                mustSetPassword: false,
                                createdAt: '2026-04-13T09:00:00.000Z',
                            },
                        },
                    ],
                    skipped: [],
                    count: 1,
                    totalCount: 1,
                },
            });

            const adminToken = generateAccessToken({
                sub: 'user-1',
                codigo: '2026001',
                perfil: 'ADMIN',
                purpose: 'ACCESS',
            });

            const response = await request(app)
                .post(`/api/v1/elections/${electionId}/eligible-voters/import-csv`)
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'text/csv')
                .send('codigo\n2026001');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(1);
        });

        it('rejects users without permission', async () => {
            const eleitorToken = generateAccessToken({
                sub: 'user-2',
                codigo: '2026002',
                perfil: 'ELEITOR',
                purpose: 'ACCESS',
            });

            const response = await request(app)
                .post(`/api/v1/elections/${electionId}/eligible-voters/import-csv`)
                .set('Authorization', `Bearer ${eleitorToken}`)
                .set('Content-Type', 'text/csv')
                .send('codigo\n2026001');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_FORBIDDEN');
        });
    });
});