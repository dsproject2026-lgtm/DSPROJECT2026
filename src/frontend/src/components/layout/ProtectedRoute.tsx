import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import type { UserRole } from '@/config/role-navigation';
import { getRoleHomeRoute } from '@/config/role-navigation';
import { sessionStorageService } from '@/lib/storage/session-storage';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedPerfis?: UserRole[];
}

export function ProtectedRoute({ children, allowedPerfis }: ProtectedRouteProps) {
  const session = sessionStorageService.getSession();
  const accessToken = session?.accessToken ?? null;

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedPerfis && allowedPerfis.length > 0) {
    const perfil = session?.user?.perfil;

    if (!perfil) {
      sessionStorageService.clearSession();
      return <Navigate to="/login" replace />;
    }

    if (!allowedPerfis.includes(perfil)) {
      return <Navigate to={getRoleHomeRoute(perfil)} replace />;
    }
  }

  return children;
}
