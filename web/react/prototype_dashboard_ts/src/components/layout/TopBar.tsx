/**
 * @file components/layout/TopBar.tsx
 * @description TopBar — black 배경
 *
 * 피그마 스펙 (topbar.svg 실측 기준):
 * - 배경: black, padding: 12px
 * - 좌측: 격자 아이콘(/home) | 구분선 | KEEPER 로고
 * - 우측 순서: 가이드보기(inactive) · 점 · 시간 · 점 · 인사말 | 유저아이콘 · 알림 · 설정
 *
 * [프로토타입 처리]
 * - 가이드 보기: Phase 1 미구현 — disabled + opacity 0.45 (inactive 상태 유지)
 * - 유저 아이콘: 클릭 시 프로필 팝업 (이름/계정/연락처/에어서플라이/로그아웃)
 * - 알림/설정 아이콘: 버튼만 (추후 기능 연동)
 * - 시간: getDisplayTime() 함수로 분리
 *
 * [BE 연동 가이드]
 * - staffAuth.name → 인사말
 * - staffAuth.email → 유저 팝업 계정
 * - staffAuth.phoneNumber → 유저 팝업 연락처
 * - staffAuth.isAirSupplyConnected → 에어서플라이 연동 여부
 * - 알림 카운트: 추후 GET /shared/v1/notifications 연동 예정
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { LOGO } from '@/config/assets.config';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ─── 공용 스타일 ──────────────────────────────────────────────────────────────
const iconBtnStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  color: '#F9FAFB',
};

// ─── 구분 점 ─────────────────────────────────────────────────────────────────
function Dot() {
  return (
    <div
      style={{
        width: 2,
        height: 2,
        background: '#F9FAFB',
        borderRadius: '50%',
        flexShrink: 0,
        opacity: 1,
      }}
    />
  );
}

// ─── 시간 포맷 ────────────────────────────────────────────────────────────────
// [BE 연동 포인트] 서버 타임존/워크스페이스 로컬 시간 필요 시 이 함수만 수정
function getDisplayTime(date: Date): string {
  return format(date, 'yyyy.MM.dd / aa hh : mm', { locale: ko });
}

// ─── 유저 팝업 ────────────────────────────────────────────────────────────────
interface UserPopupProps {
  name: string;
  email: string;
  phoneNumber: string;
  isAirSupplyConnected: boolean;
  onLogout: () => void;
  onClose: () => void;
}

function UserPopup({ name, email, phoneNumber, isAirSupplyConnected, onLogout, onClose }: UserPopupProps) {
  const formatPhone = (p: string) =>
    p.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');

  return (
    <>
      {/* 배경 dimmer */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={onClose}
      />

      {/* 팝업 */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 1000,
          background: '#1E1E1E',
          border: '1px solid #333',
          borderRadius: 12,
          minWidth: 248,
          boxShadow: '0px 8px 24px rgba(0,0,0,0.48)',
          overflow: 'hidden',
        }}
      >
        {/* 유저 정보 */}
        <div style={{ padding: '20px 20px 16px' }}>

          {/* 아바타 + 이름/이메일 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, #69F0AE 0%, #2C58DB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
            </div>
            <div>
              <div style={{ color: '#F9FAFB', fontSize: 15, fontWeight: 600, lineHeight: '22px' }}>
                {name}
              </div>
              <div style={{ color: '#9E9E9E', fontSize: 12, lineHeight: '18px', marginTop: 1 }}>
                {email}
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: '#2E2E2E', marginBottom: 14 }} />

          {/* 연락처 / 에어서플라이 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#757575', fontSize: 12 }}>연락처</span>
              <span style={{ color: '#ECEFF1', fontSize: 13 }}>{formatPhone(phoneNumber)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#757575', fontSize: 12 }}>에어서플라이 연동</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: isAirSupplyConnected ? '#69F0AE' : '#9E9E9E' }}>
                {isAirSupplyConnected ? '연동됨' : '미연동'}
              </span>
            </div>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid #2E2E2E',
            color: '#EF5350',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,83,80,0.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M17 8l4 4m0 0l-4 4m4-4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              stroke="#EF5350"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          로그아웃
        </button>
      </div>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function TopBar() {
  const router = useRouter();
  const staffAuth = useAuthStore((s) => s.staffAuth);
  const logout = useAuthStore((s) => s.logout);
  const [now, setNow] = useState(new Date());
  const [userPopupOpen, setUserPopupOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    logout();
    router.replace('/login');
  }

  return (
    <header
      style={{
        background: 'black',
        boxShadow: '0px 2px 4px rgba(0,0,0,0.20), 0px 5px 5px rgba(0,0,0,0.14), 0px 1px 10px rgba(0,0,0,0.12)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* 좌측: 격자 아이콘(/home 링크) | 구분선 | KEEPER 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>

        {/* 격자 아이콘 — /home 링크 */}
        <Link
          href="/home"
          title="홈으로"
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            flexShrink: 0,
            background: 'rgba(0,0,0,0.56)',
            padding: 8,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" />
            <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" />
            <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" />
          </svg>
        </Link>

        {/* 구분선 */}
        <div style={{ width: 1, height: 24, background: '#424242', flexShrink: 0 }} />

        {/* KEEPER 로고 — 운영 서비스 기준 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO.keeper}
          alt="KEEPER"
          width={88}
          height={20}
          style={{ objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* 우측 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* 텍스트 그룹: 가이드보기 · 시간 · 인사말 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* 가이드 보기 — Phase 1 미구현, inactive 유지 (기능 연동 전까지 disabled + opacity 0.45) */}
          <button
            type="button"
            disabled
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
              lineHeight: '22px',
              letterSpacing: '0.2px',
              cursor: 'default',
              padding: '2px 4px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              opacity: 0.45,
            }}
          >
            가이드 보기
          </button>
          <Dot />
          <span
            style={{
              color: '#ECEFF1',
              fontSize: 14,
              fontWeight: 400,
              lineHeight: '20px',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            {getDisplayTime(now)}
          </span>
          <Dot />
          <span
            style={{
              color: '#ECEFF1',
              fontSize: 14,
              fontWeight: 400,
              lineHeight: '20px',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >
            안녕하세요. {staffAuth?.name ?? ''}님
          </span>
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 20, background: '#333', flexShrink: 0, marginInline: 4 }} />

        {/* 아이콘 그룹: 유저 · 알림 · 설정
         * topbar.svg 실측 기준:
         *   유저: 그라데이션 원형 아이콘 (#69F0AE → #2C58DB)
         *   알림: 종(Bell) 아이콘
         *   설정: 기어(Settings) 아이콘
         */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>

          {/* 유저 아이콘 — 그라데이션 원(#69F0AE→#2C58DB) + 흰 사람 실루엣 */}
          <button
            type="button"
            title="내 프로필"
            onClick={() => setUserPopupOpen((prev) => !prev)}
            style={iconBtnStyle}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="avatarGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#69F0AE" />
                  <stop offset="1" stopColor="#2C58DB" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#avatarGrad)" />
              <path d="M12 5.5C13.66 5.5 15 6.84 15 8.5C15 10.16 13.66 11.5 12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5ZM17.5 17.5H6.5V16.25C6.5 14.18 10.33 13 12 13C13.67 13 17.5 14.18 17.5 16.25V17.5Z" fill="white" fillOpacity="0.9" />
            </svg>
          </button>

          {/* 유저 팝업 */}
          {userPopupOpen && staffAuth && (
            <UserPopup
              name={staffAuth.name}
              email={staffAuth.email}
              phoneNumber={staffAuth.phoneNumber}
              isAirSupplyConnected={staffAuth.isAirSupplyConnected}
              onLogout={handleLogout}
              onClose={() => setUserPopupOpen(false)}
            />
          )}

          {/* 알림(Bell) 아이콘 — topbar.svg 실측 / 추후 GET /shared/v1/notifications 연동 예정 */}
          <button type="button" title="알림" style={iconBtnStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#F9FAFB"/>
            </svg>
          </button>

          {/* 설정(Settings/기어) 아이콘 — topbar.svg 실측 */}
          <button type="button" title="설정" style={iconBtnStyle}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="#F9FAFB"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
