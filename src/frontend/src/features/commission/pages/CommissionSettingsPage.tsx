import { useState } from 'react';

export function CommissionSettingsPage() {
  const [settings, setSettings] = useState({
    autoOpenElection: true,
    autoCloseElection: true,
    allowImmediateResults: false,
    requireEligibilityValidation: true,
  });
  const [saved, setSaved] = useState(false);

  function toggleSetting(key: keyof typeof settings) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  }

  function saveSettings() {
    setSaved(true);
  }

  const items: Array<{ key: keyof typeof settings; title: string; description: string }> = [
    {
      key: 'autoOpenElection',
      title: 'Abertura automática das eleições',
      description: 'Inicia a votação automaticamente na data e hora programadas.',
    },
    {
      key: 'autoCloseElection',
      title: 'Encerramento automático das eleições',
      description: 'Bloqueia submissões depois do término do período oficial.',
    },
    {
      key: 'allowImmediateResults',
      title: 'Publicação imediata dos resultados',
      description: 'Permite disponibilizar resultados assim que a eleição encerrar.',
    },
    {
      key: 'requireEligibilityValidation',
      title: 'Exigir validação de elegibilidade',
      description: 'Só estudantes válidos podem aparecer como aptos para votar.',
    },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-ui-2xl font-semibold leading-tight tracking-[-0.01em] text-[#0f172a]">
            Configurações da Comissão
          </h1>
          <p className="text-ui-sm text-[#475569]">
            Preferências visuais e operacionais do módulo da comissão.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white transition hover:bg-[#1647C0]"
          onClick={saveSettings}
        >
          Guardar Alterações
        </button>
      </header>

      {saved ? (
        <div className="rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]">
          Configurações guardadas com sucesso.
        </div>
      ) : null}

      <div className="rounded-sm border border-[#e2e8f0] bg-white shadow-none">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[20px] font-semibold text-[#0f2c12]">Políticas do Módulo</h2>
        </div>
        <div className="space-y-4 p-5">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#e2e8f0] px-4 py-4"
            >
              <div className="max-w-[760px]">
                <p className="text-base font-semibold text-[#0f172a]">{item.title}</p>
                <p className="mt-1 text-sm text-[#64748b]">{item.description}</p>
              </div>

              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`relative h-7 w-12 rounded-full transition ${settings[item.key] ? 'bg-[#fbbf24]' : 'bg-[#cbd5e1]'}`}
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
