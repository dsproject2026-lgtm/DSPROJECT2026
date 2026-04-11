import { RoleSectionPage } from '@/components/common/RoleSectionPage';

export function FiscalDashboardPage() {
  return (
    <RoleSectionPage
      title="Painel de Fiscalização"
      description="Base da tela principal do fiscal para monitoramento de conformidade eleitoral."
    />
  );
}

export function FiscalAuditPage() {
  return (
    <RoleSectionPage
      title="Registos de Auditoria"
      description="Base da tela para consulta de logs, trilhas de evento e validação de ações."
    />
  );
}

export function FiscalResultsPage() {
  return (
    <RoleSectionPage
      title="Verificação de Resultados"
      description="Base da tela para conferência e validação de resultados eleitorais."
    />
  );
}

export function FiscalReportsPage() {
  return (
    <RoleSectionPage
      title="Relatórios de Fiscalização"
      description="Base da tela para geração e exportação de relatórios de auditoria."
    />
  );
}

