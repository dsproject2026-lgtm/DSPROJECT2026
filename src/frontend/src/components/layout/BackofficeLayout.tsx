import { useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import type { BackofficeNavItem } from '@/config/role-navigation';
import { Button } from '@/components/ui';
import { sessionStorageService } from '@/lib/storage/session-storage';

interface BackofficeLayoutProps {
  basePath: string;
  identityLabel: string;
  identityCampus: string;
  navItems: BackofficeNavItem[];
}

function getInitials(name: string | undefined) {
  if (!name) {
    return 'US';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'US';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SidebarIcon({ segment }: { segment: string }) {
  if (segment === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 4h7m-7 3h7" />
      </svg>
    );
  }

  if (segment === 'configuracoes') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5z" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M4 19h16M5.5 19V8.5L12 4l6.5 4.5V19M9 19v-5h6v5" />
    </svg>
  );
}

export function BackofficeLayout({
  basePath,
  identityLabel,
  identityCampus,
  navItems,
}: BackofficeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = sessionStorageService.getSession();

  const activeItem = useMemo(() => {
    const item = navItems.find((entry) =>
      location.pathname.startsWith(`/${basePath}/${entry.segment}`),
    );

    return item ?? navItems[0];
  }, [basePath, location.pathname, navItems]);

  const userName = session?.user.nome ?? 'Utilizador';

  const handleLogout = () => {
    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f172a] lg:flex">
      <aside className="hidden min-h-screen w-[260px] flex-col border-r border-[#d7deea] bg-[#eef2f7] lg:flex">
        <div className="border-b border-[#d7deea] px-6 py-8">
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-9 w-9" />
            <p className="text-[30px] font-bold leading-none tracking-[-0.01em] text-[#0b2a12]">SIVO-UP</p>
          </div>
          <p className="mt-8 text-[24px] font-semibold leading-[1.12] text-[#0f2c12]">{identityLabel}</p>
          <p className="mt-2 text-[15px] text-[#5f7493]">{identityCampus}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.segment}
              to={`/${basePath}/${item.segment}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-3 text-[16px] font-medium transition ${
                  isActive
                    ? 'bg-white text-[#0e4f9c] shadow-[inset_3px_0_0_#0ea5e9]'
                    : 'text-[#334155] hover:bg-[#e8edf5]'
                }`
              }
            >
              <SidebarIcon segment={item.segment} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#d7deea] px-6 py-4">
          <p className="text-sm font-semibold text-[#0f172a]">{userName}</p>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={handleLogout}
            className="mt-2 h-8 w-8 rounded-md text-[#64748b] hover:bg-[#e8edf5]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b border-[#d7deea] bg-white px-4 py-4 md:px-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="hidden text-xs uppercase tracking-[0.16em] text-[#94a3b8] md:block">
                {activeItem.title}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-semibold text-[#1d4ed8]">
              {getInitials(userName)}
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.segment}
                to={`/${basePath}/${item.segment}`}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                    isActive ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#e2e8f0] text-[#334155]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
