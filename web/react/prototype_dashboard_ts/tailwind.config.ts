import type { Config } from 'tailwindcss';

/**
 * Tailwind 설정
 *
 * shadcn/ui는 내부적으로 Tailwind 유틸리티 클래스를 사용합니다.
 * 이 파일은 shadcn 컴포넌트가 동작하기 위한 기반 설정입니다.
 *
 * [개발 가이드]
 * - 커스텀 스타일은 Tailwind 클래스 직접 사용보다 shadcn CSS 변수(--primary, --card 등) 우선
 * - 색상/폰트/radius 등 디자인 토큰은 globals.css의 CSS 변수로 관리
 * - 컴포넌트 스타일 확장은 shadcn의 variants(cva) 패턴 사용
 */
export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // 디자인 기준 폰트 (피그마 확정)
        sans: ['Noto Sans KR', 'sans-serif'],
        body: ['Noto Sans KR', 'sans-serif'],
        // 숫자 대형 표시용 (KPI 카드 등)
        numeric: ['Pretendard', 'sans-serif'],
      },
      colors: {
        // shadcn CSS 변수 연결 — globals.css에서 실제 값 정의
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config;
