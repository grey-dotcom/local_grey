/**
 * @file components/ui/icons/index.tsx
 * @description GNB 커스텀 아이콘 — 운영 서비스(keeper-admin.com) 기준
 *
 * [교체 방법] 각 컴포넌트 내부 SVG path만 교체. 구조 건드리지 말 것.
 * [출처] Design 제공 NavIconButton.svg path 기반
 */

import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

function Icon({ size = 24, color = 'currentColor', children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" {...props}>
      {children}
    </svg>
  );
}

// ─── 라이브 메뉴 ──────────────────────────────────────────────────────────────

export function IconHome({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
    </Icon>
  );
}

export function IconRealtime({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M21 3H3C1.9 3 1 3.9 1 5V17C1 18.1 1.9 19 3 19H8V21H16V19H21C22.1 19 22.99 18.1 22.99 17L23 5C23 3.9 22.1 3 21 3ZM21 17H3V5H21V17Z" fill={color} />
      <path d="M19 8H8V10H19V8ZM19 12H8V14H19V12ZM7 8H5V10H7V8ZM7 12H5V14H7V12Z" fill={color} />
    </Icon>
  );
}

export function IconTickets({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 22H5C3.89 22 3 21.1 3 20L3.01 6C3.01 4.9 3.89 4 5 4H6V2H8V4H16V2H18V4H19C20.1 4 21 4.9 21 6V12H19V10H5V20H12V22Z" fill={color} />
      <path d="M21.42 17.7L16.12 23H14V20.88L19.3 15.58L21.42 17.7ZM22.85 16.27L21.84 15.26C21.45 14.87 20.82 14.87 20.43 15.26L19.72 15.97L21.84 18.09L22.55 17.38C22.94 16.99 22.94 16.36 22.85 16.27Z" fill={color} />
    </Icon>
  );
}

// ─── 설정 메뉴 ────────────────────────────────────────────────────────────────

export function IconSpaces({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M14 6V21H3V19H5V3H14V4H19V19H21V21H17V6H14ZM10 11V13H12V11H10Z" fill={color} />
    </Icon>
  );
}

export function IconAdminAccount({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM12 7C13.66 7 15 8.34 15 10C15 11.66 13.66 13 12 13C10.34 13 9 11.66 9 10C9 8.34 10.34 7 12 7ZM18 19H6V17.6C6 15.6 10 14.5 12 14.5C14 14.5 18 15.6 18 17.6V19Z" fill={color} />
    </Icon>
  );
}

export function IconKeeperAccount({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill={color} />
    </Icon>
  );
}

export function IconKeeperGroup({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M9 12C11.21 12 13 10.21 13 8C13 5.79 11.21 4 9 4C6.79 4 5 5.79 5 8C5 10.21 6.79 12 9 12Z" fill={color} />
      <path fillRule="evenodd" clipRule="evenodd" d="M16.67 13.13C18.04 14.06 19 15.32 19 17V20H23V17C23 14.82 19.43 13.53 16.67 13.13Z" fill={color} />
      <path d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C14.53 4 14.09 4.1 13.67 4.24C14.5 5.27 15 6.58 15 8C15 9.42 14.5 10.73 13.67 11.76C14.09 11.9 14.53 12 15 12Z" fill={color} />
      <path fillRule="evenodd" clipRule="evenodd" d="M9 13C6.33 13 1 14.34 1 17V20H17V17C17 14.34 11.67 13 9 13Z" fill={color} />
    </Icon>
  );
}

/** ID카드 — 운영 서비스 마지막 아이콘 */
export function IconIdCard({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18Z" fill={color} />
      <path d="M8 13C9.66 13 11 11.66 11 10C11 8.34 9.66 7 8 7C6.34 7 5 8.34 5 10C5 11.66 6.34 13 8 13Z" fill={color} />
      <path d="M14 17H5V15.5C5 14.12 6.34 13 8 13C9.66 13 11 14.12 11 15.5V17H14V17Z" fill={color} />
      <path d="M13 9H19V11H13V9ZM13 13H17V15H13V13Z" fill={color} />
    </Icon>
  );
}

// ─── Collapse 아이콘 ──────────────────────────────────────────────────────────

export function IconChevronsLeft({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function IconChevronsRight({ size, color = 'currentColor', ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}
