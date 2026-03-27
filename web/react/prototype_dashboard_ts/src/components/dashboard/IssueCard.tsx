/**
 * @file components/dashboard/IssueCard.tsx
 * @description 처리 필요 — 개별 이슈 카드 컴포넌트 (기초 UI)
 *
 * ─ Claude Code 작업 (서브) ────────────────────────────────────────────────
 *   FeedCard.tsx 스타일 패턴 참고, SVG 디자인 기준 구현
 *   공통 요소: ImageGrid, ActionButton(hover), ConfirmModal — FeedCard 패턴 이식
 *   정책 로직은 Claude Desktop에서 후속 반영
 *
 * ─ 배지 구성 ──────────────────────────────────────────────────────────────
 *   [NEW]  isNew === true 일 때 노출
 *   [이슈타입]  issueType 한글 라벨 + ! 아이콘 (#FEEBEE / #FF1744)
 *   [상태]  issueStatus 한글 라벨 (상태별 색상 차등)
 *   COMPLETED: 상태배지(check) → 이슈타입배지 순서
 *   그 외:     이슈타입배지 → 상태배지 순서
 *   flexWrap: wrap + overflow: visible — 62차 FeedCard와 정책 통일 (배지 초과 시 두 줄 처리)
 *
 * ─ 좌측 색상바 ────────────────────────────────────────────────────────────
 *   모든 상태 → #FF1744 (빨강) — SVG 디자인 기준 통일
 *
 * ─ 예외처리 ───────────────────────────────────────────────────────────────
 *   photoUrls 빈 배열 → 이미지 미노출
 *   processingComment null → 코멘트 영역 미노출
 *   scheduledDate null → 일정 영역 미노출
 *
 * ─ 액션 버튼 (FeedCard ActionButton 패턴 이식) ────────────────────────────
 *   hover 상태, variant 시스템, 반응형 사이즈 — FeedCard와 동일
 *   상태변경 전 ConfirmModal 표시 — FeedCard와 동일 패턴
 */

'use client';

import { useState } from 'react';
import type { IssueReport, IssueType } from '@/types/dashboard';

// ── 이슈타입 한글 라벨 ────────────────────────────────────────────────────
const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  DAMAGE:        '파손',
  MALFUNCTION:   '기기 작동 불량',
  CONTAMINATION: '오염',
  SHORTAGE:      '비품 부족',
  PROBLEM:       '문제 발생',
  ETC:           '기타',
};

// ── 상태 배지 ─────────────────────────────────────────────────────────────
interface BadgeConfig { text: string; bg: string; color: string; icon?: 'check' }

function getStatusBadge(status: IssueReport['issueStatus']): BadgeConfig {
  switch (status) {
    case 'RECEIVED':  return { text: '접수',  bg: '#E3F2FD', color: '#0D47A1' };
    case 'PENDING':   return { text: '대기',  bg: '#EEEEEE', color: '#212121' };
    case 'CONFIRMED': return { text: '확정',  bg: '#E8F5E9', color: '#1B5E20' };
    case 'COMPLETED': return { text: '완료',  bg: '#E8F5E9', color: '#1B5E20', icon: 'check' };
    default:          return { text: status,   bg: '#EEEEEE', color: '#212121' };
  }
}

// ── 시간 포맷 ─────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  const d   = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateOnly(iso: string): string {
  const d   = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── 이미지 그리드 (FeedCard 동일 패턴) ──────────────────────────────────
function ImageGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  const count = Math.min(urls.length, 3);
  const gridStyle: React.CSSProperties = count === 1
    ? { gridTemplateColumns: '1fr', height: 170 }
    : count === 2
      ? { gridTemplateColumns: 'repeat(2, 1fr)', height: 100 }
      : { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '140px 100px' };
  return (
    <div style={{ display: 'grid', gap: 4, borderRadius: 8, overflow: 'hidden', ...gridStyle }}>
      {urls.slice(0, count).map((url, i) => (
        <div key={i} style={{
          position: 'relative', overflow: 'hidden', borderRadius: 8,
          border: '1px solid #e0e0e0',
          ...(count === 3 && i === 0 ? { gridColumn: '1 / -1' } : {}),
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`사진 ${i + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

// ── 확인 팝업 (FeedCard ConfirmModal 패턴 이식) ─────────────────────────
function ConfirmModal({ title, contents, onConfirm, onCancel }: {
  title: string; contents?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white', borderRadius: 12,
          width: 400, maxWidth: '90vw',
          padding: '28px 24px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{
          margin: 0, fontSize: 16, fontWeight: 700,
          color: 'rgba(0,0,0,0.87)', lineHeight: '24px', letterSpacing: '0.15px',
        }}>{title}</p>
        {contents && (
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 400,
            color: 'rgba(0,0,0,0.60)', lineHeight: '20px', letterSpacing: '0.20px',
          }}>{contents}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onCancel} style={{
            height: 36, paddingInline: 16,
            background: 'none', border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: 4, cursor: 'pointer',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: 'rgba(0,0,0,0.87)',
          }}>취소</button>
          <button type="button" onClick={onConfirm} style={{
            height: 36, paddingInline: 16,
            background: '#1976D2', border: 'none',
            borderRadius: 4, cursor: 'pointer',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: 'white',
          }}>확인</button>
        </div>
      </div>
    </div>
  );
}

// ── 버튼 variant 시스템 (FeedCard ActionButton 패턴 이식) ────────────────
type BtnVariant = 'primary-contained' | 'neutral-outlined';

function IssueActionButton({ label, variant, isMobile, onClick }: {
  label: string; variant: BtnVariant; isMobile: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const base: React.CSSProperties = {
    height: isMobile ? 30 : 36,
    paddingInline: isMobile ? 10 : 16,
    paddingBlock: isMobile ? 4 : 6,
    fontSize: isMobile ? 13 : 14,
    fontWeight: 500, fontFamily: 'inherit', borderRadius: 4,
    cursor: 'pointer', letterSpacing: '0.20px',
    transition: 'background 0.15s, box-shadow 0.15s',
  };
  const styles: Record<BtnVariant, React.CSSProperties> = {
    'primary-contained': { ...base, border: 'none', background: hovered ? '#1565C0' : '#1976D2', color: 'white', boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' },
    'neutral-outlined':  { ...base, border: '1px solid rgba(0,0,0,0.23)', background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent', color: 'rgba(0,0,0,0.87)' },
  };
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={styles[variant]}>
      {label}
    </button>
  );
}

// ── 이슈타입 배지 렌더 ───────────────────────────────────────────────────
function IssueTypeBadge({ issueType, fontSize, isMobile }: { issueType: IssueType; fontSize: number; isMobile: boolean }) {
  return (
    <span style={{
      height: 30, paddingInline: 8, paddingBlock: 4,
      background: '#FEEBEE', borderRadius: 8,
      color: '#FF1744', fontSize, fontWeight: isMobile ? 700 : 500,
      display: 'flex', alignItems: 'center', gap: 4,
      lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#FF1744" />
      </svg>
      {ISSUE_TYPE_LABEL[issueType] ?? issueType}
    </span>
  );
}

// ── 상태 배지 렌더 ───────────────────────────────────────────────────────
function StatusBadge({ badge, fontSize, isMobile }: { badge: BadgeConfig; fontSize: number; isMobile: boolean }) {
  return (
    <span style={{
      height: 30, paddingInline: 8, paddingBlock: 4,
      background: badge.bg, borderRadius: 8,
      color: badge.color, fontSize,
      fontWeight: (isMobile || badge.icon === 'check') ? 700 : 500,
      display: 'flex', alignItems: 'center', gap: 4,
      lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {badge.icon === 'check' && (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill={badge.color} />
        </svg>
      )}
      {badge.text}
    </span>
  );
}

// ── 상태별 액션 버튼 정의 (SVG 디자인 기준) ─────────────────────────────
function getNextAction(status: IssueReport['issueStatus']): { label: string; nextStatus: IssueReport['issueStatus'] } | null {
  switch (status) {
    case 'RECEIVED':  return { label: '대기 처리', nextStatus: 'PENDING' };
    case 'PENDING':   return { label: '확정',      nextStatus: 'CONFIRMED' };
    case 'CONFIRMED': return { label: '완료 처리', nextStatus: 'COMPLETED' };
    case 'COMPLETED': return null;
    default:          return null;
  }
}

// ── 확인 팝업 스펙 ──────────────────────────────────────────────────────
function getConfirmConfig(action: 'hold' | 'next', nextLabel: string): { title: string; contents?: string } {
  if (action === 'hold') {
    return { title: '선택하신 이슈를 보류 처리하시겠습니까?' };
  }
  if (nextLabel === '완료 처리') {
    return { title: '선택하신 이슈를 완료 처리하시겠습니까?', contents: '완료 처리된 이슈는 복구할 수 없습니다.' };
  }
  return { title: `선택하신 이슈를 ${nextLabel} 하시겠습니까?` };
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────
interface IssueCardProps {
  issue: IssueReport;
  isMobile?: boolean;
  onDismissNew?: (issueId: string) => void;
  onStatusChange?: (issueId: string, newStatus: IssueReport['issueStatus']) => void;
}

export function IssueCard({ issue, isMobile = false, onDismissNew, onStatusChange }: IssueCardProps) {
  const [cardHovered, setCardHovered] = useState(false);
  const [confirmType, setConfirmType] = useState<'hold' | 'next' | null>(null);

  const statusBadge = getStatusBadge(issue.issueStatus);
  const isCompleted = issue.issueStatus === 'COMPLETED';
  const nextAction  = getNextAction(issue.issueStatus);

  const handleDismissNew = () => {
    if (issue.isNew) onDismissNew?.(issue.issueId);
  };

  const handleConfirm = () => {
    if (confirmType === 'hold') {
      onStatusChange?.(issue.issueId, 'PENDING');
    } else if (confirmType === 'next' && nextAction) {
      onStatusChange?.(issue.issueId, nextAction.nextStatus);
    }
    setConfirmType(null);
  };

  const fs = {
    badge: isMobile ? 12 : 14,
    name: 16,
    location: 14,
    time: isMobile ? 12 : 14,
    desc: 14,
  };
  const cardPadding  = isMobile ? '12px' : '24px 24px 24px 16px';
  const alertPadding = isMobile ? '8px 12px' : '16px 20px';

  const confirmConfig = confirmType
    ? getConfirmConfig(confirmType, nextAction?.label ?? '')
    : null;

  return (
    <>
      {/* 확인 팝업 — FeedCard ConfirmModal 패턴 */}
      {confirmType && confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          contents={confirmConfig.contents}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmType(null)}
        />
      )}

      <div
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        onClick={handleDismissNew}
        style={{
          padding: cardPadding,
          background: 'white',
          borderRadius: 8,
          outline: '1px #EEEEEE solid',
          outlineOffset: -1,
          display: 'flex',
          alignItems: 'stretch',
          gap: isMobile ? 8 : 16,
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          boxShadow: cardHovered
            ? '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
          transform: cardHovered ? 'translateY(-2px)' : 'none',
          cursor: 'default',
          minWidth: 0,
          // maxWidth 없음 — FeedCard 37차 정책과 동일 (1열 우측 공백 방지)
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 좌측 색상바 — SVG: 모든 상태 #FF1744 */}
        <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: 4, background: '#FF1744' }} />
        </div>

        {/* 콘텐츠 영역 */}
        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* ── 배지 행 + 우측 버튼 ── */}
          <div style={{ opacity: isCompleted ? 0.4 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              {/* 배지 영역: wrap 허용 — 배지 초과 시 두 줄 처리 (62차 FeedCard와 정책 통일)
                   FeedCard 62차 수정 시 동일 원정책 적용: flexWrap:'wrap' + overflow:'visible'
                   배지 개별 whiteSpace:nowrap + flexShrink:0 유지. */}
              <div style={{ flex: '1 1 0', display: 'flex', flexWrap: 'wrap', gap: isMobile ? 4 : 8, alignItems: 'center', minWidth: 0, overflow: 'visible' }}>
                {/* NEW 배지 */}
                {issue.isNew && (
                  <span style={{
                    height: 30, paddingInline: 8, paddingBlock: 4,
                    background: '#D50000', borderRadius: 8,
                    color: 'white', fontSize: fs.badge, fontWeight: 700,
                    display: 'flex', alignItems: 'center',
                    lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    NEW
                  </span>
                )}

                {/* COMPLETED: 상태배지 → 이슈타입배지 / 그 외: 이슈타입배지 → 상태배지 */}
                {isCompleted ? (
                  <>
                    <StatusBadge badge={statusBadge} fontSize={fs.badge} isMobile={isMobile} />
                    <IssueTypeBadge issueType={issue.issueType} fontSize={fs.badge} isMobile={isMobile} />
                  </>
                ) : (
                  <>
                    <IssueTypeBadge issueType={issue.issueType} fontSize={fs.badge} isMobile={isMobile} />
                    <StatusBadge badge={statusBadge} fontSize={fs.badge} isMobile={isMobile} />
                  </>
                )}
              </div>

              {/* 우측: 시간 + 구분선 + > 버튼 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
                {!isMobile && (
                  <>
                    <span style={{
                      color: '#757575', fontSize: fs.time, fontWeight: 500,
                      lineHeight: '20.02px', letterSpacing: '0.20px', whiteSpace: 'nowrap',
                    }}>
                      {formatDateTime(issue.reportedAt)}
                    </span>
                    <div style={{ height: 12, width: 0, borderLeft: '1px solid rgba(0,0,0,0.12)' }} />
                  </>
                )}

                <button type="button"
                  onClick={e => { e.stopPropagation(); handleDismissNew(); }}
                  style={{
                    width: 30, height: 30,
                    background: '#EEEEEE', borderRadius: isMobile ? 8 : 4,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="rgba(0,0,0,0.56)" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── 보고자 + 위치 정보 ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: isCompleted ? 0.4 : 1 }}>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-start', alignItems: 'center' }}>
              <span style={{
                color: 'rgba(0,0,0,0.87)', fontSize: fs.name, fontWeight: 700,
                lineHeight: '28px', letterSpacing: '0.20px',
              }}>
                {issue.reporterName}
              </span>
              {isMobile && (
                <span style={{
                  color: '#757575', fontSize: fs.time, fontWeight: 400,
                  lineHeight: '19.92px', letterSpacing: '0.20px',
                }}>
                  {formatDateTime(issue.reportedAt)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="black" />
              </svg>
              <span style={{
                color: 'rgba(0,0,0,0.87)', fontSize: fs.location, fontWeight: 700,
                lineHeight: '20.02px', letterSpacing: '0.20px',
              }}>
                {issue.roomGroupName}ㆍ{issue.roomName}
              </span>
            </div>
          </div>

          {/* ── 설명 알림박스 — SVG: 모든 카드 #FEEBEE 박스 ── */}
          <div style={{
            padding: alertPadding,
            background: '#FEEBEE', borderRadius: 8,
            opacity: isCompleted ? 0.4 : 1,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#D50000" />
                </svg>
              </div>
              <div style={{
                color: '#D50000', fontSize: fs.desc, fontWeight: 400,
                lineHeight: '20.02px', letterSpacing: '0.20px',
              }}>
                {issue.description}
              </div>
            </div>
          </div>

          {/* ── 사진 ── */}
          {issue.photoUrls.length > 0 && (
            <div style={{ opacity: isCompleted ? 0.4 : 1 }}>
              <ImageGrid urls={issue.photoUrls} />
            </div>
          )}

          {/* ── 처리 코멘트 (null이면 미노출) ── */}
          {issue.processingComment && (
            <div style={{
              padding: '12px 16px', background: '#F5F5F5', borderRadius: 8,
              outline: '1px #EEEEEE solid', outlineOffset: -1,
              opacity: isCompleted ? 0.4 : 1,
            }}>
              <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', marginBottom: 4, letterSpacing: '0.3px' }}>
                처리 코멘트
              </div>
              <div style={{
                fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 400,
                lineHeight: '20px',
              }}>
                {issue.processingComment}
              </div>
            </div>
          )}

          {/* ── 예정일 (null이면 미노출) ── */}
          {issue.scheduledDate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: isCompleted ? 0.4 : 1,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="#757575" />
              </svg>
              <span style={{
                color: '#757575', fontSize: 13, fontWeight: 400,
                lineHeight: '18px', letterSpacing: '0.20px',
              }}>
                처리 예정: {formatDateOnly(issue.scheduledDate)}
              </span>
            </div>
          )}

          {/* ── 액션 버튼 (COMPLETED 제외) — FeedCard ActionButton 패턴 ── */}
          {!isCompleted && nextAction && (
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 8,
              paddingTop: 4,
            }}>
              {/* 보류 버튼 — RECEIVED/CONFIRMED 에서만 (PENDING은 이미 보류 상태) */}
              {issue.issueStatus !== 'PENDING' && (
                <IssueActionButton
                  label="보류"
                  variant="neutral-outlined"
                  isMobile={isMobile}
                  onClick={() => setConfirmType('hold')}
                />
              )}
              {/* 다음 상태 버튼 */}
              <IssueActionButton
                label={nextAction.label}
                variant="primary-contained"
                isMobile={isMobile}
                onClick={() => setConfirmType('next')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
