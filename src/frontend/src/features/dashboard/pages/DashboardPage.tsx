import { PageTitle } from '@/components/common/PageTitle';
import { Chip } from '@/components/ui';
import { sessionStorageService } from '@/lib/storage/session-storage';

export function DashboardPage() {
  const session = sessionStorageService.getSession();

  return (
    <div>
      <PageTitle
        title="Dashboard"
        subtitle="Visão inicial do sistema com sessão autenticada e atalhos para os módulos."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-bg-subtle p-4">
          <p className="text-sm text-text-secondary">Utilizador</p>
          <p className="mt-1 font-semibold text-text-primary">{session?.user.nome ?? '-'}</p>
          <Chip className="mt-3" color="success" size="sm" variant="soft">
            {session?.user.perfil ?? 'SEM PERFIL'}
          </Chip>
        </div>

        <div className="rounded-lg border border-border bg-bg-subtle p-4">
          <p className="text-sm text-text-secondary">Código</p>
          <p className="mt-1 font-semibold text-text-primary">{session?.user.codigo ?? '-'}</p>
        </div>

        <div className="rounded-lg border border-border bg-bg-subtle p-4">
          <p className="text-sm text-text-secondary">Sessão</p>
          <p className="mt-1 font-semibold text-text-primary">
            {session?.accessToken ? 'Ativa' : 'Não autenticada'}
          </p>
        </div>
      </div>
    </div>
  );
}
