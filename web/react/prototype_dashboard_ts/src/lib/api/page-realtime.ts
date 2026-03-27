/**
 * @file lib/api/page-realtime.ts
 * @description 실시간 일감 API
 *
 * [BE 연동 가이드]
 * - POST /page-realtime-tickets/v1/tickets
 * - body: { roomGroupIds: string[], at: string }
 */

import { apiClient } from './client';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export interface FetchRealtimeTicketsParams {
  roomGroupIds: string[];
  at: string;
}

export async function fetchRealtimeTickets(
  params: FetchRealtimeTicketsParams,
  token: string
): Promise<unknown> {
  if (USE_MOCK) {
    // TODO: mock 데이터 추가 필요
    return { content: [] };
  }
  return apiClient('/page-realtime-tickets/v1/tickets', {
    method: 'POST',
    body: JSON.stringify(params),
    token,
  });
}
