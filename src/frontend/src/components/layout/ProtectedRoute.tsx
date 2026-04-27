import { useEffect, useState, type PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { Spinner } from '@/components/ui';
import type { UserRole } from '@/config/role-navigation';
import { getRoleHomeRoute } from '@/config/role-navigation';
import { ApiError } from '@/lib/http/api-error';
import { sessionStorageService } from '@/lib/storage/session-storage';

interface ProtectedRouteProps extends PropsWithChildren {
  allowedPerfis?: UserRole[];
}

export function ProtectedRoute({ children, allowedPerfis }: ProtectedRouteProps) {
  const session = sessionStorageService.getSession();
  const accessToken = session?.accessToken ?? null;
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setIsAuthorized(false);
      setIsChecking(false);
      return;
    }

    let active = true;
    setIsChecking(true);

    const validateSession = async () => {
      try {
        const currentUser = await authApi.me();
        const currentSession = sessionStorageService.getSession();

        if (!currentSession || !active) {
          return;
        }

        sessionStorageService.saveSession({
          ...currentSession,
          user: currentUser,
        });
        setIsAuthorized(true);
      } catch (cause) {
        if (!active) {
          return;
        }

        if (cause instanceof ApiError) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(false);
        }
        sessionStorageService.clearSession();
      } finally {
        if (active) {
          setIsChecking(false);
        }
      }
    };

    void validateSession();

    return () => {
      active = false;
    };
  }, [accessToken]);

  if (!accessToken || !isAuthorized) {
    if (isChecking && accessToken) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-[#334155]">
            <Spinner color="accent" />
            <span className="text-sm font-semibold">A validar sessao...</span>
          </div>
        </div>
      );
    }

    return <Navigate to="/login" replace />;
  }

  if (allowedPerfis && allowedPerfis.length > 0) {
    const perfil = sessionStorageService.getSession()?.user?.perfil;

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
