/**
 * @file utils/roomGroupSearch.ts
 * @description 지점 선택 검색 공통 유틸
 *
 * RoomGroupSelector(웹)와 RoomGroupBottomSheet(모바일) 양쪽에서 동일하게 사용.
 * React에 의존하지 않는 순수 함수만 포함.
 *
 * ─ 검색 지원 범위 ─────────────────────────────────────────────────────────
 *   - 한글 직접 포함 검색
 *   - 한글 자모 초성 검색 (ㄱ~ㅎ)
 *   - 영문(대소문자 무관), 숫자, 특수문자
 *   - 최대 글자 수: SEARCH_MAX_LEN (10자) — 컴포넌트 레벨에서 제한
 *
 * ─ filterByQuery 동작 정의 ────────────────────────────────────────────────
 *   - 빈 쿼리: 전체 브랜드·지점 반환
 *   - 브랜드명 매칭: 해당 브랜드 + 소속 지점 전체 노출
 *   - 지점명 매칭: 매칭 지점만 노출, 브랜드 내 결과 없으면 브랜드 헤더 숨김
 *   - 검색어 전체 삭제: 전체 목록 복원
 */

import type { RoomBrand, RoomGroup } from '@/types/auth';

/** 검색어 입력 최대 글자 수 */
export const SEARCH_MAX_LEN = 10;

/** 한글 초성 배열 */
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

/**
 * 한글 음절에서 초성 추출
 * 유니코드 계산: 초성 인덱스 = (code - 0xAC00) / 588
 */
function getChosung(char: string): string {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return char;
  return CHOSUNG[Math.floor(code / 588)];
}

/**
 * 텍스트가 검색어와 매칭되는지 확인
 * - 직접 포함 검색 (대소문자 무관)
 * - 한글 자모 초성 검색 지원
 */
export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;

  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // 직접 포함 여부
  if (t.includes(q)) return true;

  // 한글 초성 검색: 쿼리에 초성(ㄱ~ㅎ)이 하나라도 포함된 경우에만 수행
  const hasChosung = [...q].some((c) => CHOSUNG.includes(c));
  if (hasChosung) {
    const textChosung = [...t].map(getChosung).join('');
    if (textChosung.includes(q)) return true;
  }

  return false;
}

/** filterByQuery 반환 타입 */
export interface FilteredBrandGroup {
  brand: RoomBrand;
  groups: RoomGroup[];
}

/**
 * 검색어 기반 브랜드·지점 필터링
 *
 * @param brands  전체 브랜드 목록 (authStore.roomBrands)
 * @param groups  전체 지점 목록 (authStore.roomGroups)
 * @param query   검색어 (1초 디바운스 후 적용된 값)
 * @returns 브랜드별 매칭 지점 배열. 브랜드 내 결과 없으면 해당 브랜드 제외.
 */
export function filterByQuery(
  brands: RoomBrand[],
  groups: RoomGroup[],
  query: string
): FilteredBrandGroup[] {
  if (!query.trim()) {
    return brands.map((b) => ({
      brand: b,
      groups: groups.filter((g) => g.brandId === b.brandId),
    }));
  }

  return brands.reduce<FilteredBrandGroup[]>((acc, brand) => {
    const brandGroups = groups.filter((g) => g.brandId === brand.brandId);

    // 브랜드명 매칭 → 하위 지점 전체 노출
    if (matchesQuery(brand.brandName, query)) {
      acc.push({ brand, groups: brandGroups });
      return acc;
    }

    // 지점명 매칭 → 매칭된 지점만 노출
    const matched = brandGroups.filter((g) => matchesQuery(g.roomGroupName, query));
    if (matched.length > 0) acc.push({ brand, groups: matched });

    return acc;
  }, []);
}
