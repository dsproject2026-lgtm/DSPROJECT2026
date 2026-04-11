import { RoleSectionPage } from '@/components/common/RoleSectionPage';

export function CommissionDashboardPage() {
  return (
    <RoleSectionPage
      title="Painel da Comissão Eleitoral"
      description="Base da tela principal da comissão para métricas, calendário e ações operacionais."
    />
  );
}

export function CommissionElectionsPage() {
  return (
    <RoleSectionPage
      title="Gestão de Eleições"
      description="Base da tela para criação, edição e acompanhamento do ciclo de eleições."
    />
  );
}

export function CommissionResultsPage() {
  return (
    <RoleSectionPage
      title="Resultados"
      description="Base da tela para apuração, verificação e publicação dos resultados."
    />
  );
}

export function CommissionCandidatesPage() {
  return (
    <RoleSectionPage
      title="Candidaturas"
      description="Base da tela para avaliação, aprovação e acompanhamento de candidaturas."
    />
  );
}

export function CommissionStudentsPage() {
  return (
    <RoleSectionPage
      title="Eleitores Elegíveis"
      description="Base da tela para gerir elegibilidade e importação de eleitores."
    />
  );
}

export function CommissionSettingsPage() {
  return (
    <RoleSectionPage
      title="Configurações da Comissão"
      description="Base da tela para parâmetros e regras de execução eleitoral da comissão."
    />
  );
}

