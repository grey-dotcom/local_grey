/**
 * @file hooks/useAuth.ts
 * @description authStore 래퍼 훅
 *
 * 사용 예시:
 * const { staffAuth, isLoggedIn, logout } = useAuth();
 */

import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const staffAuth = useAuthStore((s) => s.staffAuth);
  const roomGroups = useAuthStore((s) => s.roomGroups);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);
  const setToken = useAuthStore((s) => s.setToken);
  const setStaffAuth = useAuthStore((s) => s.setStaffAuth);
  const setRoomGroups = useAuthStore((s) => s.setRoomGroups);
  const setSelectedRoomGroupIds = useAuthStore((s) => s.setSelectedRoomGroupIds);
  const logout = useAuthStore((s) => s.logout);

  const isLoggedIn = !!token && !!staffAuth;

  return {
    token,
    staffAuth,
    roomGroups,
    selectedRoomGroupIds,
    isLoggedIn,
    setToken,
    setStaffAuth,
    setRoomGroups,
    setSelectedRoomGroupIds,
    logout,
  };
}
