/**
 * @file utils/mockStore.ts
 * @description 프로토타입 mock 데이터 CRUD 유틸
 *
 * ─ 정책 ──────────────────────────────────────────────────────────────────
 *   - 로그인 시: localStorage에 저장된 수정본이 있으면 사용, 없으면 원본 JSON 복원
 *   - 세션 중 CRUD: localStorage에 저장 (키: feed_mock_w1 / feed_mock_w2 등)
 *   - 로그아웃 시: authStore의 logout()에서 localStorage 키 전체 제거 → 원본 복원
 *
 * ─ localStorage 키 목록 ──────────────────────────────────────────────────
 *   feed_mock_w1        그레이 테스트 1 피드
 *   feed_mock_w2        그레이 테스트 2 피드
 *   dashboard_mock_w1   그레이 테스트 1 KPI
 *   dashboard_mock_w2   그레이 테스트 2 KPI
 *   feed_new_w1         그레이 테스트 1 isNew 세션 상태 (FeedWidget 관리, 66차 FE-R17)
 *   feed_new_w2         그레이 테스트 2 isNew 세션 상태 (FeedWidget 관리, 66차 FE-R17)
 *   issues_mock         이슈 목록 (워크스페이스 무관 단일 mock)
 *   claims_mock         클레임 목록 (워크스페이스 무관 단일 mock)
 *
 * ─ dashboard.json 구조 ───────────────────────────────────────────────────
 *   {
 *     byRoomGroup: { [roomGroupId]: TicketStats }
 *     all: TicketStats   ← roomGroupId 미지정(전체) 시 사용
 *   }
 *
 * ─ 사용법 ────────────────────────────────────────────────────────────────
 *   // 특정 지점 KPI
 *   const kpi = await loadMockDashboard(workspaceId, roomGroupId);
 *
 *   // 전체 합산 KPI (지점 선택 안 했을 때)
 *   const kpi = await loadMockDashboard(workspaceId);
 *
 *   // 로그아웃 시 (authStore.logout()에서 호출)
 *   clearAllMockData();
 */

import type { TicketReport, TicketReportsResponse, TicketStats, IssueReport, ClaimReport } from '@/types/dashboard';

/* ── issues / claims 응답 타입 ───────────────────────────────────────────── */
export interface IssueReportsResponse {
  content: IssueReport[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ClaimReportsResponse {
  content: ClaimReport[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/* ── localStorage 키 매핑 ────────────────────────────────────────────────── */
//   issues / claims 는 워크스페이스 무관 단일 mock (추후 workspaceId 분기 가능)
const WORKSPACE_KEY_MAP: Record<string, { feed: string; dashboard: string }> = {
  'WORK01XXXXXXXXXXXXXXXXXXXXXXXXX2': { feed: 'feed_mock_w1',      dashboard: 'dashboard_mock_w1' },
  'WORK01XXXXXXXXXXXXXXXXXXXXXXXXX3': { feed: 'feed_mock_w2',      dashboard: 'dashboard_mock_w2' },
};

const ISSUES_KEY  = 'issues_mock';
const CLAIMS_KEY  = 'claims_mock';

function getKeys(workspaceId: string) {
  return WORKSPACE_KEY_MAP[workspaceId] ?? { feed: 'feed_mock_w1', dashboard: 'dashboard_mock_w1' };
}

/* ── dashboard.json 내부 구조 타입 ───────────────────────────────────────── */
interface DashboardMockData {
  byRoomGroup: Record<string, TicketStats & { _name?: string }>;
  all: TicketStats & { _name?: string };
}

/* ── 원본 JSON 동적 import ───────────────────────────────────────────────── */
async function loadOriginalFeed(workspaceId: string): Promise<TicketReportsResponse> {
  if (workspaceId === 'WORK01XXXXXXXXXXXXXXXXXXXXXXXXX3') {
    const mod = await import('@/mocks/feed_w2.json');
    return mod.default as unknown as TicketReportsResponse;
  }
  const mod = await import('@/mocks/feed.json');
  return mod.default as unknown as TicketReportsResponse;
}

async function loadOriginalDashboardRaw(workspaceId: string): Promise<DashboardMockData> {
  if (workspaceId === 'WORK01XXXXXXXXXXXXXXXXXXXXXXXXX3') {
    const mod = await import('@/mocks/dashboard_w2.json');
    return mod.default as unknown as DashboardMockData;
  }
  const mod = await import('@/mocks/dashboard.json');
  return mod.default as unknown as DashboardMockData;
}

/* ── 피드 로드 ───────────────────────────────────────────────────────────── */
export async function loadMockFeed(workspaceId: string): Promise<TicketReportsResponse> {
  if (typeof window === 'undefined') return loadOriginalFeed(workspaceId);
  const key = getKeys(workspaceId).feed;
  const stored = localStorage.getItem(key);
  if (stored) {
    try { return JSON.parse(stored) as TicketReportsResponse; }
    catch { /* 손상된 경우 원본으로 fallback */ }
  }
  return loadOriginalFeed(workspaceId);
}

/* ── 피드 저장 ───────────────────────────────────────────────────────────── */
export function saveMockFeed(workspaceId: string, data: TicketReportsResponse): void {
  if (typeof window === 'undefined') return;
  const key = getKeys(workspaceId).feed;
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── 피드 단건 CRUD ──────────────────────────────────────────────────────── */
export async function addMockTicket(workspaceId: string, ticket: TicketReport): Promise<void> {
  const data = await loadMockFeed(workspaceId);
  const updated: TicketReportsResponse = {
    ...data,
    content: [ticket, ...data.content],
    totalElements: data.totalElements + 1,
  };
  saveMockFeed(workspaceId, updated);
}

export async function updateMockTicket(workspaceId: string, ticketId: string, patch: Partial<TicketReport>): Promise<void> {
  const data = await loadMockFeed(workspaceId);
  const updated: TicketReportsResponse = {
    ...data,
    content: data.content.map((t) => t.ticketId === ticketId ? { ...t, ...patch } : t),
  };
  saveMockFeed(workspaceId, updated);
}

export async function deleteMockTicket(workspaceId: string, ticketId: string): Promise<void> {
  const data = await loadMockFeed(workspaceId);
  const updated: TicketReportsResponse = {
    ...data,
    content: data.content.filter((t) => t.ticketId !== ticketId),
    totalElements: Math.max(0, data.totalElements - 1),
  };
  saveMockFeed(workspaceId, updated);
}

/* ── KPI 로드 (roomGroupId 선택 지원) ───────────────────────────────────── */
/**
 * @param workspaceId  워크스페이스 ID
 * @param roomGroupId  지점 ID (생략 시 전체 합산 반환)
 */
export async function loadMockDashboard(
  workspaceId: string,
  roomGroupId?: string,
): Promise<TicketStats> {
  // localStorage에 저장된 수정본 확인
  const storedRaw = (() => {
    if (typeof window === 'undefined') return null;
    const key = getKeys(workspaceId).dashboard;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try { return JSON.parse(stored) as DashboardMockData; }
    catch { return null; }
  })();

  const raw = storedRaw ?? await loadOriginalDashboardRaw(workspaceId);

  // roomGroupId 지정 시 해당 지점 KPI, 없으면 전체 합산
  if (roomGroupId && raw.byRoomGroup?.[roomGroupId]) {
    const { _name, ...stats } = raw.byRoomGroup[roomGroupId];
    return stats as TicketStats;
  }

  const { _name, ...allStats } = raw.all;
  return allStats as TicketStats;
}

/* ── issues 로드 ─────────────────────────────────────────────────────────── */
export async function loadMockIssues(): Promise<IssueReportsResponse> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ISSUES_KEY);
    if (stored) {
      try { return JSON.parse(stored) as IssueReportsResponse; }
      catch { /* fallback */ }
    }
  }
  const mod = await import('@/mocks/issues.json');
  return mod.default as unknown as IssueReportsResponse;
}

export function saveMockIssues(data: IssueReportsResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ISSUES_KEY, JSON.stringify(data));
}

/* ── claims 로드 ─────────────────────────────────────────────────────────── */
export async function loadMockClaims(): Promise<ClaimReportsResponse> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CLAIMS_KEY);
    if (stored) {
      try { return JSON.parse(stored) as ClaimReportsResponse; }
      catch { /* fallback */ }
    }
  }
  const mod = await import('@/mocks/claims.json');
  return mod.default as unknown as ClaimReportsResponse;
}

export function saveMockClaims(data: ClaimReportsResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(data));
}

// ── feed_new 키 목록 (FeedWidget.tsx getNewStorageKey와 동기화) ─────────────
// feed_new_w1 / feed_new_w2 — isNew 세션 상태 저장 키 (66차 FE-R17)
const FEED_NEW_KEYS = ['feed_new_w1', 'feed_new_w2'];

/* ── 로그아웃 시 전체 초기화 — authStore.logout()에서 호출 ───────────────── */
export function clearAllMockData(): void {
  if (typeof window === 'undefined') return;
  Object.values(WORKSPACE_KEY_MAP).forEach(({ feed, dashboard }) => {
    localStorage.removeItem(feed);
    localStorage.removeItem(dashboard);
  });
  FEED_NEW_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(ISSUES_KEY);
  localStorage.removeItem(CLAIMS_KEY);
}

/** localStorage 키 전체 목록 (authStore에서 참조용) */
export const MOCK_STORAGE_KEYS = [
  ...Object.values(WORKSPACE_KEY_MAP).flatMap(({ feed, dashboard }) => [feed, dashboard]),
  ...FEED_NEW_KEYS,
  ISSUES_KEY,
  CLAIMS_KEY,
];
