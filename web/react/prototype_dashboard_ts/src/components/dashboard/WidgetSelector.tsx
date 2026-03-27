'use client';

/**
 * @file components/dashboard/WidgetSelector.tsx
 * @description 위젯 표시 설정 — 웹: 드롭다운 / 모바일: 바텀시트
 *
 * POLICY §14 (2026-03-27 확정)
 * POLICY §14-6 KPI 하위 연동 규칙
 * - 실시간 관리지표 ON  → 하위 4종 모두 ON
 * - 실시간 관리지표 OFF → 하위 4종 모두 OFF
 * - 하위 4종 모두 OFF  → 실시간 관리지표 자동 OFF
 *
 * CSS 스펙 (피그마 기준):
 * 웹: border-radius 4px, box-shadow 3단, paddingLeft 16px
 * 모바일: 바텀시트 border-radius 상단 24px, paddingLeft 24px, 하단 취소/적용 버튼
 */

import { useEffect, useRef, useState } from 'react';

/* ── 타입 ────────────────────────────────────────────────────────────────── */
export interface WidgetVisibility {
  kpi:      boolean;
  kpiTask:  boolean;
  kpiIssue: boolean;
  kpiClaim: boolean;
  kpiRate:  boolean;
  feed:     boolean;
  issue:    boolean;
  claim:    boolean;
}

export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibility = {
  kpi: true, kpiTask: true, kpiIssue: true, kpiClaim: true, kpiRate: true,
  feed: true, issue: true, claim: true,
};

const KPI_SUB_KEYS = ['kpiTask', 'kpiIssue', 'kpiClaim', 'kpiRate'] as const;

export function applyWidgetToggle(prev: WidgetVisibility, key: keyof WidgetVisibility): WidgetVisibility {
  const next = { ...prev, [key]: !prev[key] };
  if (key === 'kpi') {
    KPI_SUB_KEYS.forEach((k) => { next[k] = next.kpi; });
  } else if (KPI_SUB_KEYS.includes(key as typeof KPI_SUB_KEYS[number])) {
    next.kpi = KPI_SUB_KEYS.some((k) => next[k]);
  }
  return next;
}

/* ── 컬러 (CSS 스펙 기준) ────────────────────────────────────────────────── */
const TEXT_PRIMARY   = 'rgba(0,0,0,0.87)';
const DIVIDER        = 'rgba(0,0,0,0.12)';

/* ── 토글 스위치 (피그마 스펙: 58×38, ON knob #1976D2, OFF knob #F9FAFB) ─── */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{ width: 58, height: 38, position: 'relative', cursor: 'pointer', flexShrink: 0 }}
    >
      {/* 트랙 */}
      <div style={{
        position: 'absolute', left: 12, top: 12,
        width: 34, height: 14,
        background: checked ? '#1976D2' : 'black',
        opacity: checked ? 0.5 : 0.38,
        borderRadius: 100,
      }} />
      {/* 노브 */}
      <div style={{
        position: 'absolute',
        left: checked ? 20 : 0,
        top: 0,
        padding: 9,
        transition: 'left 0.15s',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 9999,
          background: checked ? '#1976D2' : '#F9FAFB',
          boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.20), 0px 1px 1px rgba(0,0,0,0.14), 0px 1px 3px rgba(0,0,0,0.12)',
        }} />
      </div>
    </div>
  );
}

/* ── 위젯 아이콘은 하위(KPI_SUB_WIDGETS)에만 유지 — 상위 아이콘 삭제됨 (60차) ── */

/* ── 위젯 목록 메타 — 상위 아이콘 제거 (60차), 하위 아이콘은 KPI_SUB_WIDGETS에 유지 ── */
const TOP_WIDGETS: { key: keyof WidgetVisibility; label: string; hasChildren?: boolean }[] = [
  { key: 'kpi',   label: '실시간 관리 지표', hasChildren: true },
  { key: 'feed',  label: '변경사항 피드' },
  { key: 'issue', label: '처리 필요' },
  { key: 'claim', label: '클레임' },
];

// KPI 하위: 아이콘 포함
const KPI_SUB_WIDGETS: { key: keyof WidgetVisibility; label: string; iconSrc: string; iconW?: number }[] = [
  { key: 'kpiTask',  label: '업무 현황',       iconSrc: '/images/icons/kpi_task.svg' },
  { key: 'kpiIssue', label: '미해결 이슈',      iconSrc: '/images/icons/kpi_issue.svg', iconW: 18 },
  { key: 'kpiClaim', label: '미확인 클레임',    iconSrc: '/images/icons/kpi_claim.svg' },
  { key: 'kpiRate',  label: '오늘 업무 달성률', iconSrc: '/images/icons/kpi_rate.svg' },
];

/* ── Props ──────────────────────────────────────────────────────────────── */
interface WidgetSelectorProps {
  isOpen:      boolean;
  isMobile?:   boolean;
  onClose:     () => void;
  onApply?:    () => void;     // 모바일: 적용 버튼
  onCancel?:   () => void;     // 모바일: 취소 버튼
  visibility:  WidgetVisibility;
  onChange:    (next: WidgetVisibility) => void;
  anchorRect?: DOMRect | null; // 웹 드롭다운 위치
}

/* ══════════════════════════════════════════════════════════════════════════
   웹 드롭다운
══════════════════════════════════════════════════════════════════════════ */
export function WidgetSelector({
  isOpen, isMobile = false, onClose, onApply, onCancel,
  visibility, onChange, anchorRect,
}: WidgetSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [kpiExpanded, setKpiExpanded] = useState(true);
  // 모바일: 취소용 임시 상태 보관
  const [draft, setDraft] = useState<WidgetVisibility>(visibility);

  useEffect(() => {
    if (isOpen) setDraft(visibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 웹: 외부 클릭 닫기
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [isOpen, isMobile, onClose]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof WidgetVisibility) => {
    if (isMobile) {
      setDraft((prev) => applyWidgetToggle(prev, key));
    } else {
      onChange(applyWidgetToggle(visibility, key));
    }
  };

  const currentVis = isMobile ? draft : visibility;

  /* ── 공통 위젯 목록 렌더 ──
   * 수정 이력 (60차):
   * - 상위 위젯 간 gap: 4 → 8px
   * - 아코디언 화살표: 닫힘 시 rotate(-90deg)→우측 에서 rotate(-180deg)→위쪽으로 변경
   * - 상위 위젯 아이콘(KpiIcon/FeedIcon/IssueIcon/ClaimIcon) 제거 (하위는 유지)
   * ── */
  const renderRows = (paddingLeft: number) => (
    <div style={{ paddingTop: 8, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TOP_WIDGETS.map(({ key, label, hasChildren }) => {
        const isKpi = key === 'kpi';
        return (
          <div key={key}>
            {/* 상위 행 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              {/* 좌측: 라벨 (아이콘 제거 — 60차) */}
              <div
                style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  paddingLeft, paddingRight: 16, paddingTop: 6, paddingBottom: 6,
                  cursor: 'pointer', overflow: 'hidden',
                }}
                onClick={() => handleToggle(key)}
              >
                <span style={{
                  color: TEXT_PRIMARY, fontSize: 16,
                  fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
                  fontWeight: 400, lineHeight: '24px', letterSpacing: '0.20px',
                }}>
                  {label}
                </span>
              </div>

              {/* 우측: 아코디언 화살표 + 토글 */}
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16, gap: 0 }}>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setKpiExpanded((p) => !p); }}
                    style={{
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      padding: '4px 6px', display: 'flex', alignItems: 'center',
                    }}
                  >
                    {/* 펼침: rotate(0deg)=아래↓ / 닫힘: rotate(-180deg)=위↑ (60차: 상하 방향으로 변경) */}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      style={{
                        transform: kpiExpanded ? 'rotate(0deg)' : 'rotate(-180deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <path d="M7 10l5 5 5-5" stroke="rgba(0,0,0,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <ToggleSwitch checked={currentVis[key]} onChange={() => handleToggle(key)} />
              </div>
            </div>

            {/* KPI 하위 아코디언 */}
            {isKpi && (
              <div style={{
                maxHeight: kpiExpanded && currentVis.kpi ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.25s ease',
              }}>
                {KPI_SUB_WIDGETS.map(({ key: subKey, label: subLabel, iconSrc, iconW = 20 }) => (
                  <div
                    key={subKey}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggle(subKey)}
                  >
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      paddingLeft: paddingLeft + 16, paddingRight: 16,
                      paddingTop: 4, paddingBottom: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{ minWidth: 36, display: 'flex', alignItems: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={iconSrc} alt="" width={iconW} height={iconW} style={{ objectFit: 'contain' }} />
                      </div>
                      <span style={{
                        color: currentVis[subKey] ? TEXT_PRIMARY : 'rgba(0,0,0,0.45)',
                        fontSize: 14,
                        fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
                        fontWeight: 400, lineHeight: '22px', letterSpacing: '0.20px',
                      }}>
                        {subLabel}
                      </span>
                    </div>
                    <div style={{ paddingRight: 16 }}>
                      <ToggleSwitch checked={currentVis[subKey]} onChange={() => handleToggle(subKey)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── 웹 드롭다운 ── */
  if (!isMobile) {
    const dropStyle: React.CSSProperties = {
      position: 'fixed', width: 400,
      background: 'white', borderRadius: 4,
      boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
      overflow: 'hidden', zIndex: 1200,
    };
    if (anchorRect) {
      const below = window.innerHeight - anchorRect.bottom;
      const above = anchorRect.top;
      if (below >= 320 || below >= above) {
        dropStyle.top   = anchorRect.bottom + 4;
        dropStyle.right = window.innerWidth - anchorRect.right;
      } else {
        dropStyle.bottom = window.innerHeight - anchorRect.top + 4;
        dropStyle.right  = window.innerWidth - anchorRect.right;
      }
    } else {
      dropStyle.top = 60; dropStyle.right = 24;
    }

    return (
      <div ref={ref} style={dropStyle}>
        {/* 헤더 */}
        <div style={{ paddingTop: 12, paddingBottom: 6, paddingLeft: 16, paddingRight: 16 }}>
          <span style={{
            color: TEXT_PRIMARY, fontSize: 16,
            fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
            fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px',
          }}>
            위젯 표시 설정
          </span>
        </div>
        {/* 헤더 구분선 */}
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ height: 0, outline: `1px solid ${DIVIDER}`, outlineOffset: -0.5 }} />
        </div>
        {/* 위젯 목록 */}
        {renderRows(16)}
      </div>
    );
  }

  /* ── 모바일 바텀시트 ── */
  return (
    <>
      {/* 딤 */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1199 }}
        onClick={onClose}
      />
      {/* 바텀시트 */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden', zIndex: 1200,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* 헤더 */}
        <div style={{
          height: 72, background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingLeft: 24, paddingRight: 24,
          borderBottom: '0.75px solid #DEDEDE',
          flexShrink: 0,
        }}>
          <span style={{
            color: '#2E2E2E', fontSize: 16,
            fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
            fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px',
          }}>
            위젯 표시 설정
          </span>
          {/* X 닫기 */}
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="rgba(0,0,0,0.87)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 스크롤 가능한 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>
          {renderRows(24)}
        </div>

        {/* 하단 취소/적용 버튼 */}
        <div style={{
          height: 73, background: 'white', flexShrink: 0,
          boxShadow: '0px -4px 4px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center',
          padding: 16, gap: 8,
        }}>
          <button
            type="button"
            onClick={() => { setDraft(visibility); onCancel?.(); onClose(); }}
            style={{
              width: 88, height: 42,
              background: '#E0E0E0', border: 'none', borderRadius: 4,
              fontSize: 15, fontWeight: 500,
              fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
              color: 'rgba(0,0,0,0.87)', cursor: 'pointer',
              letterSpacing: '0.20px',
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => { onChange(draft); onApply?.(); onClose(); }}
            style={{
              flex: 1, height: 42,
              background: '#1976D2', border: 'none', borderRadius: 4,
              fontSize: 15, fontWeight: 500,
              fontFamily: 'Noto Sans KR, Pretendard, sans-serif',
              color: 'white', cursor: 'pointer',
              letterSpacing: '0.20px',
            }}
          >
            적용
          </button>
        </div>
      </div>
    </>
  );
}
