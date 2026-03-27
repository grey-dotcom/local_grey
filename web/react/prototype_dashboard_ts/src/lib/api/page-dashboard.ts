/**
 * @file lib/api/page-dashboard.ts
 * @description 대시보드 페이지 API
 *
 * [BE 연동 가이드]
 * - GET /page-dashboard/v1/ticket-stats
 *   쿼리: roomGroupIds={id}&at={yyyyMMddHHmm}
 *   복수 공간그룹: roomGroupIds=ID1&roomGroupIds=ID2 (BE 확인 필요 — 콤마 vs 반복)
 *
 * - GET /page-dashboard/v1/ticket-reports
 *   쿼리: roomGroupIds={id}&sort=LATEST&filter=ALL&page=0&size=10
 */

import type { TicketStats, TicketReportsResponse, FeedFilter } from '@/types/dashboard';
import { apiClient } from './client';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export interface FetchTicketStatsParams {
  roomGroupIds: string[];
  at: string; // yyyyMMddHHmm 형식 ex) 202603181406
}

export async function fetchTicketStats(
  params: FetchTicketStatsParams,
  token: string
): Promise<TicketStats> {
  if (USE_MOCK) {
    const data = await import('@/mocks/dashboard.json');
    return data.default as TicketStats;
  }
  const query = new URLSearchParams();
  params.roomGroupIds.forEach((id) => query.append('roomGroupIds', id));
  query.set('at', params.at);
  return apiClient<TicketStats>(`/page-dashboard/v1/ticket-stats?${query}`, { token });
}

export interface FetchTicketReportsParams {
  roomGroupIds: string[];
  sort?: 'LATEST' | 'OLDEST';
  filter?: FeedFilter;
  page?: number;
  size?: number;
}

export async function fetchTicketReports(
  params: FetchTicketReportsParams,
  token: string
): Promise<TicketReportsResponse> {
  if (USE_MOCK) {
    const data = await import('@/mocks/feed.json');
    return data.default as TicketReportsResponse;
  }
  const query = new URLSearchParams();
  params.roomGroupIds.forEach((id) => query.append('roomGroupIds', id));
  query.set('sort', params.sort ?? 'LATEST');
  query.set('filter', params.filter ?? 'ALL');
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 10));
  return apiClient<TicketReportsResponse>(`/page-dashboard/v1/ticket-reports?${query}`, { token });
}
