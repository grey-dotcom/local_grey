/**
 * @file components/dashboard/RoomGroupSelector.tsx
 * @description 지점 선택 드롭다운 컴포넌트 (웹 전용)
 *
 * ─ 기능 정의 ──────────────────────────────────────────────────────────────
 *   1. 지점 그룹 헤더: brandName + 소속 지점 수
 *   2. 지점 항목: 체크박스 + 지점명 — 다중 선택 가능 (최대 10개)
 *   3. 체크박스 선택 반영 트리거:
 *      (1) 선택 후 1.5초 디바운스 → selectedRoomGroupIds 자동 반영 (드롭다운 유지)
 *      (2) 드롭다운 외부 클릭 → 즉시 반영 후 닫힘
 *      ⚠️ 76차: 선택 카운팅 UI 제거 / 하단 적용 버튼 제거 — 디바운스만 사용
 *   4. 검색 인풋박스: 최대 10자, 1초 디바운스
 *
 * ─ 10개 제한 정책 (C 정책 — 68차) ───────────────────────────────────────
 *   최대 MAX_SELECTION(10)개까지 선택 가능
 *   10개 초과 선택 시 추가 체크박스 비활성화
 *   ⚠️ 76차: 카운터 UI("N/10 선택됨") 제거 — 나중에 필요 시 추가 예정
 *
 * ─ 저장 정책 (D 정책 — 68차) ─────────────────────────────────────────────
 *   authStore persist / 드롭다운 열릴 때 저장된 선택값 복원 / 로그아웃 시 초기화
 *
 * ─ BE 연동 가이드 ─────────────────────────────────────────────────────────
 *   roomBrands: GET /shared/v1/room-brands
 *   roomGroups: GET /shared/v1/room-groups
 *   선택 결과: authStore.selectedRoomGroupIds → API 파라미터 roomGroupIds
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { filterByQuery, SEARCH_MAX_LEN } from '@/utils/roomGroupSearch';

const PRIMARY       = '#1976D2';
const TEXT_PRIMARY  = 'rgba(0,0,0,0.87)';
const TEXT_SECOND   = 'rgba(0,0,0,0.60)';
const TEXT_DISABLED = 'rgba(0,0,0,0.38)';
const DIVIDER       = 'rgba(0,0,0,0.12)';
const BG_HOVER      = 'rgba(0,0,0,0.04)';
const BG_SELECTED   = 'rgba(25,118,210,0.08)';
const BG_GRAY       = '#F5F5F5';

const DEBOUNCE_APPLY_MS   = 1500;
const DEBOUNCE_SEARCH_MS  = 1000;
const DROPDOWN_WIDTH      = 280;
const DROPDOWN_MAX_HEIGHT = 400;
const MAX_SELECTION       = 10;

interface RoomGroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  zIndexOverride?: number;
}

export function RoomGroupSelector({ isOpen, onClose, anchorRect, zIndexOverride }: RoomGroupSelectorProps) {
  const roomBrands           = useAuthStore((s) => s.roomBrands);
  const roomGroups           = useAuthStore((s) => s.roomGroups);
  const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);
  const setSelectedIds       = useAuthStore((s) => s.setSelectedRoomGroupIds);

  const [pendingIds, setPendingIds]       = useState<string[]>([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const [filteredQuery, setFilteredQuery] = useState('');

  const dropdownRef    = useRef<HTMLDivElement>(null);
  const applyTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPendingIds(selectedRoomGroupIds);
      setSearchQuery('');
      setFilteredQuery('');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setFilteredQuery(searchQuery), DEBOUNCE_SEARCH_MS);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        applyAndClose();
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handleOutsideClick), 10);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleOutsideClick); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingIds]);

  const applyAndClose = useCallback(() => {
    if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
    setSelectedIds(pendingIds);
    onClose();
  }, [pendingIds, setSelectedIds, onClose]);

  const handleToggle = useCallback((id: string) => {
    setPendingIds((prev) => {
      const isChecked = prev.includes(id);
      if (isChecked) {
        const next = prev.filter((i) => i !== id);
        if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
        applyTimerRef.current = setTimeout(() => setSelectedIds(next), DEBOUNCE_APPLY_MS);
        return next;
      }
      if (prev.length >= MAX_SELECTION) return prev;
      const next = [...prev, id];
      if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
      applyTimerRef.current = setTimeout(() => setSelectedIds(next), DEBOUNCE_APPLY_MS);
      return next;
    });
  }, [setSelectedIds]);

  useEffect(() => {
    return () => {
      if (applyTimerRef.current) clearTimeout(applyTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const filtered      = filterByQuery(roomBrands, roomGroups, filteredQuery);
  const hasResult     = filtered.some((f) => f.groups.length > 0);
  const selectedCount = pendingIds.length;
  const isAtLimit     = selectedCount >= MAX_SELECTION;

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed', width: DROPDOWN_WIDTH, maxHeight: DROPDOWN_MAX_HEIGHT,
    background: '#FFFFFF', borderRadius: 8,
    boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
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

      {/* 검색 인풋 */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DIVIDER}`, flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 40,
          border: `1px solid ${DIVIDER}`, borderRadius: 6, padding: '0 12px', background: '#FAFAFA',
        }}>
          <SearchIcon />
          <input
            autoFocus type="text" value={searchQuery}
            onChange={(e) => { const val = e.target.value; if ([...val].length <= SEARCH_MAX_LEN) setSearchQuery(val); }}
            placeholder="검색"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: TEXT_PRIMARY, lineHeight: '22px' }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {/* 지점 목록 */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {!hasResult ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: TEXT_DISABLED, fontFamily: 'Pretendard, Noto Sans KR, sans-serif' }}>
            검색 결과가 없습니다
          </div>
        ) : (
          filtered.map(({ brand, groups: brandGroups }) =>
            brandGroups.length > 0 ? (
              <div key={brand.brandId}>
                <div style={{ padding: '8px 16px 4px', fontSize: 12, fontWeight: 600, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: TEXT_SECOND, letterSpacing: '0.40px', background: BG_GRAY, userSelect: 'none' }}>
                  {brand.brandName}
                  <span style={{ marginLeft: 4, color: TEXT_DISABLED, fontWeight: 400 }}>({brandGroups.length})</span>
                </div>
                {brandGroups.map((group) => {
                  const isChecked  = pendingIds.includes(group.roomGroupId);
                  const isDisabled = isAtLimit && !isChecked;
                  return <RoomGroupItem key={group.roomGroupId} label={group.roomGroupName} checked={isChecked} disabled={isDisabled} onToggle={() => handleToggle(group.roomGroupId)} />;
                })}
              </div>
            ) : null
          )
        )}
        {isAtLimit && (
          <div style={{ padding: '8px 16px', fontSize: 12, color: '#D32F2F', fontFamily: 'Pretendard, Noto Sans KR, sans-serif', background: '#FFF8F8', borderTop: `1px solid ${DIVIDER}` }}>
            최대 {MAX_SELECTION}개까지 선택할 수 있습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function RoomGroupItem({ label, checked, disabled, onToggle }: { label: string; checked: boolean; disabled: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={disabled ? undefined : onToggle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: checked ? BG_SELECTED : hovered && !disabled ? BG_HOVER : 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'background 0.1s', opacity: disabled ? 0.4 : 1 }}>
      <span style={{ width: 18, height: 18, flexShrink: 0, border: `2px solid ${checked ? PRIMARY : disabled ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.38)'}`, borderRadius: 3, background: checked ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <span style={{ fontSize: 14, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: checked ? 500 : 400, color: disabled && !checked ? 'rgba(0,0,0,0.38)' : checked ? PRIMARY : 'rgba(0,0,0,0.87)', lineHeight: '22px', letterSpacing: '0.20px', flex: 1 }}>
        {label}
      </span>
    </button>
  );
}

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm4.74 7.27 3.49 3.49-1.06 1.06-3.49-3.49 1.06-1.06z" fill="rgba(0,0,0,0.38)" /></svg>;
}
function ClearIcon() {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M15 5 5 15M5 5l10 10" stroke="rgba(0,0,0,0.38)" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
