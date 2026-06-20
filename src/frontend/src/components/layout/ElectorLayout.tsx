import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@heroui/react';

import { candidateApi } from '@/api/candidate.api';
import { authApi } from '@/api/auth.api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, PasswordInput, Spinner, toast } from '@/components/ui';
import { clearElectorVoteReceipt, getElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

function ElectorNavIcon({ type }: { type: 'votar' | 'confirmacao' | 'resultados' | 'candidatura' }) {
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

  if (type === 'candidatura') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
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

function DesktopNavLink({
  to,
  label,
  type,
}: {
  to: string;
  label: string;
  type: 'votar' | 'confirmacao' | 'resultados' | 'candidatura';
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
          isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]'
        }`
      }
    >
      <ElectorNavIcon type={type} />
      {label}
    </NavLink>
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
  const [hasCandidacy, setHasCandidacy] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const hasMountedRef = useRef(false);
  const avatarLabel = session?.user.nome ? `Perfil de ${session.user.nome}` : 'Perfil';
  const userName = session?.user.nome ?? 'Eleitor';
  const userEmail = session?.user.email ?? 'sem-e-mail@up.ac.mz';

  useEffect(() => {
    let isActive = true;

    const loadCandidacyAccess = async () => {
      if (session?.user.perfil !== 'CANDIDATO') {
        setHasCandidacy(false);
        return;
      }

      try {
        const response = await candidateApi.listMine();
        if (!isActive) return;
        setHasCandidacy(response.count > 0);
      } catch {
        if (isActive) setHasCandidacy(false);
      }
    };

    void loadCandidacyAccess();

    return () => {
      isActive = false;
    };
  }, [session?.user.perfil]);

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
      toast.danger('A confirmação da nova palavra-passe não corresponde.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword(passwordForm.senhaAtual, passwordForm.novaSenha);
      toast.success('Palavra-passe alterada com sucesso.');
      setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setIsPasswordModalOpen(false);
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : 'Não foi possível alterar a palavra-passe.';
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e3e6eb] bg-white lg:left-64">
        <div className="mx-auto flex min-h-[76px] w-full max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10" />
            <p className="text-xl font-bold tracking-[-0.01em] capitalize text-[#101521]">SIVO-UP</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Portal do eleitor</p>
            <p className="text-lg font-semibold text-[#0f172a]">{userName}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={avatarLabel}
                className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1A56DB] text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8ee6] focus-visible:ring-offset-2"
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
                Alterar palavra-passe
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

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-[#e3e6eb] bg-white px-4 py-5 lg:block">
        <div className="flex items-center gap-3">
          <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10" />
          <p className="text-xl font-bold tracking-[-0.01em] text-[#101521]">SIVO-UP</p>
        </div>
        <nav className="mt-8 space-y-2">
          <DesktopNavLink to="/eleitor/dashboard" label="Votar" type="votar" />
          <DesktopNavLink to="/eleitor/confirmacao" label="Confirmação" type="confirmacao" />
          <DesktopNavLink to={resultsNavPath} label="Resultados" type="resultados" />
          {hasCandidacy ? <DesktopNavLink to="/eleitor/candidatura" label="Candidatura" type="candidatura" /> : null}
        </nav>
        <div className="absolute inset-x-4 bottom-5 rounded-sm border border-[#e2e8f0] bg-[#f8fafc] p-3">
          <p className="truncate text-sm font-semibold text-[#0f172a]">{userName}</p>
          <p className="truncate text-xs text-[#64748b]">{userEmail}</p>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-xl px-4 pb-[96px] pt-[98px] sm:px-6 sm:pt-[102px] lg:ml-64 lg:max-w-none lg:px-8 lg:pb-10">
        {isRouteLoading ? (
          getElectorRouteSkeleton(location.pathname)
        ) : (
          <div key={`${location.pathname}${location.search}`} className="elector-page-enter mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e6eb] bg-[#f6f6f7] lg:hidden">
        <div className={`mx-auto grid w-full max-w-xl ${hasCandidacy ? 'grid-cols-4 px-3' : 'grid-cols-3 px-6'} py-3`}>
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
          {hasCandidacy ? (
            <NavLink
              to="/eleitor/candidatura"
              className={({ isActive }) =>
                `justify-self-center rounded-lg px-3 py-2 flex flex-col items-center gap-1 transition capitalize ${
                  isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
                }`
              }
            >
              <ElectorNavIcon type="candidatura" />
              <span className="text-sm font-medium tracking-wide">Candidatura</span>
            </NavLink>
          ) : null}
        </div>
      </nav>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={changePassword}
            className="w-full max-w-sm rounded-md bg-white p-5 shadow-xl"
          >
            <h2 className="text-xl font-semibold text-[#0f172a]">Alterar palavra-passe</h2>
            <p className="mt-1 text-sm text-[#64748b]">Informe a palavra-passe actual e escolha uma nova palavra-passe.</p>

            <div className="mt-5 space-y-4">
              <PasswordInput
                value={passwordForm.senhaAtual}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, senhaAtual: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Palavra-passe actual"
                minLength={8}
                required
              />
              <PasswordInput
                value={passwordForm.novaSenha}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, novaSenha: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Nova palavra-passe"
                minLength={8}
                required
              />
              <PasswordInput
                value={passwordForm.confirmarSenha}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmarSenha: event.target.value }))
                }
                className="h-11 w-full rounded-sm border border-[#d1d9e6] px-3 text-sm outline-none focus:border-[#0b73c9]"
                placeholder="Confirmar nova palavra-passe"
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
