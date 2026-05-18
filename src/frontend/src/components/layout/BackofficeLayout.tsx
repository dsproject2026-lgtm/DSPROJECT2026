import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  GraduationCap,
  Megaphone,
  PanelRightClose,
  Shield,
  UserRound,
  UserSquare2,
  Users,
} from 'lucide-react';
import { Card } from '@heroui/react';

import { authApi } from '@/api/auth.api';
import type { BackofficeNavItem } from '@/config/role-navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
  UiPageSkeleton,
  toast,
} from '@/components/ui';
import { ApiError } from '@/lib/http/api-error';
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
  if (basePath === 'admin' && segment === 'eleicoes') {
    return [];
  }

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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });

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
  const showLayoutSubTabs =
    basePath !== 'comissao' && activeItem.segment !== 'candidatos' && activeItem.segment !== 'estudantes';

  const userName = session?.user.nome ?? 'Utilizador';
  const userEmail = session?.user.email ?? 'sem-email@up.ac.mz';
  const userProfile = session?.user.perfil ?? 'Utilizador';
  const userInitials = getInitials(userName);
  const isProfileRoute = location.pathname === `/${basePath}/perfil`;
  const pageTitle = isProfileRoute ? 'Meu perfil' : activeItem.label;

  const handleLogout = async () => {
    const refreshToken = session?.refreshToken;

    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined);
    }

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f8ee6] focus-visible:ring-offset-2"
                  title={isSidebarCollapsed ? userName : undefined}
                  aria-label={`Menu de ${userName}`}
                >
                  <Card className="rounded-md border-transparent bg-transparent shadow-none transition hover:bg-[#ececec]">
                    <div className={isSidebarCollapsed ? 'p-2' : 'p-3'}>
                      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-[13px] font-semibold text-[#111827]">
                          {userInitials}
                        </div>
                        {!isSidebarCollapsed ? (
                          <>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold leading-tight text-[#111827]">
                                {userName}
                              </p>
                              <p className="truncate text-[11px] text-[#6b7280]">{userProfile}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#6b7280]" />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-64">
                <DropdownMenuLabel className="normal-case">
                  <p className="text-sm font-semibold text-[#0f172a]">{userName}</p>
                  <p className="text-xs font-normal text-[#64748b]">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate(`/${basePath}/perfil`)}>
                  <UserRound className="h-4 w-4 text-[#64748b]" />
                  Meu perfil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsPasswordModalOpen(true)}>
                  <KeyRound className="h-4 w-4 text-[#64748b]" />
                  Alterar senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => void handleLogout()}
                  className="text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${isSidebarCollapsed ? 'lg:pl-[86px]' : 'lg:pl-[286px]'}`}>
        <main className="p-3.5 md:p-4 lg:p-5">
          <section className="mb-4 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/images/logo.svg" alt="SIVO-UP" className="h-10 w-10 shrink-0 rounded-full border border-[#d1d5db] bg-white object-contain p-0.5" />
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-bold text-[#111827]">SIVO-UP</p>
                  <p className="truncate text-[12px] text-[#6b7280]">{identityLabel}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-3 text-sm font-semibold text-[#111827]"
                  >
                    Menu
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Navegação</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => {
                    const itemPath = `/${basePath}/${item.segment}`;
                    const itemTargetPath = getSidebarSubItems(basePath, item.segment)[0]?.path ?? itemPath;
                    return (
                      <DropdownMenuItem key={item.segment} onSelect={() => navigate(itemTargetPath)}>
                        <SidebarIcon segment={item.segment} />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate(`/${basePath}/perfil`)}>
                    <UserRound className="h-4 w-4 text-[#64748b]" />
                    Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsPasswordModalOpen(true)}>
                    <KeyRound className="h-4 w-4 text-[#64748b]" />
                    Alterar senha
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void handleLogout()}
                    className="text-[#b42318] focus:bg-[#fef3f2] focus:text-[#b42318]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb]">
            <div className="flex min-h-[82px] items-center gap-2.5 px-4 py-6">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[#d1d5db] bg-white text-[#111827] transition hover:bg-[#f3f4f6] lg:inline-flex"
                aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              >
                <PanelRightClose className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <h1 className="text-ui-xl font-medium tracking-[-0.01em]">
                {pageTitle}
              </h1>
            </div>
          </section>

          {showLayoutSubTabs && !isProfileRoute && activeSubItems.length > 0 ? (
            <section className="mt-4 overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
              <div className="inline-flex min-w-max rounded-xl bg-[#ececec] p-1">
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

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={changePassword}
            className="w-full max-w-md"
          >
            <Card className="rounded-md bg-white shadow-xl">
              <div className="p-5">
                <h2 className="text-xl font-semibold text-[#0f172a]">Alterar senha</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Informe a senha atual e escolha uma nova senha.
                </p>

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
              </div>
            </Card>
          </form>
        </div>
      ) : null}
    </div>
  );
}
