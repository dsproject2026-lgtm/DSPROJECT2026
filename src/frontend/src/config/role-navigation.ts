import type { LoginResult, SessionUser } from '@/types/auth';

export type UserRole = SessionUser['perfil'];
export type BackofficeRole = Exclude<UserRole, 'ELEITOR'>;

export interface BackofficeNavItem {
  segment: string;
  label: string;
  title: string;
  description: string;
}

export interface BackofficeRoleConfig {
  role: BackofficeRole;
  basePath: 'admin' | 'comissao' | 'fiscal';
  identityLabel: string;
  identityCampus: string;
  navItems: BackofficeNavItem[];
}

export const BACKOFFICE_CONFIGS: Record<BackofficeRole, BackofficeRoleConfig> = {
  ADMIN: {
    role: 'ADMIN',
    basePath: 'admin',
    identityLabel: 'Administrador AEUP',
    identityCampus: 'UP-Maputo',
    navItems: [
      {
        segment: 'dashboard',
        label: 'Visão Geral',
        title: 'Painel Administrativo',
        description: 'Base pronta para indicadores, ações rápidas e gestão geral do sistema.',
      },
      {
        segment: 'candidatos',
        label: 'Candidatos',
        title: 'Gestão de Candidatos',
        description: 'Base pronta para cadastro, validação e ciclo de vida dos candidatos.',
      },
      {
        segment: 'cargos',
        label: 'Cargos',
        title: 'Gestão de Cargos',
        description: 'Base pronta para registo e visualização de cargos eleitorais.',
      },
      {
        segment: 'estudantes',
        label: 'Estudantes',
        title: 'Gestão de Estudantes',
        description: 'Base pronta para listagem, elegibilidade e importação de estudantes.',
      },
      {
        segment: 'comissao',
        label: 'Comissão',
        title: 'Gestão da Comissão',
        description: 'Base pronta para gerir membros e permissões da comissão eleitoral.',
      },
      {
        segment: 'auditoria',
        label: 'Auditoria',
        title: 'Auditoria',
        description: 'Base pronta para consulta de trilhas, eventos e conformidade.',
      },
      {
        segment: 'configuracoes',
        label: 'Configurações',
        title: 'Configurações',
        description: 'Base pronta para parâmetros institucionais e políticas do sistema.',
      },
    ],
  },
  GESTOR_ELEITORAL: {
    role: 'GESTOR_ELEITORAL',
    basePath: 'comissao',
    identityLabel: 'Comissão AEUP',
    identityCampus: 'UP-Maputo',
    navItems: [
      {
        segment: 'dashboard',
        label: 'Visão Geral',
        title: 'Painel da Comissão Eleitoral',
        description: 'Base pronta para monitorar eleições ativas, progresso e pendências.',
      },
      {
        segment: 'eleicoes',
        label: 'Eleições',
        title: 'Gestão de Eleições',
        description: 'Base pronta para criar, configurar e acompanhar eleições.',
      },
      {
        segment: 'resultados',
        label: 'Resultados',
        title: 'Resultados',
        description: 'Base pronta para publicar e auditar resultados por eleição.',
      },
      {
        segment: 'candidatos',
        label: 'Candidatos',
        title: 'Candidaturas',
        description: 'Base pronta para aprovação, rejeição e acompanhamento de candidaturas.',
      },
      {
        segment: 'estudantes',
        label: 'Estudantes',
        title: 'Eleitores Elegíveis',
        description: 'Base pronta para gerir eleitores elegíveis e importação CSV.',
      },
      {
        segment: 'configuracoes',
        label: 'Configurações',
        title: 'Configurações da Comissão',
        description: 'Base pronta para regras operacionais e parâmetros de votação.',
      },
    ],
  },
  AUDITOR: {
    role: 'AUDITOR',
    basePath: 'fiscal',
    identityLabel: 'Fiscal Eleitoral',
    identityCampus: 'UP-Maputo',
    navItems: [
      {
        segment: 'dashboard',
        label: 'Visão Geral',
        title: 'Painel de Fiscalização',
        description: 'Base pronta para visão consolidada de conformidade e risco.',
      },
      {
        segment: 'auditoria',
        label: 'Auditoria',
        title: 'Registos de Auditoria',
        description: 'Base pronta para consultas de eventos e rastreabilidade do sistema.',
      },
      {
        segment: 'resultados',
        label: 'Resultados',
        title: 'Verificação de Resultados',
        description: 'Base pronta para inspeção de resultados e consistência dos votos.',
      },
      {
        segment: 'relatorios',
        label: 'Relatórios',
        title: 'Relatórios',
        description: 'Base pronta para emissão e exportação de relatórios de fiscalização.',
      },
    ],
  },
};

export const ELECTOR_BASE_PATH = '/eleitor';
export const ELECTOR_HOME_PATH = `${ELECTOR_BASE_PATH}/dashboard`;

const roleHomeRoute: Record<UserRole, string> = {
  ADMIN: `/${BACKOFFICE_CONFIGS.ADMIN.basePath}/${BACKOFFICE_CONFIGS.ADMIN.navItems[0].segment}`,
  GESTOR_ELEITORAL: `/${BACKOFFICE_CONFIGS.GESTOR_ELEITORAL.basePath}/${BACKOFFICE_CONFIGS.GESTOR_ELEITORAL.navItems[0].segment}`,
  AUDITOR: `/${BACKOFFICE_CONFIGS.AUDITOR.basePath}/${BACKOFFICE_CONFIGS.AUDITOR.navItems[0].segment}`,
  ELEITOR: ELECTOR_HOME_PATH,
};

export function getRoleHomeRoute(role: UserRole): string {
  return roleHomeRoute[role];
}

export function getRoleHomeRouteFromSession(session: LoginResult | null): string | null {
  if (!session?.user?.perfil) {
    return null;
  }

  return getRoleHomeRoute(session.user.perfil);
}
