/**
 * @file lib/api/client.ts
 * @description fetch wrapper — Authorization 헤더, 에러 처리
 *
 * [BE 연동 가이드]
 * - API Base: https://indicator.11h.kr
 * - 인증: Authorization: Bearer {token}
 * - 토큰은 authStore에서 가져옴 (로그인 후 저장)
 * - NEXT_PUBLIC_USE_MOCK=true 시 mock JSON 반환
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'https://indicator.11h.kr';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, `API Error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
