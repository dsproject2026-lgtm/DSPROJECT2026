import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  Megaphone,
  Settings,
  Shield,
  UserSquare2,
  Users,
} from 'lucide-react';

import type { BackofficeNavItem } from '@/config/role-navigation';
import { Button } from '@/components/ui';
import { sessionStorageService } from '@/lib/storage/session-storage';

interface BackofficeLayoutProps {
  basePath: string;
  identityLabel: string;
  identityCampus: string;
  navItems: BackofficeNavItem[];
}

type SidebarSubItem = {
  label: string;
  path: string;
};

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
  const iconClass = 'h-4 w-4';

  if (segment === 'dashboard') return <BarChart3 className={iconClass} />;
  if (segment === 'eleicoes') return <ClipboardList className={iconClass} />;
  if (segment === 'resultados') return <FileCheck2 className={iconClass} />;
  if (segment === 'candidatos') return <Megaphone className={iconClass} />;
  if (segment === 'estudantes') return <GraduationCap className={iconClass} />;
  if (segment === 'comissao') return <Users className={iconClass} />;
  if (segment === 'auditoria') return <Shield className={iconClass} />;
  if (segment === 'relatorios') return <FileSpreadsheet className={iconClass} />;
  if (segment === 'configuracoes') return <Settings className={iconClass} />;

  return <UserSquare2 className={iconClass} />;
}

function getSidebarSubItems(basePath: string, segment: string): SidebarSubItem[] {
  if (segment === 'candidatos') {
    return [
      { label: 'Registrar', path: `/${basePath}/candidatos/registrar` },
      { label: 'Visualizar', path: `/${basePath}/candidatos/visualizar` },
    ];
  }

  if (segment === 'estudantes') {
    return [
      { label: 'Registrar', path: `/${basePath}/estudantes/registrar` },
      { label: 'Visualizar', path: `/${basePath}/estudantes/visualizar` },
    ];
  }

  if (segment === 'eleicoes') {
    return [
      { label: 'Registrar', path: `/${basePath}/eleicoes/registrar` },
      { label: 'Visualizar', path: `/${basePath}/eleicoes/visualizar` },
    ];
  }

  return [];
}

function BackofficeRouteSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="skeleton-flicker h-8 w-72 rounded-md" />
        <div className="skeleton-flicker h-4 w-48 rounded-md" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="skeleton-flicker h-28 rounded-md" />
        <div className="skeleton-flicker h-28 rounded-md" />
        <div className="skeleton-flicker h-28 rounded-md" />
        <div className="skeleton-flicker h-28 rounded-md" />
      </div>
      <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
        <div className="skeleton-flicker mb-3 h-6 w-56 rounded-md" />
        <div className="space-y-2">
          <div className="skeleton-flicker h-10 w-full rounded-md" />
          <div className="skeleton-flicker h-10 w-full rounded-md" />
          <div className="skeleton-flicker h-10 w-full rounded-md" />
          <div className="skeleton-flicker h-10 w-full rounded-md" />
          <div className="skeleton-flicker h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isRouteLoading, setIsRouteLoading] = useState(true);

  const activeItem = useMemo(() => {
    const item = navItems.find((entry) =>
      location.pathname.startsWith(`/${basePath}/${entry.segment}`),
    );

    return item ?? navItems[0];
  }, [basePath, location.pathname, navItems]);

  const userName = session?.user.nome ?? 'Utilizador';
  const userInitials = getInitials(userName);

  const toggleSubmenu = (segment: string) => {
    setExpandedMenus((current) => ({ ...current, [segment]: !current[segment] }));
  };

  const handleLogout = () => {
    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setIsRouteLoading(true);
    const timeoutId = window.setTimeout(() => {
      setIsRouteLoading(false);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f172a]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-[248px] flex-col overflow-hidden border-r border-[#d7deea] bg-[#eef2f7] lg:flex">
        <div className="border-b border-[#d7deea] px-5 py-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="SIVO-UP" className="h-8 w-8" />
            <p className="text-[28px] font-bold leading-none tracking-[-0.01em] text-[#0b2a12]">SIVO-UP</p>
          </div>
          <p className="mt-6 text-[18px] font-semibold leading-[1.2] text-[#0f2c12]">{identityLabel}</p>
          <p className="mt-1 text-[13px] text-[#5f7493]">{identityCampus}</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const subItems = getSidebarSubItems(basePath, item.segment);
            const itemPath = `/${basePath}/${item.segment}`;
            const itemActive = location.pathname.startsWith(itemPath);
            const shouldExpand = expandedMenus[item.segment] || subItems.some((subItem) => location.pathname.startsWith(subItem.path));

            if (subItems.length === 0) {
              return (
                <NavLink
                  key={item.segment}
                  to={itemPath}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition ${
                      isActive
                        ? 'bg-white text-[#0e4f9c] shadow-[inset_3px_0_0_#0ea5e9]'
                        : 'text-[#334155] hover:bg-[#e8edf5]'
                    }`
                  }
                >
                  <SidebarIcon segment={item.segment} />
                  {item.label}
                </NavLink>
              );
            }

            return (
              <div key={item.segment} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.segment)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition ${
                    itemActive ? 'bg-white text-[#0e4f9c] shadow-[inset_3px_0_0_#0ea5e9]' : 'text-[#334155] hover:bg-[#e8edf5]'
                  }`}
                >
                  <SidebarIcon segment={item.segment} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {shouldExpand ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {shouldExpand ? (
                  <div className="ml-8 space-y-1">
                    {subItems.map((subItem) => {
                      const subActive = location.pathname.startsWith(subItem.path);
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={`block rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                            subActive ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'text-[#475569] hover:bg-[#e8edf5]'
                          }`}
                        >
                          {subItem.label}
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-[#d7deea] px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-[12px] font-semibold text-[#1d4ed8]">
                {userInitials}
              </div>
              <p className="truncate text-[13px] font-semibold text-[#0f172a]">{userName}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sair"
              onClick={handleLogout}
              className="h-8 w-8 rounded-md text-[#64748b] hover:bg-[#e8edf5]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[248px]">
        <header className="fixed inset-x-0 top-0 z-30 border-b border-[#d7deea] bg-white px-4 py-4 md:px-10 lg:left-[248px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="hidden text-xs uppercase tracking-[0.16em] text-[#94a3b8] md:block">
                {activeItem.title}
              </p>
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

        <main className="flex-1 px-4 pb-6 pt-[84px] md:px-10 md:pb-8 md:pt-[92px]">
          <div className="mx-auto w-full max-w-6xl">
            {isRouteLoading ? <BackofficeRouteSkeleton /> : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
