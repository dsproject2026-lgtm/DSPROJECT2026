import { Button, Card, CardContent } from '@/components/ui';
import type { PropsWithChildren } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { sessionStorageService } from '@/lib/storage/session-storage';

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const session = sessionStorageService.getSession();

    if (session?.refreshToken) {
      try {
        await authApi.logout(session.refreshToken);
      } catch {
        // ignore remote logout failures, local logout still happens
      }
    }

    sessionStorageService.clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold text-text-primary">SiVOU-P Frontend</div>

          <nav className="flex items-center gap-2">
            <NavLink
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-subtle'
                }`
              }
              to="/dashboard"
            >
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg-subtle'
                }`
              }
              to="/elections"
            >
              Elections
            </NavLink>
            <Button size="sm" variant="danger" onPress={handleLogout}>
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Card>
          <CardContent className="p-6">{children}</CardContent>
        </Card>
      </main>
    </div>
  );
}
