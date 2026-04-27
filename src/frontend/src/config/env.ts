function resolveDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000/api/v1';
  }

  return `http://${window.location.hostname}:4000/api/v1`;
}

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();
const isProduction = import.meta.env.PROD;

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

  if (isProduction) {
    try {
      const parsed = new URL(configured);

      if (parsed.protocol !== 'https:') {
        throw new Error('VITE_API_BASE_URL must use HTTPS in production.');
      }
    } catch (error) {
      throw new Error(
        `Invalid VITE_API_BASE_URL for production: ${String(error)}`,
      );
    }
  }

  return configured;
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
};
