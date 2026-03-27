/**
 * @file components/layout/SubSidebar.tsx
 * @description Sub 사이드바 — 260px, 워크스페이스 드롭다운 + 섹션 + 메뉴
 *
 * 피그마 스펙 (keeper-admin.com 실 서비스 기준):
 * - 배경: white, 너비: 260px
 * - 워크스페이스 드롭다운:
 *     · background: #F9FAFB, outlined border rgba(0,0,0,0.23)
 *     · font-size: 16px, padding: 8px 12px
 *     · 드롭다운 열리면 워크스페이스 목록 표시
 *     · 선택 시 switchWorkspace → 헤더 이하 전체 리프레시
 * - 섹션 레이블: font-size 20px, font-weight 500, 클릭 불가
 * - 메뉴 아이템: width 228px, padding 4px 8px 4px 12px, border-radius 8px
 *     · 활성: background #2962FF, color #F9FAFB, 우측 ChevronRight
 *     · 비활성: color rgba(0,0,0,0.87), hover background rgba(0,0,0,0.04)
 * - 섹션 간격: 40px
 *
 * [워크스페이스 정책]
 * - 드롭다운 선택 → switchWorkspace(workspace) 호출
 * - staffAuth.workspaceName/Code/Id 교체 → 전체 리렌더링
 * [BE 연동 가이드]
 * - 워크스페이스 목록: GET /shared/v1/workspaces → authStore.workspaces
 * - 전환 시 새 staffAuth 재조회 필요 (실 서비스)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getAccessibleMenuSections } from '@/config/rbac.config';
import type { Workspace } from '@/types/auth';

export function SubSidebar() {
  const pathname = usePathname();
  const staffAuth = useAuthStore((s) => s.staffAuth);
  const workspaces = useAuthStore((s) => s.workspaces);
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace);
  const authority = staffAuth?.authority ?? 'NONE';
  const workspaceCode = staffAuth?.workspaceCode ?? '';
  const workspaceName = staffAuth?.workspaceName ?? '워크스페이스';

  const sections = getAccessibleMenuSections(authority);

  // 드롭다운 열림 상태
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // 드롭다운 열릴 때 트리거 위치 계산
  useEffect(() => {
    if (dropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  }, [dropdownOpen]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  function handleSelectWorkspace(ws: Workspace) {
    switchWorkspace(ws);
    setDropdownOpen(false);
  }

  function buildPath(isWorkspaceScoped: boolean, path: string): string {
    return isWorkspaceScoped ? `/${workspaceCode}${path}` : path;
  }

  function isActive(isWorkspaceScoped: boolean, path: string): boolean {
    const full = buildPath(isWorkspaceScoped, path);
    return pathname === full || pathname.startsWith(full + '/');
  }

  return (
    <aside
      style={{
        width: 260,
        height: '100%',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        gap: 40,
        flexShrink: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
        borderRight: '1px solid rgba(0,0,0,0.12)',
      }}
      aria-label="서브 내비게이션"
    >
      {/* ── 워크스페이스 드롭다운 ──────────────────────────────────────
       * [정책] 선택 시 switchWorkspace → staffAuth 교체 → 전체 리렌더
       * [확장 포인트] 실 서비스: 전환 API 호출 후 새 staffAuth 수신
       * [삐져나옴 방지] 드롭다운 목록은 fixed 포지셔닝으로 aside overflow 무관
       */}
      <div style={{ width: 228, position: 'relative', flexShrink: 0 }}>
        {/* 트리거 버튼 */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          style={{
            width: '100%',
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            background: '#F9FAFB',
            borderRadius: dropdownOpen ? '4px 4px 0 0' : 4,
            border: '1px solid rgba(0,0,0,0.23)',
            borderBottom: dropdownOpen ? '1px solid transparent' : '1px solid rgba(0,0,0,0.23)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'Noto Sans KR, sans-serif',
              fontWeight: 400,
              lineHeight: '24px',
              letterSpacing: '0.2px',
              color: 'rgba(0,0,0,0.87)',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workspaceName}
          </span>
          {/* ArrowDropDown — 피그마 기준 삼각형 */}
          <svg
            width="10"
            height="5"
            viewBox="0 0 10 5"
            style={{
              flexShrink: 0,
              marginLeft: 8,
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            <path d="M0 0L5 5L10 0H0Z" fill="rgba(0,0,0,0.56)" />
          </svg>
        </button>

        {/* 드롭다운 목록 — fixed 포지셔닝으로 aside overflow 영향 없음 */}
        {dropdownOpen && dropdownRect && (
          <ul
            ref={dropdownRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              background: 'white',
              border: '1px solid rgba(0,0,0,0.23)',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              zIndex: 9999,
              listStyle: 'none',
              margin: 0,
              padding: '4px 0',
              boxShadow: '0px 4px 8px rgba(0,0,0,0.12)',
            }}
          >
            {workspaces.map((ws) => {
              const isSelected = ws.workspaceCode === workspaceCode;
              return (
                <li key={ws.workspaceId} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelectWorkspace(ws)}
                    style={{
                      width: '100%',
                      paddingLeft: 12,
                      paddingRight: 8,
                      paddingTop: 8,
                      paddingBottom: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? 'rgba(41,98,255,0.08)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'Noto Sans KR, sans-serif',
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected ? '#2962FF' : 'rgba(0,0,0,0.87)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {ws.workspaceName}
                    </span>
                    {isSelected && <Check size={16} color="#2962FF" style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* 하단 구분선 (닫힌 상태에서만) */}
        {!dropdownOpen && (
          <div style={{
            position: 'absolute',
            left: 0,
            bottom: -1,
            width: '100%',
            height: 1,
            background: 'rgba(0,0,0,0.12)',
          }} />
        )}
      </div>

      {/* ── 섹션 + 메뉴 목록 ──────────────────────────────────────────── */}
      {sections.map((section) => (
        <div
          key={section.sectionLabel}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* 섹션 레이블 — 클릭 불가 */}
          <div style={{ width: 228, paddingBottom: 8 }}>
            <p
              style={{
                fontSize: 20,
                fontFamily: 'Noto Sans KR, sans-serif',
                fontWeight: 500,
                lineHeight: '32px',
                letterSpacing: '0.2px',
                color: 'rgba(0,0,0,0.87)',
                margin: 0,
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              {section.sectionLabel}
            </p>
          </div>

          {/* 메뉴 아이템 목록 */}
          <div
            style={{
              width: 260,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {section.items.map((item) => {
              const active = isActive(item.isWorkspaceScoped, item.path);
              return (
                <Link
                  key={item.key}
                  href={buildPath(item.isWorkspaceScoped, item.path)}
                  style={{
                    width: 228,
                    paddingTop: 4,
                    paddingBottom: 4,
                    paddingLeft: 12,
                    paddingRight: 8,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    background: active ? '#2962FF' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  {/* 메뉴 텍스트 */}
                  <span
                    style={{
                      flex: 1,
                      paddingTop: 5,
                      paddingBottom: 5,
                      fontSize: 14,
                      fontFamily: 'Noto Sans KR, sans-serif',
                      fontWeight: 500,
                      lineHeight: '21.98px',
                      letterSpacing: '0.2px',
                      color: active ? '#F9FAFB' : 'rgba(0,0,0,0.87)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                  {/* 활성 시 우측 ChevronRight */}
                  {active && (
                    <div style={{ height: 32, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <ChevronRight size={20} strokeWidth={1.8} color="#F9FAFB" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
