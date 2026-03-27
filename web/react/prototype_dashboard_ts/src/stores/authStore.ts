/**
 * @file stores/authStore.ts
 * @description 인증 전역 상태 — Zustand
 *
 * ─── 토큰 구조 안내 ────────────────────────────────────────────────────────
 * 현재: access token 단일 구조 (프로토타입 기준)
 * BE 확정 후 refreshToken 등 확장 포인트 주석 참고
 * ──────────────────────────────────────────────────────────────────────────
 *
 * [BE 연동 가이드]
 * - 로그인 성공 시 setToken → setStaffAuth → setRoomBrands → setRoomGroups 순서로 호출
 * - switchWorkspace: 워크스페이스 전환 시 staffAuth의 workspaceCode/Name/Id를 교체
 *
 * ─── Top Bar 탭 정책 (2026-03-23 확정) ────────────────────────────────────
 *
 * 두 상태의 역할 구분:
 *   selectedRoomGroupIds  → 지점 선택 드롭다운/바텀시트의 "필터" 역할
 *                           어떤 지점들을 대상으로 볼지 범위를 결정
 *   activeTabGroupId      → Top Bar 탭의 "단일 전환" 역할
 *                           현재 보고 있는 단위(전체 vs 특정 지점)를 결정
 *
 * 탭 목록 렌더링 규칙:
 *   selectedRoomGroupIds = []       → 인가받은 roomGroups 전체가 탭으로 표시
 *   selectedRoomGroupIds = [A, B]   → "전체" + A탭 + B탭만 표시
 *   → "전체" 탭은 항상 첫 번째, 제거 불가
 *
 * 탭 클릭 동작:
 *   "전체" 탭     → activeTabGroupId = null  → selectedRoomGroupIds 범위 전체 데이터 호출
 *   지점명 탭     → activeTabGroupId = id    → 해당 지점 단독 데이터 호출
 *
 * 지점 선택 필터 변경 시 탭 리셋:
 *   setSelectedRoomGroupIds 호출 → activeTabGroupId 자동으로 null 리셋
 *   (지점 선택이 바뀌면 탭은 항상 "전체"로 돌아감)
 *
 * [BE 연동 가이드 — 데이터 호출 파라미터]
 *   activeTabGroupId !== null → roomGroupIds = [activeTabGroupId]  (단일 지점)
 *   activeTabGroupId === null, selectedRoomGroupIds = [A,B] → roomGroupIds = [A, B]
 *   activeTabGroupId === null, selectedRoomGroupIds = []    → roomGroupIds 파라미터 생략 (전체)
 *
 * ─── 공지사항 닫기 정책 ────────────────────────────────────────────────────
 *   프로토타입: React state만 사용 (NoticeBanner.tsx 내부 dismissed state)
 *   → 새로고침/재방문 시 항상 재노출 (localStorage 미사용)
 *   실서비스 전환 시: NoticeBanner.tsx의 dismissed state를 localStorage 또는
 *   서버 저장 방식으로 교체 필요 (authStore와 무관하게 컴포넌트 레벨에서 처리)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaffAuth, RoomGroup, RoomBrand, Workspace } from '@/types/auth';

interface AuthState {
  // ── 토큰 ──────────────────────────────────────────────────────────────
  token: string | null;

  // ── 사용자 정보 ────────────────────────────────────────────────────────
  staffAuth: StaffAuth | null;

  /**
   * 지점 그룹(브랜드) 목록 — 드롭다운 상위 계층
   * 서버가 RBAC 기반으로 접근 가능한 브랜드만 반환
   * brandId 필드로 roomGroups와 조인하여 2계층 구성
   *
   * [RBAC 안내] 권한 판단 기준은 staffAuth.authority 단일 필드.
   * staffAuth.isHeadquarter 등 부가 필드는 프론트 분기에 사용하지 않음.
   * 자세한 내용은 docs/MOCK_GUIDE.md 참고.
   */
  roomBrands: RoomBrand[];

  /**
   * 지점 목록 — 드롭다운/탭 목록 소스
   * 서버가 RBAC 기반으로 접근 가능한 지점만 반환
   * brandId 필드로 roomBrands와 조인하여 2계층 구성
   */
  roomGroups: RoomGroup[];

  /**
   * 지점 선택 필터 — 드롭다운/바텀시트에서 선택된 지점 ID 목록
   * []       = 필터 없음 (인가된 전체 지점 대상, 디폴트)
   * [A, B]   = A, B 지점만 탭 목록에 표시 및 데이터 범위로 사용
   *
   * 변경 시 activeTabGroupId 자동 null 리셋 (setSelectedRoomGroupIds 참고)
   */
  selectedRoomGroupIds: string[];

  /**
   * Top Bar 탭 현재 선택 상태
   * null         = "전체" 탭 활성 (selectedRoomGroupIds 범위 전체 데이터)
   * roomGroupId  = 해당 지점 탭 활성 (해당 지점 단독 데이터)
   */
  activeTabGroupId: string | null;

  // ── 워크스페이스 목록 (드롭다운용) ────────────────────────────────────
  workspaces: Workspace[];

  // ── Actions ───────────────────────────────────────────────────────────
  setToken: (token: string) => void;
  setStaffAuth: (auth: StaffAuth) => void;
  setRoomBrands: (brands: RoomBrand[]) => void;
  setRoomGroups: (groups: RoomGroup[]) => void;

  /**
   * 지점 선택 필터 변경
   * activeTabGroupId를 null로 자동 리셋 → 탭이 "전체"로 돌아감
   */
  setSelectedRoomGroupIds: (ids: string[]) => void;

  /**
   * Top Bar 탭 선택 변경
   * null = "전체" 탭 / roomGroupId = 해당 지점 탭
   */
  setActiveTabGroupId: (id: string | null) => void;

  setWorkspaces: (workspaces: Workspace[]) => void;

  /**
   * 워크스페이스 전환
   * 전환 시 roomBrands, roomGroups, 필터, 탭 선택 전부 초기화
   */
  switchWorkspace: (workspace: Workspace) => void;

  /**
   * 로그아웃
   * token/staffAuth/roomGroups 초기화 + mock CRUD 데이터 초기화
   */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      staffAuth: null,
      roomBrands: [],
      roomGroups: [],
      selectedRoomGroupIds: [],
      activeTabGroupId: null,
      workspaces: [],

      setToken: (token) => set({ token }),
      setStaffAuth: (staffAuth) => set({ staffAuth }),
      setRoomBrands: (roomBrands) => set({ roomBrands }),
      setRoomGroups: (roomGroups) => set({ roomGroups }),

      // 지점 선택 필터 변경 시 탭을 "전체"로 자동 리셋
      setSelectedRoomGroupIds: (ids) =>
        set({ selectedRoomGroupIds: ids, activeTabGroupId: null }),

      setActiveTabGroupId: (id) => set({ activeTabGroupId: id }),

      setWorkspaces: (workspaces) => set({ workspaces }),

      switchWorkspace: (workspace) =>
        set((state) => ({
          staffAuth: state.staffAuth
            ? {
                ...state.staffAuth,
                workspaceId: workspace.workspaceId,
                workspaceCode: workspace.workspaceCode,
                workspaceName: workspace.workspaceName,
              }
            : null,
          roomBrands: [],
          roomGroups: [],
          selectedRoomGroupIds: [],
          activeTabGroupId: null,
        })),

      logout: () => {
        // mock CRUD 데이터 초기화 → 재로그인 시 원본 JSON 복원
        import('@/utils/mockStore').then(({ clearAllMockData }) => clearAllMockData());
        set({
          token: null,
          staffAuth: null,
          roomBrands: [],
          roomGroups: [],
          selectedRoomGroupIds: [],
          activeTabGroupId: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);
