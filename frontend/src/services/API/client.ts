
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const AUTH_TOKEN_KEY = 'bg_access_token';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  outcome: 'rejected' | 'unknown';

  constructor(
    message: string,
    status: number,
    details?: unknown,
    outcome: 'rejected' | 'unknown' =
      status === 0 || status === 408 || status >= 500
        ? 'unknown'
        : 'rejected'
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.outcome = outcome;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers);

  // Attach the backend JWT when a real session exists.
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // Storage may be unavailable in restricted browser environments.
  }

  // Do not set JSON content type for multipart FormData uploads.
  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Network communication error',
      0
    );
  }

  if (!response.ok) {
    let errorBody: unknown;

    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.clone().text();
      } catch {
        errorBody = undefined;
      }
    }

    throw new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      'The server response could not be read.',
      response.status,
      undefined,
      'unknown'
    );
  }
}
