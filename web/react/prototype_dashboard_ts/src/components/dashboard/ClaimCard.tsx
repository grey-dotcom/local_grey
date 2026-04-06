/**
 * @file components/dashboard/ClaimCard.tsx
 * @description 클레임 — 개별 클레임 카드 컴포넌트 (기초 UI)
 *
 * ─ 배지 구성 ──────────────────────────────────────────────────────────────
 *   [NEW]  isNew === true 일 때 노출
 *   [상태]  claimStatus 한글 라벨 (상태별 색상 차등)
 *   flexWrap: wrap + overflow: visible — 62차 FeedCard·IssueCard 정책 통일
 *
 * ─ 좌측 색상바 ────────────────────────────────────────────────────────────
 *   PENDING·DISPUTED → #FF1744 (빨강 — 미처리·이의제기)
 *   ACCEPTED·DISPUTE_COMPLETED → #9E9E9E (회색 — 완료)
 *
 * ─ 클레임 상태 (68차 신규) ───────────────────────────────────────────────
 *   PENDING           → 처리대기 (인정 또는 이의제기 대기)
 *   ACCEPTED          → 인정완료 ⚠️ mock 임시 키 — BE 확인 후 교체
 *   DISPUTED          → 이의제기 ⚠️ mock 임시 키 — BE 확인 후 교체
 *   DISPUTE_COMPLETED → 이의제기완료 ⚠️ mock 임시 키 — BE 확인 후 교체
 *   (dashboard.ts ClaimStatus 주석 참고)
 *
 * ─ 액션 버튼 ─────────────────────────────────────────────────────────────
 *   PENDING:           이의제기(outlined, error) + 인정(contained, primary)
 *   DISPUTED:          버튼 없음 (진행중)
 *   ACCEPTED:          버튼 없음 (읽기전용)
 *   DISPUTE_COMPLETED: 버튼 없음 (읽기전용)
 *
 * ─ ConfirmModal confirmVariant ────────────────────────────────────────────
 *   'error'   → 확인 버튼 #D32F2F (파괴적 액션)
 *   'primary' → 확인 버튼 #1976D2 (일반 상태 변경)
 */

'use client';

import { useState } from 'react';
import type { ClaimReport } from '@/types/dashboard';

// ── 상태 배지 ─────────────────────────────────────────────────────────────
interface BadgeConfig { text: string; bg: string; color: string; icon?: 'check' }

// ⚠️ ACCEPTED·DISPUTED·DISPUTE_COMPLETED는 mock 임시 키 — BE 실측 후 교체 필요
// [BE 개발자] 실 서비스 enum 키 확인 후 아래 case 값 교체 (dashboard.ts 주석 참고)
function getStatusBadge(status: ClaimReport['claimStatus']): BadgeConfig {
  switch (status) {
    case 'PENDING':           return { text: '처리대기',     bg: '#FFF3E0', color: '#E65100' };
    case 'ACCEPTED':          return { text: '인정완료',     bg: '#E8F5E9', color: '#2E7D32', icon: 'check' };
    case 'DISPUTED':          return { text: '이의제기',     bg: '#FFF8E1', color: '#F57F17' };
    case 'DISPUTE_COMPLETED': return { text: '이의제기완료', bg: '#F5F5F5', color: '#757575', icon: 'check' };
    default:                  return { text: status,         bg: '#EEEEEE', color: '#212121' };
  }
}

// ── 좌측 색상바 ───────────────────────────────────────────────────────────
// ⚠️ ACCEPTED·DISPUTE_COMPLETED는 mock 임시 키 — BE 확인 후 교체
function getColorBar(status: ClaimReport['claimStatus']): string {
  return (status === 'ACCEPTED' || status === 'DISPUTE_COMPLETED') ? '#9E9E9E' : '#FF1744';
}

// ── 시간 포맷 ─────────────────────────────────────────────────────────────
function formatDateTime(iso: string): string {
  const d   = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
function ConfirmModal({ title, contents, confirmVariant = 'error', onConfirm, onCancel }: {
  title: string;
  contents?: string;
  confirmVariant?: 'primary' | 'error';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmBg = confirmVariant === 'error' ? '#D32F2F' : '#1976D2';
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
            background: confirmBg, border: 'none',
            borderRadius: 4, cursor: 'pointer',
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit', color: 'white',
          }}>확인</button>
        </div>
      </div>
    </div>
  );
}

// ── 버튼 (FeedCard ActionButton 패턴 이식 — hover + 반응형) ─────────────
// variant: 'contained'(파란 채움 — 인정) | 'outlined'(빨간 테두리 — 이의제기)
function ClaimActionButton({ label, isMobile, variant = 'contained', onClick }: {
  label: string; isMobile: boolean; variant?: 'contained' | 'outlined'; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isContained = variant === 'contained';
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        height: isMobile ? 30 : 36,
        paddingInline: isMobile ? 10 : 16,
        paddingBlock: isMobile ? 4 : 6,
        fontSize: isMobile ? 13 : 14,
        fontWeight: 500, fontFamily: 'inherit', borderRadius: 4,
        cursor: 'pointer', letterSpacing: '0.20px',
        transition: 'background 0.15s, box-shadow 0.15s',
        border: isContained ? 'none' : '1px solid rgba(211,47,47,0.50)',
        background: isContained
          ? (hovered ? '#1565C0' : '#1976D2')
          : (hovered ? 'rgba(211,47,47,0.04)' : 'transparent'),
        color: isContained ? 'white' : '#D32F2F',
        boxShadow: isContained && hovered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
      }}>
      {label}
    </button>
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

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────
interface ClaimCardProps {
  claim: ClaimReport;
  isMobile?: boolean;
  onDismissNew?: (claimId: string) => void;
  onStatusChange?: (claimId: string, newStatus: ClaimReport['claimStatus']) => void;
}

export function ClaimCard({ claim, isMobile = false, onDismissNew, onStatusChange }: ClaimCardProps) {
  const [cardHovered,   setCardHovered]   = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  // confirmAction: 'accept'(인정) | 'dispute'(이의제기)
  // ⚠️ ACCEPTED·DISPUTED는 mock 임시 키 — BE 확인 후 교체 (dashboard.ts ClaimStatus 주석 참고)
  const [confirmAction, setConfirmAction] = useState<'accept' | 'dispute'>('accept');

  const statusBadge = getStatusBadge(claim.claimStatus);
  // 완료 상태: 인정완료 또는 이의제기완료 — ⚠️ mock 임시 키
  const isCompleted = claim.claimStatus === 'ACCEPTED' || claim.claimStatus === 'DISPUTE_COMPLETED';
  const colorBar    = getColorBar(claim.claimStatus);

  const handleDismissNew = () => {
    if (claim.isNew) onDismissNew?.(claim.claimId);
  };

  const handleConfirm = () => {
    // ⚠️ ACCEPTED·DISPUTED는 mock 임시 키 — BE 실측 후 실제 enum으로 교체
    onStatusChange?.(claim.claimId, confirmAction === 'accept' ? 'ACCEPTED' : 'DISPUTED');
    setShowConfirm(false);
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

  return (
    <>
      {/* 확인 팝업 */}
      {showConfirm && (
        <ConfirmModal
          title={
            confirmAction === 'accept'
              ? '선택하신 클레임을 인정 처리하시겠습니까?'
              : '선택하신 클레임에 이의를 제기하시겠습니까?'
          }
          contents={
            confirmAction === 'accept'
              ? '인정 처리 후 취소할 수 없습니다.'
              : '이의를 제기하면 추가 검토가 진행됩니다.'
          }
          confirmVariant="error"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
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
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 좌측 색상바 */}
        <div style={{ display: 'flex', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: 4, background: colorBar }} />
        </div>

        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* ── 배지 행 + 우측 버튼 ── */}
          <div style={{ opacity: isCompleted ? 0.4 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: '1 1 0', display: 'flex', flexWrap: 'wrap', gap: isMobile ? 4 : 8, alignItems: 'center', minWidth: 0, overflow: 'visible' }}>
                {claim.isNew && (
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
                <StatusBadge badge={statusBadge} fontSize={fs.badge} isMobile={isMobile} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
                {!isMobile && (
                  <>
                    <span style={{
                      color: '#757575', fontSize: fs.time, fontWeight: 500,
                      lineHeight: '20.02px', letterSpacing: '0.20px', whiteSpace: 'nowrap',
                    }}>
                      {formatDateTime(claim.reportedAt)}
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
                {claim.reporterName}
              </span>
              {isMobile && (
                <span style={{
                  color: '#757575', fontSize: fs.time, fontWeight: 400,
                  lineHeight: '19.92px', letterSpacing: '0.20px',
                }}>
                  {formatDateTime(claim.reportedAt)}
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
                {claim.roomGroupName}ㆍ{claim.roomName}
              </span>
            </div>
          </div>

          {/* ── 설명 알림박스 ── */}
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
                {claim.description}
              </div>
            </div>
          </div>

          {/* ── 사진 ── */}
          {claim.photoUrls.length > 0 && (
            <div style={{ opacity: isCompleted ? 0.4 : 1 }}>
              <ImageGrid urls={claim.photoUrls} />
            </div>
          )}

          {/* ── 처리 코멘트 ── */}
          {claim.comment && (
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
                {claim.comment}
              </div>
            </div>
          )}

          {/* ── 액션 버튼 ──
               PENDING           → 이의제기(outlined) + 인정(contained)
               DISPUTED          → 버튼 없음 (이의제기 진행중)
               ACCEPTED          → 버튼 없음 (인정완료, 읽기전용)
               DISPUTE_COMPLETED → 버튼 없음 (읽기전용)
               ⚠️ ACCEPTED·DISPUTED는 mock 임시 키 — BE 확인 후 교체 */}
          {claim.claimStatus === 'PENDING' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <ClaimActionButton
                label="이의제기"
                isMobile={isMobile}
                variant="outlined"
                onClick={() => { setConfirmAction('dispute'); setShowConfirm(true); }}
              />
              <ClaimActionButton
                label="인정"
                isMobile={isMobile}
                variant="contained"
                onClick={() => { setConfirmAction('accept'); setShowConfirm(true); }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
