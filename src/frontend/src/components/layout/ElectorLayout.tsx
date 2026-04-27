import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@heroui/react';

import { authApi } from '@/api/auth.api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Spinner, toast } from '@/components/ui';
import { clearElectorVoteReceipt, getElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

function ElectorNavIcon({ type }: { type: 'votar' | 'confirmacao' | 'resultados' }) {
  if (type === 'votar') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 12l7-7 7 7" />
        <path d="M7 11v8h10v-8" />
        <path d="M9.5 15h5" />
      </svg>
    );
  }

  if (type === 'confirmacao') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.5h10v17H7z" />
        <path d="M10 8h4M10 12h4M10 16h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.5 20h15" />
      <path d="M6.5 18V12h3v6m3 0V8h3v10m3 0v-5h2v5" />
    </svg>
  );
}

function ElectorPageSkeleton() {
  return (
    <div className="space-y-4 px-2 py-2">
      <Skeleton className="h-5 w-32 rounded-lg" />
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3 pt-3">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ElectorDashboardSkeleton() {
  return (
    <div className="space-y-5 px-2 py-3">
      <Skeleton className="h-3 w-36 rounded-lg" />
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-1 w-12 rounded-lg" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-4 pt-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ElectorVotingSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <Skeleton className="h-[560px] w-full rounded-[24px]" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

function ElectorDetailsSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <Skeleton className="h-[520px] w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

function ElectorConfirmationSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <Skeleton className="h-[620px] w-full rounded-[28px]" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}

function ElectorResultsSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <Skeleton className="h-[560px] w-full rounded-[28px]" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

function getElectorRouteSkeleton(pathname: string) {
  if (pathname.includes('/eleitor/elections/')) return <ElectorVotingSkeleton />;
  if (pathname.includes('/eleitor/election-details/')) return <ElectorDetailsSkeleton />;
  if (pathname.includes('/eleitor/confirmacao')) return <ElectorConfirmationSkeleton />;
  if (pathname.includes('/eleitor/resultados')) return <ElectorResultsSkeleton />;
  if (pathname.includes('/eleitor/dashboard')) return <ElectorDashboardSkeleton />;
  return <ElectorPageSkeleton />;
}

export function ElectorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = sessionStorageService.getSession();
  const voteReceipt = useMemo(() => getElectorVoteReceipt(), [location.pathname, location.search]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const hasMountedRef = useRef(false);
  const avatarLabel = session?.user.nome ? `Perfil de ${session.user.nome}` : 'Perfil';
  const userName = session?.user.nome ?? 'Eleitor';
  const userEmail = session?.user.email ?? 'sem-email@up.ac.mz';

  const handleLogout = async () => {
    const refreshToken = session?.refreshToken;

    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined);
    }

    clearElectorVoteReceipt();
    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      toast.danger('A confirmação da nova senha não corresponde.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword(passwordForm.senhaAtual, passwordForm.novaSenha);
      toast.success('Senha alterada com sucesso.');
      setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setIsPasswordModalOpen(false);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível alterar a senha.';
      toast.danger(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const resultsNavPath = voteReceipt
    ? `/eleitor/resultados?electionId=${encodeURIComponent(voteReceipt.electionId)}&candidateId=${encodeURIComponent(
        voteReceipt.candidateId,
      )}`
    : '/eleitor/resultados?electionId=1';

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setIsRouteLoading(true);
    const timerId = window.setTimeout(() => {
      setIsRouteLoading(false);
    }, 350);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-bg font-sans">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e3e6eb] bg-white">
        <div className="mx-auto flex min-h-[76px] w-full max-w-xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10" />
            <p className="text-xl font-bold tracking-[-0.01em] capitalize text-[#101521]">SIVO-UP</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={avatarLabel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f8f94] text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8ee6] focus-visible:ring-offset-2"
              >
                <span className="text-sm leading-none">👤</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="normal-case">
                <p className="text-sm font-semibold text-[#0f172a]">{userName}</p>
                <p className="text-xs font-normal text-[#64748b]">{userEmail}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/eleitor/perfil')}>
                <UserRound className="h-4 w-4 text-[#64748b]" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsPasswordModalOpen(true)}>
                <KeyRound className="h-4 w-4 text-[#64748b]" />
                Alterar senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void handleLogout()} className="text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-[96px] pt-[98px] sm:px-6 sm:pt-[102px]">
        {isRouteLoading ? (
          getElectorRouteSkeleton(location.pathname)
        ) : (
          <div key={`${location.pathname}${location.search}`} className="elector-page-enter">
            <Outlet />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e6eb] bg-[#f6f6f7]">
        <div className="mx-auto grid w-full max-w-xl grid-cols-3 px-6 py-3">
          <NavLink
            to="/eleitor/dashboard"
            className={({ isActive }) =>
              `justify-self-center rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition capitalize ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="votar" />
            <span className="text-sm font-medium tracking-wide">Votar</span>
          </NavLink>
          <NavLink
            to="/eleitor/confirmacao"
            className={({ isActive }) =>
              `justify-self-center rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition capitalize ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="confirmacao" />
            <span className="text-sm font-medium tracking-wide">Confirmação</span>
          </NavLink>
          <NavLink
            to={resultsNavPath}
            className={({ isActive }) =>
              `justify-self-center rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition capitalize ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="resultados" />
            <span className="text-sm font-medium tracking-wide">Resultados</span>
          </NavLink>
        </div>
      </nav>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={changePassword}
            className="w-full max-w-sm rounded-md bg-white p-5 shadow-xl"
          >
            <h2 className="text-xl font-semibold text-[#0f172a]">Alterar senha</h2>
            <p className="mt-1 text-sm text-[#64748b]">Informe a senha atual e escolha uma nova senha.</p>

            <div className="mt-5 space-y-4">
              <input
                type="password"
                value={passwordForm.senhaAtual}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, senhaAtual: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Senha atual"
                minLength={8}
                required
              />
              <input
                type="password"
                value={passwordForm.novaSenha}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, novaSenha: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Nova senha"
                minLength={8}
                required
              />
              <input
                type="password"
                value={passwordForm.confirmarSenha}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmarSenha: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Confirmar nova senha"
                minLength={8}
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="h-10 rounded-md border border-[#d1d9e6] px-4 text-sm font-medium text-[#475569]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex h-10 items-center rounded-md bg-[#1A56DB] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {isChangingPassword ? <Spinner size="sm" className="mr-2 text-white" /> : null}
                Guardar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
