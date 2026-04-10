import { env } from '@/config/env';
import { endpoints } from '@/api/endpoints';
import { ApiClient } from '@/lib/http/ApiClient';
import { sessionStorageService } from '@/lib/storage/session-storage';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api';
import type { RefreshTokenResult } from '@/types/auth';

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const session = sessionStorageService.getSession();

    if (!session?.refreshToken) {
      sessionStorageService.clearSession();
      return null;
    }

    try {
      const response = await fetch(`${env.apiBaseUrl}${endpoints.auth.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      const json = (await response.json().catch(() => null)) as
        | ApiSuccessResponse<RefreshTokenResult>
        | ApiErrorResponse
        | null;

      if (!response.ok || !json || json.success === false) {
        sessionStorageService.clearSession();
        return null;
      }

      const currentSession = sessionStorageService.getSession();
      if (!currentSession) {
        return null;
      }

      const nextSession = {
        ...currentSession,
        ...json.data,
      };

      sessionStorageService.saveSession(nextSession);
      return nextSession.accessToken;
    } catch {
      sessionStorageService.clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const handleAuthFailure = () => {
  sessionStorageService.clearSession();

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
};

export const apiClient = new ApiClient(env.apiBaseUrl, {
  getAccessToken: () => sessionStorageService.getAccessToken(),
  refreshAccessToken,
  onAuthFailure: handleAuthFailure,
});
