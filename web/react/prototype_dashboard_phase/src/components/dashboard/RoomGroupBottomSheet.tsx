/**
 * @file components/dashboard/RoomGroupBottomSheet.tsx
 * @description 모바일 전용 — 지점 선택 바텀시트
 *
 * ─ 호출 조건 ─────────────────────────────────────────────────────────────
 *   모바일(≤ 1,061px) 환경에서 MobileHeader 드로어 → "지점 선택" 클릭 시 표시
 *   바텀시트 열릴 때 드로어는 닫힘 (MobileHeader에서 처리)
 *
 * ─ 피그마 스펙 (BottomSheet_지점.svg 기준) ───────────────────────────────
 *   시트: width 375, 상단 radius 24px, 흰 배경
 *   헤더: height 72px — "지점 선택"(좌) + X 닫기(우)
 *   검색: height 44px, border 1px rgba(0,0,0,0.23), radius 4px
 *   구분선: 1px #EEEEEE
 *   전체 행: height 38px, bg #F5F5F5
 *   브랜드 헤더: height 44px, bg #F5F5F5, 체크박스 포함
 *   지점 행 선택: height 38px, bg #1976D2 8%
 *   지점 행 미선택: height 38px, bg white
 *   하단 액션바: height 74px, shadow — 취소(회색) / 적용(파랑)
 *
 * ─ 선택 정책 ─────────────────────────────────────────────────────────────
 *   디폴트: 아무것도 선택 안 된 상태 (pendingIds = [])
 *   전체 체크: 모든 roomGroupId 선택
 *   전체 해제: 모든 선택 해제
 *   브랜드 헤더 체크: 해당 브랜드 하위 지점 전체 선택 (중간 상태 dash 표시)
 *   브랜드 헤더 해제: 해당 브랜드 하위 지점 전체 해제
 *   개별 지점 토글: 해당 지점만 on/off
 *
 * ─ 초기화 정책 (2026-03-23 확정) ─────────────────────────────────────────
 *   바텀시트가 열릴 때 항상 미선택(빈) 상태로 초기화
 *   (이전에 선택한 값과 무관하게 매번 새로 시작)
 *
 * ─ 반영 정책 ─────────────────────────────────────────────────────────────
 *   적용 버튼 클릭 → selectedRoomGroupIds 반영 + 닫기
 *   취소 버튼 / X 버튼 / dimmer 클릭 → 변경 없이 닫기
 *
 * ─ 검색 정책 ─────────────────────────────────────────────────────────────
 *   공통 유틸: @/utils/roomGroupSearch (matchesQuery, filterByQuery)
 *   1초 디바운스, 자모 초성 지원
 *   선택 반영은 하단 "적용" 버튼으로만 가능
 *
 * ─ POLICY.md 참고 ────────────────────────────────────────────────────────
 *   § 5-2 지점 선택, § 3-3 모바일 모드
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { filterByQuery, SEARCH_MAX_LEN } from '@/utils/roomGroupSearch';

/* ── 컬러 토큰 ──────────────────────────────────────────────────────────── */
const PRIMARY       = '#1976D2';
const TEXT_PRIMARY  = 'rgba(0,0,0,0.87)';
const TEXT_DISABLED = 'rgba(0,0,0,0.38)';
const DIVIDER_LIGHT = '#EEEEEE';
const BG_GRAY       = '#F5F5F5';
const BG_SELECTED   = 'rgba(25,118,210,0.08)';

/* ── 상수 ───────────────────────────────────────────────────────────────── */
const DEBOUNCE_SEARCH_MS = 1000;

/* ── Props ──────────────────────────────────────────────────────────────── */
export interface RoomGroupBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── 메인 컴포넌트 ───────────────────────────────────────────────────────── */
export function RoomGroupBottomSheet({ isOpen, onClose }: RoomGroupBottomSheetProps) {
  const roomBrands     = useAuthStore((s) => s.roomBrands);
  const roomGroups     = useAuthStore((s) => s.roomGroups);
  const setSelectedIds = useAuthStore((s) => s.setSelectedRoomGroupIds);

  const allGroupIds = roomGroups.map((g) => g.roomGroupId);

  const [pendingIds, setPendingIds]       = useState<string[]>([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filteredQuery, setFilteredQuery] = useState('');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 열릴 때 항상 미선택 상태로 초기화 (이전 선택값 무관) */
  useEffect(() => {
    if (isOpen) {
      setPendingIds([]);       // ← 항상 빈 상태
      setSearchQuery('');
      setFilteredQuery('');
    }
  }, [isOpen]);

  /* 검색 1초 디바운스 */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setFilteredQuery(searchQuery), DEBOUNCE_SEARCH_MS);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  /* 배경 스크롤 잠금 */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── 선택 핸들러 ──────────────────────────────────────────────────────── */

  const isAllChecked       = pendingIds.length === allGroupIds.length && allGroupIds.length > 0;
  const isAllIndeterminate = pendingIds.length > 0 && !isAllChecked;

  const handleAllToggle = useCallback(() => {
    setPendingIds(isAllChecked ? [] : [...allGroupIds]);
  }, [isAllChecked, allGroupIds]);

  const getBrandCheckState = useCallback((brandGroupIds: string[]) => {
    const checkedCount = brandGroupIds.filter((id) => pendingIds.includes(id)).length;
    if (checkedCount === 0) return 'none';
    if (checkedCount === brandGroupIds.length) return 'all';
    return 'some';
  }, [pendingIds]);

  const handleBrandToggle = useCallback((brandGroupIds: string[]) => {
    const state = getBrandCheckState(brandGroupIds);
    if (state === 'all') {
      setPendingIds((prev) => prev.filter((id) => !brandGroupIds.includes(id)));
    } else {
      setPendingIds((prev) => Array.from(new Set([...prev, ...brandGroupIds])));
    }
  }, [getBrandCheckState]);

  const handleGroupToggle = useCallback((id: string) => {
    setPendingIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  /* ── 하단 버튼 ────────────────────────────────────────────────────────── */

  const handleApply = useCallback(() => {
    // 전체 선택 or 미선택 → [] (전체 의미)
    // 일부 선택 → 해당 ids
    const isAll = pendingIds.length === allGroupIds.length;
    setSelectedIds(isAll ? [] : pendingIds);
    onClose();
  }, [pendingIds, allGroupIds, setSelectedIds, onClose]);

  const handleCancel = useCallback(() => onClose(), [onClose]);

  if (!isOpen) return null;

  const filtered      = filterByQuery(roomBrands, roomGroups, filteredQuery);
  const hasResult     = filtered.some((f) => f.groups.length > 0);
  const selectedCount = isAllChecked ? 0 : pendingIds.length;

  return (
    <>
      {/* ── 배경 dimmer ─────────────────────────────────────────────── */}
      <div
        onClick={handleCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
      />

      {/* ── 바텀시트 패널 ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: '#FFFFFF',
          borderRadius: '24px 24px 0 0',
          zIndex: 201,
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* pill 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.16)' }} />
        </div>

        {/* 헤더 */}
        <div
          style={{
            height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingLeft: 24, paddingRight: 16, flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: TEXT_PRIMARY, letterSpacing: '0.20px' }}>
            지점 선택
          </span>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="닫기"
            style={{ padding: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.54)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* 검색 인풋 */}
        <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12, flexShrink: 0 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 44, border: '1px solid rgba(0,0,0,0.23)',
              borderRadius: 4, padding: '0 12px', background: '#FFFFFF',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm4.74 7.27 3.49 3.49-1.06 1.06-3.49-3.49 1.06-1.06z" fill="rgba(0,0,0,0.38)" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                if ([...val].length <= SEARCH_MAX_LEN) setSearchQuery(val);
              }}
              placeholder="지점 검색"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 15, fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                color: TEXT_PRIMARY, lineHeight: '22px',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5 5 15M5 5l10 10" stroke="rgba(0,0,0,0.38)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: DIVIDER_LIGHT, flexShrink: 0 }} />

        {/* 스크롤 목록 */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* 전체 행 — 검색어 없을 때만 */}
          {!filteredQuery && (
            <CheckRow
              label="전체"
              checked={isAllChecked}
              indeterminate={isAllIndeterminate}
              onToggle={handleAllToggle}
              bgColor={BG_GRAY}
              isBold
              height={38}
            />
          )}
          {!filteredQuery && <div style={{ height: 1, background: DIVIDER_LIGHT }} />}

          {!hasResult ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 14, color: TEXT_DISABLED, fontFamily: 'Pretendard, Noto Sans KR, sans-serif' }}>
              검색 결과가 없습니다
            </div>
          ) : (
            filtered.map(({ brand, groups: brandGroups }) => {
              if (brandGroups.length === 0) return null;
              const brandGroupIds = brandGroups.map((g) => g.roomGroupId);
              const brandState    = getBrandCheckState(brandGroupIds);
              return (
                <div key={brand.brandId}>
                  <CheckRow
                    label={`${brand.brandName}(${brandGroups.length})`}
                    checked={brandState === 'all'}
                    indeterminate={brandState === 'some'}
                    onToggle={() => handleBrandToggle(brandGroupIds)}
                    bgColor={BG_GRAY}
                    isBold={false}
                    isGroup
                    height={44}
                  />
                  {brandGroups.map((group) => {
                    const checked = pendingIds.includes(group.roomGroupId);
                    return (
                      <CheckRow
                        key={group.roomGroupId}
                        label={group.roomGroupName}
                        checked={checked}
                        indeterminate={false}
                        onToggle={() => handleGroupToggle(group.roomGroupId)}
                        bgColor={checked ? BG_SELECTED : '#FFFFFF'}
                        isBold={false}
                        indent
                        height={38}
                      />
                    );
                  })}
                  <div style={{ height: 1, background: DIVIDER_LIGHT }} />
                </div>
              );
            })
          )}
        </div>

        {/* 하단 액션바 */}
        <div
          style={{
            height: 74, display: 'flex', alignItems: 'center', gap: 8,
            paddingLeft: 16, paddingRight: 16, flexShrink: 0,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 -4px 8px rgba(0,0,0,0.04)',
            background: '#FFFFFF',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              flex: 1, height: 42, borderRadius: 4, border: 'none',
              background: '#E0E0E0', cursor: 'pointer',
              fontSize: 15, fontWeight: 500,
              fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
              color: TEXT_PRIMARY, letterSpacing: '0.20px',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              flex: 3, height: 42, borderRadius: 4, border: 'none',
              background: PRIMARY, cursor: 'pointer',
              fontSize: 15, fontWeight: 500,
              fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
              color: '#FFFFFF', letterSpacing: '0.20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            적용
            {selectedCount > 0 && (
              <span
                style={{
                  minWidth: 20, height: 20, borderRadius: 10,
                  background: 'rgba(255,255,255,0.28)', color: '#FFFFFF',
                  fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}
              >
                {selectedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── CheckRow 서브 컴포넌트 ──────────────────────────────────────────────── */
function CheckRow({
  label, checked, indeterminate, onToggle,
  bgColor, isBold, isGroup = false, indent = false, height,
}: {
  label: string; checked: boolean; indeterminate: boolean;
  onToggle: () => void; bgColor: string; isBold: boolean;
  isGroup?: boolean; indent?: boolean; height: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%', minHeight: height,
        display: 'flex', alignItems: 'center', gap: 12,
        paddingLeft: indent ? 32 : 16, paddingRight: 16,
        paddingTop: 8, paddingBottom: 8,
        background: bgColor, border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 18, height: 18, flexShrink: 0,
          border: `2px solid ${checked || indeterminate ? '#1976D2' : 'rgba(0,0,0,0.38)'}`,
          borderRadius: 3,
          background: checked || indeterminate ? '#1976D2' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.1s',
        }}
      >
        {indeterminate && !checked && (
          <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
            <rect width="10" height="2" rx="1" fill="white" />
          </svg>
        )}
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span
        style={{
          fontSize: isGroup ? 13 : 15,
          fontWeight: isBold ? 600 : isGroup ? 600 : (checked ? 500 : 400),
          fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          color: isGroup ? 'rgba(0,0,0,0.60)' : checked ? '#1976D2' : 'rgba(0,0,0,0.87)',
          lineHeight: '22px',
          letterSpacing: isGroup ? '0.40px' : '0.20px',
          flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}
