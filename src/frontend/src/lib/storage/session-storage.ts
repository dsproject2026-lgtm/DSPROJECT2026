import type { LoginResult } from '@/types/auth';

const SESSION_KEY = 'dsproject2026.session';
const LEGACY_STORAGE: Storage | null =
  typeof window !== 'undefined' ? window.localStorage : null;
const CURRENT_STORAGE: Storage | null =
  typeof window !== 'undefined' ? window.sessionStorage : null;

function readFromStorage(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  return storage.getItem(SESSION_KEY);
}

export const sessionStorageService = {
  getAccessToken(): string | null {
    const session = this.getSession();
    return session?.accessToken ?? null;
  },

  saveSession(session: LoginResult) {
    CURRENT_STORAGE?.setItem(SESSION_KEY, JSON.stringify(session));
    LEGACY_STORAGE?.removeItem(SESSION_KEY);
  },

  getSession(): LoginResult | null {
    const currentRaw = readFromStorage(CURRENT_STORAGE);
    const legacyRaw = readFromStorage(LEGACY_STORAGE);
    const raw = currentRaw ?? legacyRaw;

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as LoginResult;

      if (!currentRaw && legacyRaw) {
        CURRENT_STORAGE?.setItem(SESSION_KEY, legacyRaw);
        LEGACY_STORAGE?.removeItem(SESSION_KEY);
      }

      return parsed;
    } catch {
      CURRENT_STORAGE?.removeItem(SESSION_KEY);
      LEGACY_STORAGE?.removeItem(SESSION_KEY);
      return null;
    }
  },

  clearSession() {
    CURRENT_STORAGE?.removeItem(SESSION_KEY);
    LEGACY_STORAGE?.removeItem(SESSION_KEY);
  },
};
