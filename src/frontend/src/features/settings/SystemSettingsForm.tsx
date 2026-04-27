import { useEffect, useState } from 'react';

import { settingsApi } from '@/api/settings.api';
import { Spinner, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import type { SystemSettings } from '@/types/settings';

const FALLBACK_SETTINGS: SystemSettings = {
  autoCloseElection: true,
  allowImmediateResults: true,
  requireEligibilityValidation: true,
  maintenanceMode: false,
  institutionName: 'SIVO-UP',
};

const BOOLEAN_ITEMS: Array<{
  key: keyof Omit<SystemSettings, 'institutionName'>;
  title: string;
  description: string;
}> = [
  {
    key: 'autoCloseElection',
    title: 'Apuramento automático',
    description: 'Conclui automaticamente eleições abertas quando o período de votação termina.',
  },
  {
    key: 'allowImmediateResults',
    title: 'Resultados em tempo real',
    description: 'Permite consultar resultados durante a votação e atualizar em tempo real.',
  },
  {
    key: 'requireEligibilityValidation',
    title: 'Exigir elegibilidade',
    description: 'Mantém a validação de elegibilidade antes de permitir o voto.',
  },
  {
    key: 'maintenanceMode',
    title: 'Modo de manutenção',
    description: 'Marca o sistema como em manutenção para operação administrativa.',
  },
];

export function SystemSettingsForm({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [settings, setSettings] = useState<SystemSettings>(FALLBACK_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await settingsApi.getSystemSettings();
        if (!isActive) return;
        setSettings(response.settings);
        setUpdatedAt(response.updatedAt);
      } catch (cause) {
        if (!isActive) return;
        const message =
          cause instanceof ApiError ? cause.message : 'Não foi possível carregar configurações.';
        toast.danger(message);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await settingsApi.updateSystemSettings(settings);
      setSettings(response.settings);
      setUpdatedAt(response.updatedAt);
      toast.success('Configurações guardadas com sucesso.');
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível guardar configurações.';
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof Omit<SystemSettings, 'institutionName'>) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
            {title}
          </h1>
          <p className="text-ui-sm text-[#475569]">{description}</p>
          {updatedAt ? (
            <p className="mt-1 text-xs text-[#64748b]">
              Última atualização: {new Date(updatedAt).toLocaleString('pt-PT')}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0] disabled:opacity-60 sm:w-auto"
          onClick={() => void saveSettings()}
          disabled={isSaving}
        >
          {isSaving ? <Spinner size="sm" className="mr-2 text-white" /> : null}
          Guardar alterações
        </button>
      </header>

      <div className="rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <div className="border-b border-[#e2e8f0] px-4 py-4 sm:px-5">
          <h2 className="text-[20px] font-semibold text-[#0f172a]">Políticas do sistema</h2>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          {BOOLEAN_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-start justify-between gap-4 rounded-sm border border-[#e2e8f0] px-4 py-4 sm:flex-row sm:items-center"
            >
              <div className="max-w-[760px]">
                <p className="text-base font-semibold text-[#0f172a]">{item.title}</p>
                <p className="mt-1 text-sm text-[#64748b]">{item.description}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`relative h-7 w-12 rounded-full transition ${settings[item.key] ? 'bg-[#1A56DB]' : 'bg-[#cbd5e1]'}`}
                aria-label={item.title}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings[item.key] ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
