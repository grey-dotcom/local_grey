/**
 * @file lib/api/shared.ts
 * @description 공통 API — staffAuth, workspaces
 *
 * [BE 연동 가이드]
 * - GET /shared/v1/staffAuth     → 로그인 스태프 인증 정보
 * - GET /shared/v1/workspaces    → 접근 가능한 워크스페이스 목록
 */

import type { StaffAuth, Workspace, RoomGroup, RoomBrand } from '@/types/auth';
import { apiClient } from './client';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export async function fetchStaffAuth(token: string): Promise<StaffAuth> {
  if (USE_MOCK) {
    const data = await import('@/mocks/staffAuth.json');
    return data.default as StaffAuth;
  }
  return apiClient<StaffAuth>('/shared/v1/staffAuth', { token });
}

export async function fetchWorkspaces(token: string): Promise<Workspace[]> {
  if (USE_MOCK) {
    const data = await import('@/mocks/workspaces.json');
    return data.default as Workspace[];
  }
  return apiClient<Workspace[]>('/shared/v1/workspaces', { token });
}

export async function fetchRoomGroups(token: string): Promise<RoomGroup[]> {
  if (USE_MOCK) {
    const data = await import('@/mocks/roomGroups.json');
    return data.default as RoomGroup[];
  }
  return apiClient<RoomGroup[]>('/shared/v1/room-groups', { token });
}

/**
 * 지점 그룹(브랜드) 목록 조회
 *
 * [BE 연동 가이드]
 * - 현재: mock 전용 (roomBrands.json)
 * - 연동 예상 API: GET /shared/v1/room-brands
 * - 서버가 RBAC 권한 기반으로 접근 가능한 브랜드만 반환
 * - 실 API 연동 시 이 함수만 수정하면 됨 (콜러 쪽 변경 불필요)
 */
export async function fetchRoomBrands(token: string): Promise<RoomBrand[]> {
  if (USE_MOCK) {
    const data = await import('@/mocks/roomBrands.json');
    return data.default as RoomBrand[];
  }
  return apiClient<RoomBrand[]>('/shared/v1/room-brands', { token });
}
