/**
 * @file stores/dashboardStore.ts
 * @description 대시보드 페이지 전역 상태 — Zustand
 *
 * [BE 연동 가이드]
 * - feedFilter: GET /page-dashboard/v1/ticket-reports?filter= 에 전달
 * - issueFilter, claimFilter: 각 위젯 API filter 파라미터
 * - pollingInterval: KPI 자동 갱신 주기 (ms), 0 = 폴링 off
 */

import { create } from 'zustand';
import type { FeedFilter, IssueFilter, ClaimFilter } from '@/types/dashboard';

interface DashboardState {
  // 피드 필터
  feedFilter: FeedFilter;
  // 처리 필요 필터
  issueFilter: IssueFilter;
  // 클레임 필터
  claimFilter: ClaimFilter;
  // KPI 폴링 주기 (ms) — 0이면 폴링 off
  pollingInterval: number;
  // 모달 상태
  activeModal: string | null;

  // Actions
  setFeedFilter: (filter: FeedFilter) => void;
  setIssueFilter: (filter: IssueFilter) => void;
  setClaimFilter: (filter: ClaimFilter) => void;
  setPollingInterval: (ms: number) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  feedFilter: 'ALL',
  issueFilter: 'ALL',
  claimFilter: 'ALL',
  pollingInterval: 30000, // 30초
  activeModal: null,

  setFeedFilter: (feedFilter) => set({ feedFilter }),
  setIssueFilter: (issueFilter) => set({ issueFilter }),
  setClaimFilter: (claimFilter) => set({ claimFilter }),
  setPollingInterval: (pollingInterval) => set({ pollingInterval }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));
