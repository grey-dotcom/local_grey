import type { NextConfig } from 'next';

/**
 * Next.js 설정
 *
 * [호스팅 주의사항]
 * - output: 'export' 는 정적 배포(Firebase Hosting 등) 용도
 * - middleware.ts 사용 시 output: 'export' 와 충돌 → 개발/서버 모드에서는 주석 처리
 * - 외부 정적 배포가 필요할 때만 아래 output 주석 해제 + middleware.ts 비활성화
 * - API 호출은 항상 클라이언트 → indicator.11h.kr 직접 요청 구조를 유지할 것
 */
const nextConfig: NextConfig = {
  // ⚠️ 정적 배포 시에만 활성화 — middleware.ts 와 함께 사용 불가
  // output: 'export',

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
