import { useEffect, useState } from 'react';
import { Mail, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';

import { authApi } from '@/api/auth.api';
import { Chip, Spinner, toast } from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';
import type { SessionUser } from '@/types/auth';

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatProfile(value: string) {
  return value.replaceAll('_', ' ');
}

export function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(
    sessionStorageService.getSession()?.user ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProfile = async ({ showToast = false } = {}) => {
    try {
      setIsRefreshing(true);
      const currentUser = await authApi.me();
      setUser(currentUser);

      const session = sessionStorageService.getSession();
      if (session) {
        sessionStorageService.saveSession({ ...session, user: currentUser });
      }

      if (showToast) {
        toast.success('Perfil atualizado.');
      }
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : 'Não foi possível carregar o perfil.';
      toast.danger(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  if (isLoading && !user) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-ui-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            Conta
          </p>
          <h1 className="mt-1 text-ui-2xl font-semibold tracking-[-0.01em] text-[#0f172a]">
            Meu perfil
          </h1>
          <p className="text-ui-sm text-[#64748b]">
            Dados sincronizados com o backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadProfile({ showToast: true })}
          disabled={isRefreshing}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#d1d5db] bg-white px-4 text-ui-sm font-semibold text-[#111827] transition hover:bg-[#f8fafc] disabled:opacity-60 sm:w-auto"
        >
          {isRefreshing ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2e8f0] text-xl font-bold text-[#111827]">
              {user?.nome
                ?.trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase() ?? 'US'}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[#0f172a]">
                {user?.nome ?? 'Utilizador'}
              </h2>
              <p className="truncate text-sm text-[#64748b]">{user?.codigo ?? '-'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Chip color={user?.activo ? 'success' : 'danger'} variant="soft" size="sm">
              {user?.activo ? 'ATIVO' : 'INATIVO'}
            </Chip>
            <Chip color="primary" variant="soft" size="sm">
              {formatProfile(user?.perfil ?? 'UTILIZADOR')}
            </Chip>
          </div>
        </article>

        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#0f172a]">Informações da conta</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-[#e5e7eb] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#64748b]">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="mt-2 break-words text-sm text-[#0f172a]">{user?.email ?? '-'}</p>
            </div>
            <div className="rounded-md border border-[#e5e7eb] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#64748b]">
                <ShieldCheck className="h-4 w-4" />
                Perfil
              </div>
              <p className="mt-2 text-sm text-[#0f172a]">
                {formatProfile(user?.perfil ?? 'UTILIZADOR')}
              </p>
            </div>
            <div className="rounded-md border border-[#e5e7eb] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#64748b]">
                <UserRound className="h-4 w-4" />
                Código
              </div>
              <p className="mt-2 text-sm text-[#0f172a]">{user?.codigo ?? '-'}</p>
            </div>
            <div className="rounded-md border border-[#e5e7eb] p-4">
              <p className="text-sm font-semibold text-[#64748b]">Criado em</p>
              <p className="mt-2 text-sm text-[#0f172a]">{formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
