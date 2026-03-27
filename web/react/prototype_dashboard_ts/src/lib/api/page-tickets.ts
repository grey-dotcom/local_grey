/**
 * @file lib/api/page-tickets.ts
 * @description 수행결과 일감 API
 *
 * [BE 연동 가이드]
 * - GET /page-tickets/v2/tickets
 *   쿼리: roomGroupIdIn={id}&dateFilterType={type}&...
 */

import { apiClient } from './client';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export interface FetchTicketsParams {
  roomGroupIdIn: string[];
  dateFilterType?: string;
  page?: number;
  size?: number;
}

export async function fetchTickets(
  params: FetchTicketsParams,
  token: string
): Promise<unknown> {
  if (USE_MOCK) {
    // TODO: mock 데이터 추가 필요
    return { content: [] };
  }
  const query = new URLSearchParams();
  params.roomGroupIdIn.forEach((id) => query.append('roomGroupIdIn', id));
  if (params.dateFilterType) query.set('dateFilterType', params.dateFilterType);
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));
  return apiClient(`/page-tickets/v2/tickets?${query}`, { token });
}
