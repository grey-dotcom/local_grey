/**
 * @file components/layout/GNBSidebar.tsx
 * @description GNB 사이드바 — 64px, #212121, 아이콘 only
 * 운영 서비스(keeper-admin.com) 기준 아이콘 구성
 *
 * [아이콘 교체] src/components/ui/icons/index.tsx path만 수정
 * [BE 연동] sectionLabel을 rbac.config.ts MENU_SECTIONS에 연결
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome, IconRealtime, IconTickets,
  IconSpaces, IconAdminAccount, IconKeeperAccount, IconKeeperGroup, IconIdCard,
  IconChevronsLeft, IconChevronsRight,
} from '@/components/ui/icons';
import { useAuthStore } from '@/stores/authStore';
import { getAccessibleMenuSections } from '@/config/rbac.config';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface GnbIconItem {
  icon: IconComponent;
  label: string;
  sectionLabel?: string;
}

const GNB_LIVE_MENU: GnbIconItem[] = [
  { icon: IconHome,     label: '홈',      sectionLabel: '홈' },
  { icon: IconRealtime, label: '실시간' },
  { icon: IconTickets,  label: '수행결과' },
];

const GNB_SETTING_MENU: GnbIconItem[] = [
  { icon: IconSpaces,        label: '공간정보' },
  { icon: IconAdminAccount,  label: '관리자계정' },
  { icon: IconKeeperAccount, label: '키퍼계정' },
  { icon: IconKeeperGroup,   label: '키퍼그룹' },
  { icon: IconIdCard,        label: '키퍼 ID' },
];

interface Props {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function GNBSidebar({ sidebarOpen, onToggleSidebar }: Props) {
  const pathname = usePathname();
  const staffAuth = useAuthStore((s) => s.staffAuth);
  const authority = staffAuth?.authority ?? 'NONE';
  const workspaceCode = staffAuth?.workspaceCode ?? '';

  const accessibleSections = getAccessibleMenuSections(authority);
  const accessibleLabels = new Set(accessibleSections.map((s) => s.sectionLabel));

  function getSectionPath(sectionLabel: string): string {
    const section = accessibleSections.find((s) => s.sectionLabel === sectionLabel);
    if (!section) return '#';
    const firstItem = section.items[0];
    return firstItem.isWorkspaceScoped ? `/${workspaceCode}${firstItem.path}` : firstItem.path;
  }

  function isSectionActive(sectionLabel: string): boolean {
    const path = getSectionPath(sectionLabel);
    if (path === '#') return false;
    return pathname === path || pathname.startsWith(path + '/');
  }

  function renderIconItem(item: GnbIconItem, key: number) {
    const Icon = item.icon;
    const hasAccess = item.sectionLabel ? accessibleLabels.has(item.sectionLabel) : false;
    const active = hasAccess && item.sectionLabel ? isSectionActive(item.sectionLabel) : false;

    const boxStyle: React.CSSProperties = {
      width: 40, height: 40, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, transition: 'background 0.15s',
      ...(active
        ? { background: '#2962FF', cursor: 'pointer' }
        : hasAccess
          ? { cursor: 'pointer' }
          : { cursor: 'default', opacity: 0.35 }),
    };

    if (hasAccess && item.sectionLabel) {
      return (
        <Link key={key} href={getSectionPath(item.sectionLabel)} title={item.label}
          style={boxStyle} className="hover:bg-white/10">
          <Icon size={22} color={active ? '#FFFFFF' : '#757575'} />
        </Link>
      );
    }
    return (
      <span key={key} title={item.label} style={boxStyle}>
        <Icon size={22} color="#757575" />
      </span>
    );
  }

  return (
    <nav
      style={{
        width: 64, background: '#212121',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 16, paddingBottom: 16, flexShrink: 0,
      }}
      aria-label="글로벌 내비게이션"
    >
      <button type="button" title={sidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
        onClick={onToggleSidebar}
        style={{
          width: 40, height: 40, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
        className="hover:bg-white/10"
      >
        {sidebarOpen
          ? <IconChevronsLeft size={20} color="#757575" />
          : <IconChevronsRight size={20} color="#757575" />}
      </button>

      <div style={{ width: 24, height: 1, background: '#424242', margin: '12px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {GNB_LIVE_MENU.map((item, i) => renderIconItem(item, i))}
      </div>

      <div style={{ width: 24, height: 1, background: '#424242', margin: '12px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {GNB_SETTING_MENU.map((item, i) => renderIconItem(item, i + 10))}
      </div>
    </nav>
  );
}
