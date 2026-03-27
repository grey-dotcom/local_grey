/**
 * @file app/(auth)/login/page.tsx
 * @description 로그인 페이지 (Mock)
 *
 * [BE 연동 가이드]
 * - 실제 로그인 API 연동 시 handleLogin 함수 내부만 교체
 * - POST /auth/v1/login { email, password } → { token } 형태 예상
 * - 토큰 발급 후: setToken → fetchStaffAuth → fetchRoomBrands → fetchRoomGroups → /home 이동
 *
 * [RBAC 로드 순서]
 * 1. fetchStaffAuth → authority 확인 (NONE이면 차단)
 * 2. fetchRoomBrands → 브랜드(지점 그룹) 목록 (워크스페이스 기준 필터)
 * 3. fetchRoomGroups → 지점 목록 (워크스페이스 기준 필터)
 * roomBrands + roomGroups 동시 로드: 로그인 직후 /home 진입 시
 * 브랜드 헤더 공백 없이 즉시 렌더링 가능
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { fetchStaffAuth, fetchRoomGroups, fetchRoomBrands } from '@/lib/api/shared';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setStaffAuth, setRoomBrands, setRoomGroups } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      // Mock: 더미 토큰으로 로그인
      const mockToken = 'mock-token-xxxx';
      setToken(mockToken);

      // 쿠키에도 저장 (middleware 인증용)
      document.cookie = `token=${mockToken}; path=/`;

      // staffAuth + roomBrands + roomGroups 동시 로드
      // roomBrands는 지점 선택 드롭다운의 브랜드 계층 표시에 필요
      // (로그인 직후 /home 진입 시 브랜드 헤더 공백 방지)
      const [staffAuth, roomBrands, roomGroups] = await Promise.all([
        fetchStaffAuth(mockToken),
        fetchRoomBrands(mockToken),
        fetchRoomGroups(mockToken),
      ]);
      setStaffAuth(staffAuth);
      setRoomBrands(roomBrands);
      setRoomGroups(roomGroups);

      router.push('/home');
    } catch (e) {
      setError('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="bg-white rounded-xl shadow-md p-10 w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-[#212121]">대시보드</h1>
          <p className="text-sm text-gray-400">프로토타입 — Mock 로그인</p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-[#2563EB] text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '데모 계정으로 로그인'}
        </button>

        <p className="text-xs text-center text-gray-400">
          NEXT_PUBLIC_USE_MOCK=true 환경에서 동작합니다
        </p>
      </div>
    </div>
  );
}
