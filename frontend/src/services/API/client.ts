/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized API client configured for FastAPI backend (/api/v1).
 * Network failures use status 0 so services can distinguish an unknown outcome from a rejection.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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
    outcome: 'rejected' | 'unknown' = status === 0 || status === 408 || status >= 500
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

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
