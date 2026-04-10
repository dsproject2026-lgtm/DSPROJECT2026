import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api';

import { ApiError } from './api-error';
import { toPtPtErrorMessage } from './error-messages';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
}

interface SessionProvider {
  getAccessToken: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
  onAuthFailure?: () => void;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly sessionProvider: SessionProvider,
  ) {}

  get<TData>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<TData>('GET', path, options);
  }

  post<TData>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<TData>('POST', path, { ...options, body });
  }

  patch<TData>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return this.request<TData>('PATCH', path, { ...options, body });
  }

  delete<TData>(path: string, options?: Omit<RequestOptions, 'body'>) {
    return this.request<TData>('DELETE', path, options);
  }

  private async request<TData>(
    method: RequestMethod,
    path: string,
    options: RequestOptions = {},
    allowAuthRetry = true,
  ): Promise<TData> {
    const headers = this.buildHeaders(options);
    const result = await this.performRequest<TData>(method, path, options, headers);

    if (
      options.auth &&
      result.response.status === 401 &&
      allowAuthRetry &&
      this.sessionProvider.refreshAccessToken
    ) {
      const refreshedAccessToken = await this.sessionProvider.refreshAccessToken();

      if (refreshedAccessToken) {
        return this.request<TData>(method, path, options, false);
      }

      this.sessionProvider.onAuthFailure?.();
    }

    if (!result.response.ok || !result.json || result.json.success === false) {
      if (result.json && result.json.success === false) {
        throw new ApiError(
          toPtPtErrorMessage(result.json.error.code, result.json.error.message),
          result.json.error.code,
          result.json.error.statusCode,
          result.json.error.details,
        );
      }

      throw new ApiError(
        toPtPtErrorMessage('UNEXPECTED_ERROR', 'Unexpected server error.'),
        'UNEXPECTED_ERROR',
        result.response.status || 500,
      );
    }

    return result.json.data;
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };

    if (options.auth) {
      const accessToken = this.sessionProvider.getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return headers;
  }

  private async performRequest<TData>(
    method: RequestMethod,
    path: string,
    options: RequestOptions,
    headers: Record<string, string>,
  ) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const json = (await response.json().catch(() => null)) as
      | ApiSuccessResponse<TData>
      | ApiErrorResponse
      | null;

    return {
      response,
      json,
    };
  }
}
