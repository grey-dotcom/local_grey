/**
 * @file config/assets.config.ts
 * @description 정적 에셋 경로 중앙 관리
 * CDN 전환 시 NEXT_PUBLIC_ASSET_BASE_URL 하나만 바꾸면 전체 전환
 */

const BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? '';

export const LOGO = {
  keeper: `${BASE}/images/logo/Logotype.svg`,
} as const;

export const PLACEHOLDER = {
  image: `${BASE}/images/placeholder/no-image.svg`,
  avatar: `${BASE}/images/placeholder/avatar.svg`,
} as const;
