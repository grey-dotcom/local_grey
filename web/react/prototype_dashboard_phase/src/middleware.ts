/**
 * @file middleware.ts
 * @description Route Guard — 인증/권한 기반 리다이렉트
 *
 * [동작 규칙]
 * 1. 미인증 (토큰 없음)      → /login 리다이렉트
 * 2. NONE 권한               → /login 리다이렉트  ※ 아래 [프로토타입 한계] 참고
 * 3. 메뉴 접근 권한 없음     → /home 리다이렉트
 *
 * [주의]
 * - middleware는 Edge Runtime에서 실행 → Zustand store 직접 접근 불가
 * - 토큰은 localStorage가 아닌 cookie에서 읽음
 * - 실제 권한 정보(authority)는 쿠키에 별도 저장 필요
 *   또는 token decode(JWT) 방식으로 추출
 *
 * [프로토타입 한계 — FB-1]
 * 현재 middleware는 쿠키 'token' 유무만 체크합니다.
 * RBAC authority(NONE 차단 등) 검증은 클라이언트 측 layout.tsx에서 이중으로 수행합니다.
 *
 * Edge Runtime에서 authority를 검증하려면 다음 중 하나가 필요합니다:
 *   A) 로그인 시 authority 값을 별도 쿠키('authority')로 저장
 *   B) JWT 토큰 내부에 authority를 claim으로 포함하고 Edge에서 decode
 *
 * 실서비스 전환 시 아래 주석 처리된 코드를 활성화하고 로그인 시 쿠키 저장 로직을 추가하세요.
 *
 * [BE 연동 가이드]
 * - 현재는 쿠키 'token' 유무만 체크 (프로토타입)
 * - 실제 연동 시: 쿠키 'authority' 값으로 BLOCKED_AUTHORITIES 체크 추가
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 퍼블릭 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 토큰 확인 (쿠키 기반 — Edge Runtime)
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // [확장 포인트 — 실서비스 전환 시 활성화]
  // authority 쿠키가 있을 때 NONE 권한 차단:
  // 전제: 로그인 성공 시 document.cookie = `authority=${staffAuth.authority}; path=/` 추가 필요
  //
  // import { BLOCKED_AUTHORITIES } from '@/config/rbac.config';
  // import type { StaffAuthority } from '@/types/auth';
  //
  // const authority = request.cookies.get('authority')?.value;
  // if (authority && BLOCKED_AUTHORITIES.includes(authority as StaffAuthority)) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};
