import { useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui';
import { clearElectorVoteReceipt, getElectorVoteReceipt } from '@/features/elector/lib/vote-receipt';
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
  const box = 'rounded bg-[#dddddf] elector-flicker';

  return (
    <div className="space-y-4 px-2 py-2">
      <div className={`h-5 w-32 ${box}`} />
      <div className={`h-8 w-64 ${box}`} />
      <div className="h-10 w-full rounded-xl bg-[#dfe1e4] elector-flicker" />

      <div className="space-y-3 pt-3">
        <div className={`h-40 w-full ${box}`} />
        <div className={`h-40 w-full ${box}`} />
      </div>
    </div>
  );
}

function ElectorDashboardSkeleton() {
  return (
    <div className="space-y-5 px-2 py-3">
      <div className="h-3 w-36 rounded bg-[#dddddf] elector-flicker" />
      <div className="h-9 w-64 rounded bg-[#dddddf] elector-flicker" />
      <div className="h-1 w-12 rounded bg-[#dddddf] elector-flicker" />
      <div className="h-10 w-full rounded-xl bg-[#dddddf] elector-flicker" />
      <div className="space-y-4 pt-2">
        <div className="h-64 w-full rounded bg-[#dddddf] elector-flicker" />
        <div className="h-64 w-full rounded bg-[#dddddf] elector-flicker" />
      </div>
    </div>
  );
}

function ElectorVotingSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <div className="h-[560px] w-full rounded-[24px] bg-[#dddddf] elector-flicker" />
      <div className="h-14 w-full rounded-2xl bg-[#dddddf] elector-flicker" />
    </div>
  );
}

function ElectorDetailsSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <div className="h-[520px] w-full rounded bg-[#dddddf] elector-flicker" />
      <div className="h-12 w-full rounded bg-[#dddddf] elector-flicker" />
    </div>
  );
}

function ElectorConfirmationSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <div className="h-[620px] w-full rounded-[28px] bg-[#dddddf] elector-flicker" />
      <div className="h-12 w-full rounded-2xl bg-[#dddddf] elector-flicker" />
    </div>
  );
}

function ElectorResultsSkeleton() {
  return (
    <div className="space-y-4 px-1 py-2">
      <div className="h-[560px] w-full rounded-[28px] bg-[#dddddf] elector-flicker" />
      <div className="h-40 w-full rounded-xl bg-[#dddddf] elector-flicker" />
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
  const hasMountedRef = useRef(false);
  const avatarLabel = session?.user.nome ? `Perfil de ${session.user.nome}` : 'Perfil';
  const userName = session?.user.nome ?? 'Eleitor';
  const userEmail = session?.user.email ?? 'sem-email@up.ac.mz';

  const handleLogout = () => {
    clearElectorVoteReceipt();
    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
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
    <div className="min-h-screen bg-bg">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e3e6eb] bg-white">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between px-4 py-4 sm:max-w-md">
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10" />
            <p className="text-[20px] font-bold tracking-[-0.01em] text-[#101521]">SIVO-UP</p>
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
              <DropdownMenuItem>
                <UserRound className="h-4 w-4 text-[#64748b]" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 text-[#64748b]" />
                Configuracoes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-sm px-2 pb-[96px] pt-[86px] sm:max-w-md sm:px-3 sm:pt-[90px]">
        {isRouteLoading ? (
          getElectorRouteSkeleton(location.pathname)
        ) : (
          <div key={`${location.pathname}${location.search}`} className="elector-page-enter">
            <Outlet />
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e3e6eb] bg-[#f6f6f7]">
        <div className="mx-auto grid w-full max-w-sm grid-cols-3 px-6 py-3 sm:max-w-md">
          <NavLink
            to="/eleitor/dashboard"
            className={({ isActive }) =>
              `justify-self-center rounded-xl px-3 py-2 flex flex-col items-center gap-1 transition ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="votar" />
            <span className="text-[10px] font-semibold tracking-[0.14em] uppercase">Vote</span>
          </NavLink>
          <NavLink
            to="/eleitor/confirmacao"
            className={({ isActive }) =>
              `justify-self-center rounded-xl px-3 py-2 flex flex-col items-center gap-1 transition ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="confirmacao" />
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">Confirmacao</span>
          </NavLink>
          <NavLink
            to={resultsNavPath}
            className={({ isActive }) =>
              `justify-self-center rounded-xl px-3 py-2 flex flex-col items-center gap-1 transition ${
                isActive ? 'bg-[#e7eff9] text-[#1f8ee6]' : 'text-[#8ea0b9]'
              }`
            }
          >
            <ElectorNavIcon type="resultados" />
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">Results</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
