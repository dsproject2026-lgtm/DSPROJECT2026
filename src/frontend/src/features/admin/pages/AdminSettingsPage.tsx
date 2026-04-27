import { SystemSettingsForm } from '@/features/settings/SystemSettingsForm';

export function AdminSettingsPage() {
  return (
    <SystemSettingsForm
      title="Configurações do Sistema"
      description="Defina parâmetros globais usados pelo backend e pelas áreas operacionais."
    />
  );
}
