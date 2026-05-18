import { auditRepository } from '../repositories/audit.repository.js';

class AuditService {
  async listLogs(filters?: { electionId?: string | undefined }) {
    const logs = await auditRepository.findAll(filters);

    return {
      message: 'Registos de auditoria listados com sucesso.',
      data: logs,
      count: logs.length,
    };
  }

  async record(data: {
    utilizadorId?: string | null | undefined;
    accao: string;
    entidade?: string | null | undefined;
    entidadeId?: string | null | undefined;
    ip?: string | null | undefined;
  }) {
    await auditRepository.create(data);
  }
}

export const auditService = new AuditService();
