import { redirect } from 'next/navigation';

/**
 * 루트(/) 접근 시 /home으로 리다이렉트
 * Vercel 배포 환경에서 루트 URL 404 방지용
 */
export default function RootPage() {
  redirect('/home');
}
