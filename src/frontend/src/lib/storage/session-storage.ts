import type { LoginResult } from '@/types/auth';

const SESSION_KEY = 'dsproject2026.session';

export const sessionStorageService = {
  getAccessToken(): string | null {
    const session = this.getSession();
    return session?.accessToken ?? null;
  },

  saveSession(session: LoginResult) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  getSession(): LoginResult | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginResult;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },
};
