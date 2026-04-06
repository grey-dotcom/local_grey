'use client';

/**
 * @file components/dashboard/WidgetSelector.tsx
 * @description 위젯 표시 설정 — 웹: 드롭다운 / 모바일: 바텀시트
 *
 * POLICY §14 (2026-03-27 확정)
 * ⚠️ 76차: KPI 하위 위젯 개별 선택 기능 제거 — 나중에 필요 시 추가 예정
 *   kpi ON/OFF 토글만 표시. kpiTask/kpiIssue/kpiClaim/kpiRate 개별 토글 미노출.
 *   applyWidgetToggle 내 하위 연동 로직은 타입 호환 목적으로 유지.
 */

import { useEffect, useRef, useState } from 'react';

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

const TEXT_PRIMARY = 'rgba(0,0,0,0.87)';
const DIVIDER      = 'rgba(0,0,0,0.12)';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 58, height: 38, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
      <div style={{ position: 'absolute', left: 12, top: 12, width: 34, height: 14, background: checked ? '#1976D2' : 'black', opacity: checked ? 0.5 : 0.38, borderRadius: 100 }} />
      <div style={{ position: 'absolute', left: checked ? 20 : 0, top: 0, padding: 9, transition: 'left 0.15s' }}>
        <div style={{ width: 20, height: 20, borderRadius: 9999, background: checked ? '#1976D2' : '#F9FAFB', boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.20), 0px 1px 1px rgba(0,0,0,0.14), 0px 1px 3px rgba(0,0,0,0.12)' }} />
      </div>
    </div>
  );
}

// ⚠️ 76차: feed/issue/claim — ts(전체버전)에서는 표시, phase(배포버전) page.tsx에서 미렌더링
const TOP_WIDGETS: { key: keyof WidgetVisibility; label: string }[] = [
  { key: 'kpi',   label: '실시간 관리 지표' },
  { key: 'feed',  label: '변경사항 피드' },
  { key: 'issue', label: '처리 필요' },
  { key: 'claim', label: '클레임' },
];

interface WidgetSelectorProps {
  isOpen:      boolean;
  isMobile?:   boolean;
  onClose:     () => void;
  onApply?:    () => void;
  onCancel?:   () => void;
  visibility:  WidgetVisibility;
  onChange:    (next: WidgetVisibility) => void;
  anchorRect?: DOMRect | null;
}

export function WidgetSelector({ isOpen, isMobile = false, onClose, onApply, onCancel, visibility, onChange, anchorRect }: WidgetSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<WidgetVisibility>(visibility);

  useEffect(() => {
    if (isOpen) setDraft(visibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 10);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [isOpen, isMobile, onClose]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof WidgetVisibility) => {
    if (isMobile) { setDraft((prev) => applyWidgetToggle(prev, key)); }
    else { onChange(applyWidgetToggle(visibility, key)); }
  };

  const currentVis = isMobile ? draft : visibility;

  const renderRows = (paddingLeft: number) => (
    <div style={{ paddingTop: 8, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TOP_WIDGETS.map(({ key, label }) => (
        <div key={key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft, paddingRight: 16, paddingTop: 6, paddingBottom: 6, cursor: 'pointer', overflow: 'hidden' }} onClick={() => handleToggle(key)}>
              <span style={{ color: TEXT_PRIMARY, fontSize: 16, fontFamily: 'Noto Sans KR, Pretendard, sans-serif', fontWeight: 400, lineHeight: '24px', letterSpacing: '0.20px' }}>{label}</span>
            </div>
            <div style={{ paddingRight: 16 }}>
              <ToggleSwitch checked={currentVis[key]} onChange={() => handleToggle(key)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isMobile) {
    const dropStyle: React.CSSProperties = { position: 'fixed', width: 400, background: 'white', borderRadius: 4, boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 1200 };
    if (anchorRect) {
      const below = window.innerHeight - anchorRect.bottom;
      const above = anchorRect.top;
      if (below >= 320 || below >= above) { dropStyle.top = anchorRect.bottom + 4; dropStyle.right = window.innerWidth - anchorRect.right; }
      else { dropStyle.bottom = window.innerHeight - anchorRect.top + 4; dropStyle.right = window.innerWidth - anchorRect.right; }
    } else { dropStyle.top = 60; dropStyle.right = 24; }
    return (
      <div ref={ref} style={dropStyle}>
        <div style={{ paddingTop: 12, paddingBottom: 6, paddingLeft: 16, paddingRight: 16 }}>
          <span style={{ color: TEXT_PRIMARY, fontSize: 16, fontFamily: 'Noto Sans KR, Pretendard, sans-serif', fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px' }}>위젯 표시 설정</span>
        </div>
        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ height: 0, outline: `1px solid ${DIVIDER}`, outlineOffset: -0.5 }} />
        </div>
        {renderRows(16)}
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1199 }} onClick={onClose} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', zIndex: 1200, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 72, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 24, paddingRight: 24, borderBottom: '0.75px solid #DEDEDE', flexShrink: 0 }}>
          <span style={{ color: '#2E2E2E', fontSize: 16, fontFamily: 'Noto Sans KR, Pretendard, sans-serif', fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px' }}>위젯 표시 설정</span>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="rgba(0,0,0,0.87)" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16 }}>{renderRows(24)}</div>
        <div style={{ height: 73, background: 'white', flexShrink: 0, boxShadow: '0px -4px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', padding: 16, gap: 8 }}>
          <button type="button" onClick={() => { setDraft(visibility); onCancel?.(); onClose(); }} style={{ width: 88, height: 42, background: '#E0E0E0', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 500, fontFamily: 'Noto Sans KR, Pretendard, sans-serif', color: 'rgba(0,0,0,0.87)', cursor: 'pointer', letterSpacing: '0.20px' }}>취소</button>
          <button type="button" onClick={() => { onChange(draft); onApply?.(); onClose(); }} style={{ flex: 1, height: 42, background: '#1976D2', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 500, fontFamily: 'Noto Sans KR, Pretendard, sans-serif', color: 'white', cursor: 'pointer', letterSpacing: '0.20px' }}>적용</button>
        </div>
      </div>
    </>
  );
}
