import { authService } from './auth.service.js';
import { teamRepository } from '../repositories/team.repository.js';
import type { Perfil } from '../types/model.types.js';
import { AppError } from '../utils/app-error.js';

const TEAM_PROFILES = new Set<Perfil>(['GESTOR_ELEITORAL', 'AUDITOR']);

class TeamService {
  async listMembers() {
    const members = await teamRepository.findAll();

    return {
      message: 'Membros da equipa listados com sucesso.',
      data: members,
      count: members.length,
    };
  }

  async createMember(data: { nome: string; email: string; perfil: Perfil }) {
    if (!TEAM_PROFILES.has(data.perfil)) {
      throw new AppError(
        'O perfil da equipa deve ser Gestor Eleitoral ou Auditor.',
        400,
        'TEAM_PROFILE_INVALID',
      );
    }

    const existing = await teamRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Já existe um membro da equipa com este email.', 409, 'TEAM_EMAIL_ALREADY_EXISTS', {
        email: data.email,
      });
    }

    const codigo = await this.generateTeamCode();
    const user = await authService.createUser({
      nome: data.nome,
      email: data.email,
      codigo,
      perfil: data.perfil,
      activo: true,
      mustSetPassword: true,
    });

    const member = await teamRepository.create({
      utilizadorId: user.id,
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      codigo,
    });

    await authService.startFirstAccess({ codigo });

    return {
      message: 'Membro da equipa registado com sucesso. Foi enviado um email de primeiro acesso.',
      data: member,
    };
  }

  async updateStatus(id: string, activo: boolean) {
    const member = await teamRepository.updateStatus(id, activo);

    return {
      message: 'Estado do membro actualizado com sucesso.',
      data: member,
    };
  }

  private async generateTeamCode() {
    const year = new Date().getFullYear();
    const latest = await teamRepository.findLastCodeForYear(year);
    const latestSequence = latest?.codigo.split('.')[1] ?? '0000';
    const nextSequence = Number.parseInt(latestSequence, 10) + 1;

    return `02.${String(nextSequence).padStart(4, '0')}.${year}`;
  }
}

export const teamService = new TeamService();
