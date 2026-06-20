import type { LoginResult, SessionUser } from '@/types/auth';

export type UserRole = SessionUser['perfil'];
export type BackofficeRole = Exclude<UserRole, 'ELEITOR' | 'CANDIDATO'>;

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
        description: 'Indicadores, ações rápidas e gestão geral do sistema.',
      },
      {
        segment: 'candidatos',
        label: 'Candidatos',
        title: 'Gestão de Candidatos',
        description: 'Registo, validação e ciclo de vida dos candidatos.',
      },
      {
        segment: 'cargos',
        label: 'Cargos',
        title: 'Gestão de Cargos',
        description: 'Registo e visualização de cargos eleitorais.',
      },
      {
        segment: 'eleicoes',
        label: 'Eleições',
        title: 'Consulta de Eleições',
        description: 'Consulta administrativa das eleições registadas.',
      },
      {
        segment: 'estudantes',
        label: 'Eleitores',
        title: 'Gestão de Eleitores',
        description: 'Listagem, elegibilidade e importação de eleitores.',
      },
      {
        segment: 'resultados',
        label: 'Resultados',
        title: 'Resultados',
        description: 'Consulta administrativa dos resultados eleitorais.',
      },
      {
        segment: 'faculdades',
        label: 'Faculdades',
        title: 'Faculdades',
        description: 'Registo de faculdades usadas nos estudantes e eleições.',
      },
      {
        segment: 'comissao',
        label: 'Comissão',
        title: 'Gestão da Comissão',
        description: 'Gestão de membros e permissões da comissão eleitoral.',
      },
      {
        segment: 'auditoria',
        label: 'Auditoria',
        title: 'Auditoria',
        description: 'Consulta de trilhas, eventos e conformidade.',
      },
      {
        segment: 'configuracoes',
        label: 'Configurações',
        title: 'Configurações',
        description: 'Parâmetros institucionais e políticas do sistema.',
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
        description: 'Eleições activas, progresso e pendências.',
      },
      {
        segment: 'eleicoes',
        label: 'Eleições',
        title: 'Gestão de Eleições',
        description: 'Criação, parametrização e acompanhamento de eleições.',
      },
      {
        segment: 'resultados',
        label: 'Resultados',
        title: 'Resultados',
        description: 'Publicação e auditoria de resultados por eleição.',
      },
      {
        segment: 'candidatos',
        label: 'Candidatos',
        title: 'Candidaturas',
        description: 'Aprovação, rejeição e acompanhamento de candidaturas.',
      },
      {
        segment: 'estudantes',
        label: 'Eleitores',
        title: 'Eleitores Elegíveis',
        description: 'Gestão de eleitores elegíveis e importação CSV.',
      },
      {
        segment: 'configuracoes',
        label: 'Configurações',
        title: 'Configurações da Comissão',
        description: 'Regras operacionais e parâmetros de votação.',
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
        description: 'Visão consolidada de conformidade e risco.',
      },
      {
        segment: 'auditoria',
        label: 'Auditoria',
        title: 'Registos de Auditoria',
        description: 'Consultas de eventos e rastreabilidade do sistema.',
      },
      {
        segment: 'resultados',
        label: 'Resultados',
        title: 'Verificação de Resultados',
        description: 'Inspeção de resultados e consistência dos votos.',
      },
      {
        segment: 'relatorios',
        label: 'Relatórios',
        title: 'Relatórios',
        description: 'Emissão e exportação de relatórios de fiscalização.',
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
  CANDIDATO: ELECTOR_HOME_PATH,
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
