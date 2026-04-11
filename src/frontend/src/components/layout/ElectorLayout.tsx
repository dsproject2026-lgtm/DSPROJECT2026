import { NavLink, Outlet } from 'react-router-dom';

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

export function ElectorLayout() {
  const session = sessionStorageService.getSession();
  const avatarLabel = session?.user.nome ? `Perfil de ${session.user.nome}` : 'Perfil';

  return (
    <div className="min-h-screen bg-bg">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e3e6eb] bg-white">
        <div className="mx-auto flex w-full max-w-sm items-center justify-between px-4 py-4 sm:max-w-md">
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10" />
            <p className="text-[20px] font-bold tracking-[-0.01em] text-[#101521]">SIVO-UP</p>
          </div>

          <button
            type="button"
            aria-label={avatarLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f8f94] text-white"
          >
            <span className="text-sm leading-none">👤</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-sm px-2 pb-[96px] pt-[86px] sm:max-w-md sm:px-3 sm:pt-[90px]">
        <Outlet />
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
            to="/eleitor/resultados"
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
