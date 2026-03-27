/**
 * @file types/auth.ts
 * @description 인증 및 권한(RBAC) 타입 정의
 *
 * [BE 연동 가이드]
 * - API: GET https://indicator.11h.kr/shared/v1/staffAuth
 * - 응답의 authority 필드 값이 StaffAuthority 타입에 매핑됨
 * - Role 키 변경 시 rbac.config.ts의 ROLE_KEY_MAP만 수정할 것
 */

// ─────────────────────────────────────────────
// BE에서 내려주는 실제 authority 키 값
// 출처: keeper-admin.com localStorage > staff-storage > authority
// ─────────────────────────────────────────────
export type StaffAuthority =
  | 'HEADQUARTER' // 열한시 계정 — 모든 워크스페이스 무제한
  | 'SUDO'        // 소유주 — 본인 소유 워크스페이스 전체
  | 'ADMIN'       // 총괄 관리자 — 배정된 워크스페이스 전체
  | 'MANAGER'     // 관리자 — 배정된 공간 그룹만
  | 'NONE';       // 승인 대기 — 접근 불가

// ─────────────────────────────────────────────
// GET /shared/v1/staffAuth 응답 구조
// 출처: indicator.11h.kr
// ─────────────────────────────────────────────
export interface StaffAuth {
  workspaceCode: string;
  isHeadquarter: boolean;
  isWorkspaceOwner: boolean;
  isPartner: boolean;
  workspaceId: string;
  workspaceName: string;
  workspaceStaffRegistrationType: string | null;
  email: string;
  name: string;
  staffId: string;
  phoneNumber: string;
  authority: StaffAuthority;
  supplyPrice: string[];
  partnerPrice: string[];
  keeperPrice: string[];
  keeperLevelUpPoint: string[];
  isAirSupplyConnected: boolean;
}

// ─────────────────────────────────────────────
// GET /shared/v1/workspaces 응답 구조
// ─────────────────────────────────────────────
export interface Workspace {
  workspaceId: string;
  workspaceCode: string;
  workspaceName: string;
}

export interface RoomGroup {
  roomGroupId: string;
  roomGroupName: string;
  workspaceId: string;
  /** 소속 브랜드(지점 그룹) ID — 드롭다운 2계층 구성에 사용
   * [BE 연동 가이드]
   * - 실 API에 brandId가 없는 경우: mock 전용 필드
   * - 실 API 연동 시: RoomGroup 응답에 brandId 포함 여부 확인 후 제거 또는 유지
   * - API 경로 예시: GET /shared/v1/room-groups → { ..., brandId: string }
   */
  brandId: string;
}

/**
 * 지점 그룹 (브랜드 계층) — 드롭다운 상위 계층
 *
 * [BE 연동 가이드]
 * - 현재: mock 전용 (실 API 미확인)
 * - 연동 예상 경로: GET /shared/v1/room-brands
 * - 권한 범위: staffAuth.authority에 따라 서버가 접근 가능한 브랜드만 반환
 *   HEADQUARTER/SUDO/ADMIN → 워크스페이스 내 전체 브랜드
 *   MANAGER → 배정된 roomGroup이 속한 브랜드만 노출
 */
export interface RoomBrand {
  brandId: string;
  brandName: string;
  workspaceId: string;
}
