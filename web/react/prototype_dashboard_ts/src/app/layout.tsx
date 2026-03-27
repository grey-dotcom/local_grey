/**
 * @file app/layout.tsx
 * @description 루트 레이아웃
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '대시보드',
  description: '운영 대시보드 프로토타입',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
