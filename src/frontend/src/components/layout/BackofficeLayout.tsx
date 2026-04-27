import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  GraduationCap,
  Megaphone,
  PanelRightClose,
  Shield,
  UserSquare2,
  Users,
} from 'lucide-react';

import type { BackofficeNavItem } from '@/config/role-navigation';
import { UiPageSkeleton } from '@/components/ui';
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
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SidebarIcon({ segment }: { segment: string }) {
  const iconClass = 'h-[18px] w-[18px]';
  if (segment === 'dashboard') return <BarChart3 className={iconClass} />;
  if (segment === 'eleicoes') return <ClipboardList className={iconClass} />;
  if (segment === 'resultados') return <FileCheck2 className={iconClass} />;
  if (segment === 'candidatos') return <Megaphone className={iconClass} />;
  if (segment === 'cargos') return <BriefcaseBusiness className={iconClass} />;
  if (segment === 'estudantes') return <GraduationCap className={iconClass} />;
  if (segment === 'comissao') return <Users className={iconClass} />;
  if (segment === 'auditoria') return <Shield className={iconClass} />;
  if (segment === 'relatorios') return <FileSpreadsheet className={iconClass} />;
  return <UserSquare2 className={iconClass} />;
}

function getSidebarSubItems(basePath: string, segment: string): SidebarSubItem[] {
  if (segment === 'candidatos') {
    return [
      { label: 'Registar', path: `/${basePath}/candidatos/registrar` },
      { label: 'Visualizar', path: `/${basePath}/candidatos/visualizar` },
    ];
  }
  if (segment === 'estudantes') {
    return [
      { label: 'Registar', path: `/${basePath}/estudantes/registrar` },
      { label: 'Visualizar', path: `/${basePath}/estudantes/visualizar` },
    ];
  }
  if (segment === 'eleicoes') {
    return [
      { label: 'Registar', path: `/${basePath}/eleicoes/registrar` },
      { label: 'Visualizar', path: `/${basePath}/eleicoes/visualizar` },
    ];
  }
  if (segment === 'cargos') {
    return [
      { label: 'Registar', path: `/${basePath}/cargos/registrar` },
      { label: 'Visualizar', path: `/${basePath}/cargos/visualizar` },
    ];
  }
  return [];
}

function BackofficeRouteSkeleton() {
  return <UiPageSkeleton blocks={3} />;
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
  const [isRouteLoading, setIsRouteLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeItem = useMemo(() => {
    const item = navItems.find((entry) =>
      location.pathname.startsWith(`/${basePath}/${entry.segment}`),
    );
    return item ?? navItems[0];
  }, [basePath, location.pathname, navItems]);

  const activeSubItems = useMemo(
    () => getSidebarSubItems(basePath, activeItem.segment),
    [activeItem.segment, basePath],
  );

  const activeSubPath = useMemo(
    () =>
      activeSubItems.find((item) => location.pathname.startsWith(item.path))?.path ??
      activeSubItems[0]?.path ??
      '',
    [activeSubItems, location.pathname],
  );
  const showLayoutSubTabs = basePath !== 'comissao';

  const userName = session?.user.nome ?? 'Utilizador';
  const userInitials = getInitials(userName);

  const handleLogout = () => {
    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setIsRouteLoading(true);
    const timeoutId = window.setTimeout(() => setIsRouteLoading(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden h-screen border-r border-[#e5e7eb] bg-[#f3f4f6] transition-[width] duration-200 lg:block ${
          isSidebarCollapsed ? 'w-[86px]' : 'w-[286px]'
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className={`${isSidebarCollapsed ? 'px-0 py-2' : 'px-1 py-2'}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <img src="/images/logo.svg" alt="SIVO-UP" className="h-14 w-14 rounded-full border border-[#d1d5db] bg-white object-contain p-0.5" />
              {!isSidebarCollapsed ? <p className="text-ui-2xl font-bold tracking-[-0.02em] text-[#111827]">SIVO-UP</p> : null}
            </div>
            {!isSidebarCollapsed ? (
              <div className="mt-5">
                <p className="text-[15px] font-semibold leading-tight text-[#111827]">{identityLabel}</p>
                <p className="mt-1 text-[13px] text-[#6b7280]">{identityCampus}</p>
              </div>
            ) : null}
          </div>

          {!isSidebarCollapsed ? (
            <div className="mt-6">
              <p className="px-2 text-[13px] font-medium text-[#4b5563]">Plataforma</p>
            </div>
          ) : null}

          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const itemPath = `/${basePath}/${item.segment}`;
              const itemActive = location.pathname.startsWith(itemPath);
              const itemTargetPath = getSidebarSubItems(basePath, item.segment)[0]?.path ?? itemPath;

              return (
                <button
                  key={item.segment}
                  type="button"
                  onClick={() => navigate(itemTargetPath)}
                  className={`flex w-full items-center rounded-xl py-2.5 text-left font-medium transition ${
                    isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                  } ${
                    itemActive
                      ? 'bg-[#e9e9e9] text-[#111827]'
                      : 'text-[#111827] hover:bg-[#ececec]'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <SidebarIcon segment={item.segment} />
                  {!isSidebarCollapsed ? <span className="text-[15px] leading-[1.2]">{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <button
              type="button"
              onClick={handleLogout}
              className={`flex w-full items-center rounded-xl py-2.5 text-left hover:bg-[#ececec] ${
                isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
              }`}
              title={isSidebarCollapsed ? userName : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e8f0] text-[13px] font-semibold">
                  {userInitials}
                </div>
                {!isSidebarCollapsed ? (
                  <span className="max-w-[150px] truncate text-[13px] font-medium leading-none text-[#111827]">
                    {userName}
                  </span>
                ) : null}
              </div>
              {!isSidebarCollapsed ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#374151]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              ) : null}
            </button>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${isSidebarCollapsed ? 'lg:pl-[86px]' : 'lg:pl-[286px]'}`}>
        <main className="p-3.5 md:p-4 lg:p-5">
          <section className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex items-center gap-2.5 px-4 py-5">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d1d5db] bg-white text-[#111827] transition hover:bg-[#f3f4f6]"
                aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              >
                <PanelRightClose className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <h1 className="text-ui-xl font-medium tracking-[-0.01em]">
                {activeItem.label}
              </h1>
            </div>
          </section>

          {showLayoutSubTabs && activeSubItems.length > 0 ? (
            <section className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <div className="inline-flex rounded-xl bg-[#ececec] p-1">
                {activeSubItems.map((subItem) => {
                  const isActive = activeSubPath === subItem.path;
                  return (
                    <button
                      key={subItem.path}
                      type="button"
                      onClick={() => navigate(subItem.path)}
                      className={`text-ui-sm min-w-[150px] rounded-lg px-4 py-2 font-semibold transition ${
                        isActive
                          ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
                          : 'text-[#374151] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {subItem.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="mt-4">
            {isRouteLoading ? <BackofficeRouteSkeleton /> : <Outlet />}
          </section>
        </main>
      </div>
    </div>
  );
}
