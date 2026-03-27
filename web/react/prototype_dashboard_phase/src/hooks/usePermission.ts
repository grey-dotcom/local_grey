/**
 * @file hooks/usePermission.ts
 * @description 메뉴 접근 권한 확인 훅
 *
 * 사용 예시:
 * const canAccess = usePermission('setting-workspace');
 * const isAdmin = useMinRole('ADMIN');
 */

import { useAuthStore } from '@/stores/authStore';
import { hasMenuAccess, hasMinRole, type MenuKey } from '@/config/rbac.config';
import type { StaffAuthority } from '@/types/auth';

export function usePermission(menuKey: MenuKey): boolean {
  const staffAuth = useAuthStore((s) => s.staffAuth);
  if (!staffAuth) return false;
  return hasMenuAccess(staffAuth.authority, menuKey);
}

export function useMinRole(minRole: StaffAuthority): boolean {
  const staffAuth = useAuthStore((s) => s.staffAuth);
  if (!staffAuth) return false;
  return hasMinRole(staffAuth.authority, minRole);
}
