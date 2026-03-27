/**
 * @file components/dashboard/RoomGroupSelector.tsx
 * @description 지점 선택 드롭다운 컴포넌트 (웹 전용)
 *
 * ─ 계층 구조 ──────────────────────────────────────────────────────────────
 *   [전체]                              ← 전체 체크박스 (항상 최상단)
 *   [지점 그룹 (RoomBrand)]   예) 그레이 호텔 (3)
 *     └─ [지점 (RoomGroup)]   예) 강남점 ☑
 *
 * ─ 기능 정의 ──────────────────────────────────────────────────────────────
 *   1. 전체 행: 전체 선택/해제 (중간 상태 dash 표시)
 *   2. 지점 그룹 헤더: brandName + 소속 지점 수
 *   3. 지점 항목: 체크박스 + 지점명 — 다중 선택 가능
 *   4. 체크박스 선택 반영 트리거 (2가지):
 *      (1) 선택 후 1.5초 디바운스 → selectedRoomGroupIds 자동 반영 (드롭다운 유지)
 *      (2) 드롭다운 외부 클릭 → 즉시 반영 후 닫힘
 *   5. 검색 인풋박스:
 *      - 한글/영문/숫자/특수문자 입력 가능, 최대 10자 (SEARCH_MAX_LEN)
 *      - 입력 후 1초 디바운스로 결과 필터링
 *      - 검색 로직: @/utils/roomGroupSearch 참고
 *
 * ─ 초기화 정책 (2026-03-23 확정) ─────────────────────────────────────────
 *   드롭다운이 열릴 때 항상 미선택(빈) 상태로 초기화
 *   (이전에 선택한 값과 무관하게 매번 새로 시작)
 *
 * ─ 전체 선택 정책 ─────────────────────────────────────────────────────────
 *   전체 체크 → 모든 지점 선택 (pendingIds = 모든 roomGroupId)
 *   전체 해제 → 모든 선택 해제 (pendingIds = [])
 *   외부 클릭 시 전체가 선택된 상태 → selectedRoomGroupIds = [] (전체 의미)
 *   외부 클릭 시 일부 선택 상태 → selectedRoomGroupIds = pendingIds
 *
 * ─ RBAC 연동 ──────────────────────────────────────────────────────────────
 *   authStore.roomBrands + roomGroups: 서버가 권한 기반으로 필터링 후 전달
 *   프론트는 전달받은 목록 그대로 렌더링 (별도 권한 분기 없음)
 *
 * ─ BE 연동 가이드 ─────────────────────────────────────────────────────────
 *   roomBrands: fetchRoomBrands() → GET /shared/v1/room-brands (mock 전용)
 *   roomGroups: fetchRoomGroups() → GET /shared/v1/room-groups
 *   선택 결과: authStore.selectedRoomGroupIds → API 쿼리 파라미터 roomGroupIds
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { filterByQuery, SEARCH_MAX_LEN } from '@/utils/roomGroupSearch';

/* ── 컬러 토큰 ──────────────────────────────────────────────────────────── */
const PRIMARY       = '#1976D2';
const TEXT_PRIMARY  = 'rgba(0,0,0,0.87)';
const TEXT_SECOND   = 'rgba(0,0,0,0.60)';
const TEXT_DISABLED = 'rgba(0,0,0,0.38)';
const DIVIDER       = 'rgba(0,0,0,0.12)';
const BG_HOVER      = 'rgba(0,0,0,0.04)';
const BG_SELECTED   = 'rgba(25,118,210,0.08)';
const BG_GRAY       = '#F5F5F5';

/* ── 상수 ───────────────────────────────────────────────────────────────── */
const DEBOUNCE_APPLY_MS   = 1500;
const DEBOUNCE_SEARCH_MS  = 1000;
const DROPDOWN_WIDTH      = 280;
const DROPDOWN_MAX_HEIGHT = 400;

/* ── Props ──────────────────────────────────────────────────────────────── */
interface RoomGroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  zIndexOverride?: number;
}

/* ── 메인 컴포넌트 ───────────────────────────────────────────────────────── */
export function RoomGroupSelector({ isOpen, onClose, anchorRect, zIndexOverride }: RoomGroupSelectorProps) {
  const roomBrands     = useAuthStore((s) => s.roomBrands);
  const roomGroups     = useAuthStore((s) => s.roomGroups);
  const setSelectedIds = useAuthStore((s) => s.setSelectedRoomGroupIds);

  const allGroupIds = roomGroups.map((g) => g.roomGroupId);

  // 드롭다운 내부 임시 선택 상태
  // 초기화 정책: 열릴 때 항상 [] (미선택)
  const [pendingIds, setPendingIds]       = useState<string[]>([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filteredQuery, setFilteredQuery] = useState('');

  const dropdownRef    = useRef<HTMLDivElement>(null);
  const applyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 드롭다운 열릴 때 항상 미선택 상태로 초기화 */
  useEffect(() => {
    if (isOpen) {
      setPendingIds([]);       // ← 항상 빈 상태 (이전 선택값 무관)
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

  /* 외부 클릭 감지 → 즉시 반영 후 닫기 */
  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        applyAndClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingIds]);

  /* 적용 — pendingIds를 selectedIds에 커밋
   * 전체 선택 상태(pendingIds = 전체)이면 [] 저장 (전체 의미)
   * 미선택(pendingIds = [])이면 [] 저장 (전체 의미 — 디폴트)
   */
  const applyAndClose = useCallback(() => {
    if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
    const isAll = pendingIds.length === allGroupIds.length;
    setSelectedIds(isAll ? [] : pendingIds);
    onClose();
  }, [pendingIds, allGroupIds, setSelectedIds, onClose]);

  /* 전체 체크박스 토글 */
  const isAllChecked       = pendingIds.length === allGroupIds.length && allGroupIds.length > 0;
  const isAllIndeterminate = pendingIds.length > 0 && !isAllChecked;

  const handleAllToggle = useCallback(() => {
    const next = isAllChecked ? [] : [...allGroupIds];
    setPendingIds(next);
    // 1.5초 디바운스 자동 반영
    if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
    applyTimerRef.current = setTimeout(() => {
      setSelectedIds(isAllChecked ? [] : []);
    }, DEBOUNCE_APPLY_MS);
  }, [isAllChecked, allGroupIds, setSelectedIds]);

  /* 개별 지점 체크박스 토글 — 1.5초 디바운스 자동 반영 */
  const handleToggle = useCallback((id: string) => {
    setPendingIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id];
      if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
      applyTimerRef.current = setTimeout(() => {
        const isAll = next.length === allGroupIds.length;
        setSelectedIds(isAll ? [] : next);
      }, DEBOUNCE_APPLY_MS);
      return next;
    });
  }, [allGroupIds, setSelectedIds]);

  /* 클린업 */
  useEffect(() => {
    return () => {
      if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const filtered  = filterByQuery(roomBrands, roomGroups, filteredQuery);
  const hasResult = filtered.some((f) => f.groups.length > 0);

  /* 드롭다운 위치 계산 */
  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    width: DROPDOWN_WIDTH,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    background: '#FFFFFF',
    borderRadius: 8,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: zIndexOverride ?? 1200,
  };

  if (anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    if (spaceBelow >= DROPDOWN_MAX_HEIGHT || spaceBelow >= spaceAbove) {
      dropdownStyle.top   = anchorRect.bottom + 4;
      dropdownStyle.right = window.innerWidth - anchorRect.right;
    } else {
      dropdownStyle.bottom = window.innerHeight - anchorRect.top + 4;
      dropdownStyle.right  = window.innerWidth - anchorRect.right;
    }
  } else {
    dropdownStyle.top   = 60;
    dropdownStyle.right = 24;
  }

  return (
    <div ref={dropdownRef} style={dropdownStyle}>

      {/* ── 검색 인풋 ────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DIVIDER}`, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 40, border: `1px solid ${DIVIDER}`,
            borderRadius: 6, padding: '0 12px', background: '#FAFAFA',
          }}
        >
          <SearchIcon />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              if ([...val].length <= SEARCH_MAX_LEN) setSearchQuery(val);
            }}
            placeholder="검색"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
              color: TEXT_PRIMARY, lineHeight: '22px',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center',
              }}
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {/* ── 지점 목록 (스크롤) ───────────────────────────────────────── */}
      <div style={{ overflowY: 'auto', flex: 1 }}>

        {/* 전체 행 — 검색어 없을 때만 표시 */}
        {!filteredQuery && (
          <>
            <AllRow
              checked={isAllChecked}
              indeterminate={isAllIndeterminate}
              onToggle={handleAllToggle}
            />
            <div style={{ height: 1, background: DIVIDER }} />
          </>
        )}

        {!hasResult ? (
          <div
            style={{
              padding: '24px 16px', textAlign: 'center',
              fontSize: 13, color: TEXT_DISABLED,
              fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
            }}
          >
            검색 결과가 없습니다
          </div>
        ) : (
          filtered.map(({ brand, groups: brandGroups }) =>
            brandGroups.length > 0 ? (
              <div key={brand.brandId}>
                {/* 지점 그룹 헤더 */}
                <div
                  style={{
                    padding: '8px 16px 4px',
                    fontSize: 12, fontWeight: 600,
                    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                    color: TEXT_SECOND, letterSpacing: '0.40px',
                    background: BG_GRAY, userSelect: 'none',
                  }}
                >
                  {brand.brandName}
                  <span style={{ marginLeft: 4, color: TEXT_DISABLED, fontWeight: 400 }}>
                    ({brandGroups.length})
                  </span>
                </div>
                {/* 지점 항목들 */}
                {brandGroups.map((group) => (
                  <RoomGroupItem
                    key={group.roomGroupId}
                    label={group.roomGroupName}
                    checked={pendingIds.includes(group.roomGroupId)}
                    onToggle={() => handleToggle(group.roomGroupId)}
                  />
                ))}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}

/* ── 전체 행 ─────────────────────────────────────────────────────────────── */
function AllRow({
  checked, indeterminate, onToggle,
}: {
  checked: boolean; indeterminate: boolean; onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', height: 38,
        padding: '0 16px',
        background: checked ? BG_SELECTED : hovered ? BG_HOVER : '#F5F5F5',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.1s',
      }}
    >
      {/* 체크박스 */}
      <span
        style={{
          width: 18, height: 18, flexShrink: 0,
          border: `2px solid ${checked || indeterminate ? PRIMARY : 'rgba(0,0,0,0.38)'}`,
          borderRadius: 3,
          background: checked || indeterminate ? PRIMARY : 'transparent',
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
          fontSize: 14, fontWeight: 600,
          fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          color: checked ? PRIMARY : 'rgba(0,0,0,0.87)',
          lineHeight: '22px', letterSpacing: '0.20px',
        }}
      >
        전체
      </span>
    </button>
  );
}

/* ── 지점 항목 ───────────────────────────────────────────────────────────── */
function RoomGroupItem({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 16px',
        background: checked ? BG_SELECTED : hovered ? BG_HOVER : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.1s',
      }}
    >
      <span
        style={{
          width: 18, height: 18, flexShrink: 0,
          border: `2px solid ${checked ? PRIMARY : 'rgba(0,0,0,0.38)'}`,
          borderRadius: 3,
          background: checked ? PRIMARY : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.1s',
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span
        style={{
          fontSize: 14, fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          fontWeight: checked ? 500 : 400,
          color: checked ? PRIMARY : 'rgba(0,0,0,0.87)',
          lineHeight: '22px', letterSpacing: '0.20px', flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── 아이콘 ─────────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm4.74 7.27 3.49 3.49-1.06 1.06-3.49-3.49 1.06-1.06z" fill="rgba(0,0,0,0.38)" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M15 5 5 15M5 5l10 10" stroke="rgba(0,0,0,0.38)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
