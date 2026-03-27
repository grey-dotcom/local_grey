/**
 * @file config/rbac.config.ts
 * @description RBAC (Role-Based Access Control) 설정
 *
 * [프로토타입 범위]
 * - 현재 구현 대상: 대시보드(/home) 단일 페이지
 * - 나머지 메뉴는 추후 Phase별로 추가
 *
 * [BE 연동 가이드]
 * - authority 키 값은 GET /shared/v1/staffAuth 응답의 authority 필드 기준
 * - 메뉴 접근 제어는 SubSidebar, middleware.ts 에서 이 설정을 참조
 */

import type { StaffAuthority } from '@/types/auth';

export const ROLE_HIERARCHY: Record<StaffAuthority, number> = {
  HEADQUARTER: 5,
  SUDO: 4,
  ADMIN: 3,
  MANAGER: 2,
  NONE: 0,
};

export const BLOCKED_AUTHORITIES: StaffAuthority[] = ['NONE'];

export type MenuKey = 'dashboard';
// [확장 포인트] 추후 페이지 추가 시 여기에 key 추가
// | 'realtime'
// | 'tickets'
// | ...

export const MENU_ACCESS: Record<MenuKey, StaffAuthority[]> = {
  dashboard: [], // 빈 배열 = NONE 제외 모든 인증 사용자 접근 가능
};

export interface MenuItem {
  key: MenuKey;
  label: string;
  path: string;
  isWorkspaceScoped: boolean;
}

export interface MenuSection {
  sectionLabel: string;  // SubSidebar 섹션 레이블 (클릭 불가, 텍스트만)
  gnbIconName: string;   // GNB 아이콘 (섹션 단위 1개)
  items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    sectionLabel: '홈',
    gnbIconName: 'House',
    items: [
      {
        key: 'dashboard',
        label: '대시보드',
        path: '/home',
        isWorkspaceScoped: false,
      },
    ],
  },
  // [확장 포인트] 추후 섹션 추가
  // {
  //   sectionLabel: '운영',
  //   gnbIconName: 'ClipboardList',
  //   items: [ ... ],
  // },
];

export function hasMenuAccess(authority: StaffAuthority, menuKey: MenuKey): boolean {
  if (BLOCKED_AUTHORITIES.includes(authority)) return false;
  const allowed = MENU_ACCESS[menuKey];
  if (allowed.length === 0) return true;
  return allowed.includes(authority);
}

export function hasMinRole(authority: StaffAuthority, minRole: StaffAuthority): boolean {
  return ROLE_HIERARCHY[authority] >= ROLE_HIERARCHY[minRole];
}

export function getAccessibleMenuSections(authority: StaffAuthority): MenuSection[] {
  if (BLOCKED_AUTHORITIES.includes(authority)) return [];
  return MENU_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasMenuAccess(authority, item.key)),
    }))
    .filter((section) => section.items.length > 0);
}
