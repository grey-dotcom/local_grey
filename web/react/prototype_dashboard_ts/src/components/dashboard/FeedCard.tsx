/**
 * @file components/dashboard/FeedCard.tsx
 * @description 변경사항 피드 — 개별 카드 컴포넌트 (24차 SVG 학습 반영)
 *
 * ─ 확정된 카드 케이스 (24차 SVG 11종 기준) ─────────────────────────────
 *
 * [케이스 A-1] 지연/임박 카드 — IN_PROGRESS + urgentCancel 상태 (SVG 1·2)
 *   - 높이: 277px 기준
 *   - 상태 배지: `일감 마감 지연` / `마감 시간 임박` (빨강 #FEEBEE)
 *   - 좌측 색상바: #FF1744 (빨강)
 *   - 알림박스: #FEEBEE 배경, #D50000 텍스트
 *   - 하단 버튼: urgentCancel + complete(blue contained)
 *   - ⚠️ 정책 미확정 P1: urgentCancel 스타일 — SVG 1=outlined, SVG 2=contained, 둘 다 아님
 *     → 디자이너에게 정확한 스펙 재확인 필요 (현행: outlined 임시 유지)
 *
 * [케이스 A-2] 지연/임박 카드 — IN_PROGRESS + 긴급변경 불가 (SVG 3)
 *   🔴 26차 신규 확정: IN_PROGRESS 상태에서는 urgentChange 불가
 *   - '긴급'은 배정 시점 이전 빠르게 처리할 업무를 의미
 *   - IN_PROGRESS(키퍼 수행중) → 이미 수행중이므로 긴급 변경 의미 없음
 *   - 하단 버튼: complete(blue contained) 단독
 *
 * [케이스 B] 지연/임박 카드 — IN_PROGRESS 미만 + urgentChange 케이스
 *   - ASSIGNED / BEFORE_START 이면서 지연/임박 조건 충족
 *   - 하단 버튼: urgentChange(error-outlined) + complete(blue contained)
 *   - ⚠️ 정책 미확정 P2: urgentChange 버튼 텍스트 `우선 수행 요청` 현행 유지
 *
 * [케이스 C-1] 지연/임박 카드 완료 이후 (SVG 4, h277)
 *   - UX 플로우: SVG 1~3 에서 `완료 처리` 클릭 후 결과 상태
 *   - 상태 배지: `완료`(#E8F5E9/#1B5E20 체크) + `일감 마감 지연`(빨강) 병행
 *   - 좌측 색상바: #FF1744 (빨강 유지 — 지연 정보 노출)
 *   - 하단 버튼: 단독 버튼 (contained #D32F2F) — ⚠️ P3 레이블과 역할 미확정
 *
 * [케이스 C-2] 지연/임박 외 완료 카드 (SVG 5~8 예상, h277)
 *   - 상태 배지: `완료` (#E8F5E9, #1B5E20, 체크 아이콘)
 *   - 좌측 색상바: #9E9E9E (회색)
 *   - 버튼 없음 (읽기 전용) — POLICY.md § 12-2 확정
 *
 * [케이스 D] 업무관리 카드 — UNASSIGNED(미배정) (SVG 5, h470)
 *   - 상태 배지: `미배정` (#FFF3E0, #E65100) + 신규 조건 시 `신규`(#E3F2FD, #0D47A1)
 *   - 좌측 색상바: #9E9E9E (회색)
 *   - 메모/이미지 영역 (#F5F5F5 배경, 입력 가능 inputbox)
 *   - 저장 버튼: 비활성(기본) → memoText || images 있으면 #1976D2 active
 *   - 하단 버튼: `일감 취소`(error-outlined) + `배정 하기`(primary-contained)
 *   - urgentChange: 이 케이스(UNASSIGNED 업무관리)에서는 배정하기와 연동, 별도 미노출
 *
 * [케이스 E] 업무관리 카드 — ASSIGNED(배정됨) (SVG 6, h470)
 *   - 상태 배지: `배정됨` (#E8F5E9, #1B5E20) — UI 표시명: `배정됨` (POLICY §12-11, 27차 확정)
 *   - 헤더 우측 시간: 배정 완료 시각 (assignedAt 계열 필드 — ⚠️ B21)
 *   - 하단 버튼 좌: `긴급 변경`(error-outlined) / 우: `배정 해제`(error-outlined) + `시작하기`(primary-contained)
 *   - inputbox: 업무관리 탭이므로 메모 입력 가능
 *
 * [케이스 F] 업무관리 카드 — IN_PROGRESS(수행중) (SVG 7, h470)
 *   - 상태 배지: `수행중` (#E0F7FA, #006064)
 *   - 헤더 우측 시간: 수행 시작 시각 (startedAt 계열 필드 — ⚠️ B22)
 *   - 하단 버튼 좌: `긴급 변경`(error-outlined) / 우: `시작 취소`(error-outlined) + `완료 하기`(primary-contained)
 *   - 🔴 51차 확정: 업무관리 탭 IN_PROGRESS에서 urgentChange 노출
 *     (지연/임박 탭 IN_PROGRESS에서는 여전히 urgentChange 미노출 — 26차 정책 유지)
 *   - inputbox: 업무관리 탭이므로 메모 입력 가능
 *
 * [케이스 G] 업무관리 카드 — COMPLETED(완료) 메모 없음 (SVG 8 Type A)
 *   - 상태 배지: `완료` (#E8F5E9, #1B5E20, 체크 아이콘)
 *   - opacity: 0.4 (정상 완료, 지연 없음)
 *   - inputbox: 미노출 (완료 상태 → 수정 불가)
 *   - 하단 버튼 우: `후속 일감 생성`(**error-contained** #D32F2F) — 58차 SVG 8 실측 확정
 *   - mock 버그 B 수정 (66차): W1-TCKT-019 feedbackText null로 수정 → 케이스 G 정상 확인 가능
 *
 * [케이스 H] 업무관리 카드 — COMPLETED(완료) 메모 있음 (SVG 9 Type B)
 *   - 케이스 G와 동일, 추가로 읽기 전용 메모 박스 노출
 *   - 읽기 전용 박스: 테두리 없음 / bg white / padding 12px 균일 — '수정 불가' 시각화 (58차 SVG 9 실측 확정)
 *   - 이미지: 디자인 SVG 미제공 → 현재 미노출, 추후 추가
 *
 * ─ 지연/임박 카드 정책 ───────────────────────────────────────────────────
 *   대상: REPORTED|UNASSIGNED|ASSIGNED|BEFORE_START|IN_PROGRESS 이면서
 *         dueAt까지 30분 이하 (초과 포함)
 *   알림 박스: 항상 노출, FE 조합 텍스트
 *     "마감 시간 HH:mm · 잔여 N분" / "마감 시간 HH:mm · +N분 초과"
 *   헤더 우측 시간: 알림 박스와 병행 노출
 *
 * ─ > 버튼 색상 (SVG 1·2·3 전체 실측 확정 — 59차 수정) ─────────────
 *   항상 회색(#EEEEEE) — 상태·탭과 무관하게 단일 색상 (지연/임박도 포함)
 *   이전 코드 'delayUrgent → 파란색' 은 SVG 없이 임의 결정한 오류였음 (59차 SVG 실측으로 확정 수정)
 *   클릭 시 업무 상세 모달 오픈 (인가된 사용자 CRUD 가능)
 *
 * ─ 신규(NEW) 배지 정책 (50차 확정 — AND 조건) ──────────────────────────
 *   [신규 배지 노출 조건 — 두 조건 모두 충족 시만 노출]:
 *     1. ticketStatus === 'UNASSIGNED' (미배정 상태)
 *     2. ticket.isCreatedToday === true (locale 서버 시간 기준 오늘 생성)
 *   → 두 조건 중 하나라도 미충족 시 신규 배지 미노출
 *   소멸 조건: UNASSIGNED → 다른 상태 전환 시 (미배정 벗어나면 자동 소멸)
 *   ⚠️ B12: isCreatedToday 필드 BE 미확정 — mock 임시 처리 중
 *   ⚠️ 구분 주의: NEW(isNew — 사용자 미확인 배지) ≠ 신규(isCreatedToday+UNASSIGNED AND 조건)
 *     - isNew: 사용자가 아직 확인하지 않은 일감 (FeedWidget localStorage 관리, B13 연계)
 *     - isCreatedToday+UNASSIGNED: 오늘 생성된 미배정 일감 (상태 배지 '신규')
 *   프로토타입(isNew): 세션 시작 시 랜덤 복구 (localStorage, FeedWidget 처리)
 *   onDismissNew prop → FeedWidget.handleDismissNew 연결
 *
 * ─ 전화 버튼 (변경사항 피드 한정) ──────────────────────────────────────
 *   웹 브라우저: 전화 아이콘 클릭 → 툴팁 열림, 전화번호 표기
 *   모바일 브라우저: 전화 아이콘 클릭 → tel 링크, OS 전화 앱 연결
 *   keeperPhone null → 버튼 숨김
 *   포맷: 국제번호 제거 + 하이픈 (010-XXXX-XXXX)
 *
 *   [정책] 툴팁 종료 방법 (웹 기준, 21차 확정)
 *     1. 툴팁 내 X 버튼 클릭
 *     2. 전화 아이콘 버튼 재클릭 (토글 — setShowPhoneTip(v => !v))
 *     3. 툴팁 외부 영역 클릭 (mousedown 감지)
 *   [모바일] tel 링크로 OS 전화 앱 직접 연결. 툴팁 없음.
 *
 *   [버그픽스 22차] PhoneTooltip 외부클릭 핸들러에서 전화 아이콘 버튼(triggerRef)
 *     영역을 제외: 툴팁 닫힘 → 버튼 토글로 즉시 다시 열리는 현상 방지.
 *
 * ─ 취소 탭 알림박스 ─────────────────────────────────────────────────────
 *   CANCELLED/ON_HOLD: feedbackText를 취소 사유로 표시
 *   feedbackText null → 알림박스 미노출
 *   [BE 연동 시] cancellationReason 전용 필드 여부 BE 확인 필요
 *
 * ─ COMPLETED 카드 정책 (23차 확정, 24차 SVG 재확인) ──────────────────────
 *   완료된 일감은 수정·변경·삭제·되돌리기가 원천적으로 불가합니다.
 *   - COMPLETED 카드: 액션 버튼 일체 미노출 (읽기 전용)
 *   - revert(되돌리기) 버튼: 존재하지 않음 — 이 파일에서 완전 제거됨
 *   - SVG 5·6·7·8 모두 하단 버튼 없음으로 확인 (24차)
 *   - 상세: docs/POLICY.md § 12-2 참고
 *
 * ─ urgentChange / complete 버튼 확인 팝업 (25차 구현) ────────────────────
 *   urgentChange: 클릭 → ConfirmModal → 확인 시 localIsUrgent=true → urgentCancel 버튼으로 교체
 *   complete:     클릭 → ConfirmModal(복구 불가 경고) → 확인 시 localStatus='COMPLETED' 전환
 *   팝업 스펙: docs/POLICY.md § 12-1, 12-2 참고
 *   BE API: 프로토타입에서는 mock(console.log), 실연동 시 엔드포인트 교체
 *
 * ─ opacity 정책 (66차 버그 C 수정) ──────────────────────────────────────
 *   완료+지연 케이스(wasDelayedBeforeComplete=true): 헤더·키퍼명+위치 행 모두 opacity 1
 *   일반 완료(wasDelayedBeforeComplete=false): 헤더·키퍼명+위치 행 모두 opacity 0.4
 *   수정 전 버그: 키퍼명+위치 행에 wasDelayedBeforeComplete 조건 누락으로 opacity 불일치
 *
 * ─ 24차 정책 미확정 항목 (디자이너/기획 확인 필요) ──────────────────────
 *   [P1] urgentCancel 버튼 스타일: SVG 1=outlined / SVG 2=contained / 둘 다 아님(사용자 확인)
 *        → 현행: outlined 임시 유지, 디자이너 스펙 재확인 필요
 *   [P2] urgentChange 버튼 텍스트: SVG 미등장 → `우선 수행 요청` 유지
 *   [P3] COMPLETED 단독 `수행 완료` 버튼 케이스: SVG 5~8 모두 없음
 *        → 현행: COMPLETED 버튼 없음 유지
 *   [확정] IN_PROGRESS 상태에서 urgentChange 불가 (26차 신규 확정)
 *        → getCardActions에서 IN_PROGRESS + delayUrgent = complete 단독 반환
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { AlertMessage, TicketReport, TicketStatus } from '@/types/dashboard';

// FeedWidget으로 끌어올리는 로컬 상태 타입 (25차)
export interface CardLocalState {
  status: TicketStatus;
  isUrgent: boolean;
}

// ── 상수 ─────────────────────────────────────────────────────────────────────
const URGENT_THRESHOLD_MS = 30 * 60 * 1000;
const MAX_OVER_MINUTES    = 999;

// ── 브라우저 판별 ─────────────────────────────────────────────────────────────
function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// ── 전화번호 포매팅 ───────────────────────────────────────────────────────────
function formatPhoneNumber(raw: string): string {
  let num = raw.replace(/\s/g, '');
  if (num.startsWith('+82')) num = '0' + num.slice(3);
  else if (num.startsWith('0082')) num = '0' + num.slice(4);
  num = num.replace(/[^0-9]/g, '');
  if (/^01[016789]/.test(num)) return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (num.startsWith('02')) {
    return num.length === 9
      ? num.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
      : num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return num.replace(/(\d{3,4})(\d{3,4})(\d{4})/, '$1-$2-$3');
}

// ── 잔여/초과 시간 ────────────────────────────────────────────────────────────
function getRemainingInfo(dueAt: string): { isOver: boolean; minutes: number; dueTimeStr: string } {
  const diff = new Date(dueAt).getTime() - localeNowMs();
  const d    = new Date(dueAt);
  const pad  = (n: number) => String(n).padStart(2, '0');
  const dueTimeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (diff < 0) {
    return { isOver: true,  minutes: Math.max(Math.min(Math.ceil(Math.abs(diff) / 60000), MAX_OVER_MINUTES), 1), dueTimeStr };
  }
  return { isOver: false, minutes: Math.max(Math.floor(diff / 60000), 1), dueTimeStr };
}

// ── 로케일 기준 현재 시각 (ms) ──────────────────────────────────────────────
function localeNowMs(): number {
  return new Date().getTime();
}

// ── 지연/임박 판정 ────────────────────────────────────────────────────────────
export function isDelayOrUrgent(ticket: TicketReport): boolean {
  // ⚠️ 68차: UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
  const targets: TicketStatus[] = ['REPORTED', 'PENDING', 'ASSIGNED', 'RESERVED', 'STARTED'];
  if (!targets.includes(ticket.ticketStatus)) return false;
  return new Date(ticket.dueAt).getTime() - localeNowMs() <= URGENT_THRESHOLD_MS;
}

// ── 완료 카드의 지연 여부 판정 (47차 확정) ───────────────────────────────────
// COMPLETED 카드는 delayUrgent=false이므로 별도 판정 필요.
// ⚠️ 임시: completedAt 필드 없어 현재 시각 기준 판단 — B16 해결 시 completedAt > dueAt 으로 교체
export function wasDelayedBeforeComplete(dueAt: string): boolean {
  return new Date(dueAt).getTime() < localeNowMs();
}

// ── 헤더 우측 시간 텍스트 ─────────────────────────────────────────────────────
export function getTimeLabel(ticket: TicketReport): { text: string; isRed: boolean } {
  if (isDelayOrUrgent(ticket)) {
    const { isOver, minutes } = getRemainingInfo(ticket.dueAt);
    return isOver
      ? { text: `+${minutes}분 초과`, isRed: true }
      : { text: `마감 ${minutes}분 전`, isRed: true };
  }
  const d   = new Date(ticket.dueAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    text: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    isRed: false,
  };
}

// ── 알림박스 텍스트 ───────────────────────────────────────────────────────────
// 노출 우선순위 (45차 확정):
//   1위: alertMessages 배열이 있고 비어있지 않으면 registeredAt 최신 1건 노출
//   2위: alertMessages 없거나 빈 배열이면 dueAt 기반 마감시간 안내
function getAlertBoxContent(dueAt: string, alertMessages?: AlertMessage[]): string {
  if (alertMessages && alertMessages.length > 0) {
    const sorted = [...alertMessages].sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    );
    return sorted[0].message;
  }
  const { isOver, minutes, dueTimeStr } = getRemainingInfo(dueAt);
  return isOver
    ? `마감시간(${dueTimeStr})을 +${minutes}분 초과했습니다.`
    : `마감시간(${dueTimeStr})이 ${minutes}분 남았습니다.`;
}

// ── 상태 배지 ─────────────────────────────────────────────────────────────────
interface BadgeConfig { text: string; bg: string; color: string; icon?: 'check' | 'cancel' }

// 배열 반환 (47차: 완료+지연 중첩 배지 대응)
function getStatusBadges(status: TicketStatus, delayUrgent: boolean, ticket: TicketReport): BadgeConfig[] {
  // ⚠️ 68차: COMPLETED→RESOLVED, CANCELLED→CANCELED, ON_HOLD→HOLD
  //          UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
  if (status === 'RESOLVED') {
    const badges: BadgeConfig[] = [{ text: '완료', bg: '#E8F5E9', color: '#1B5E20', icon: 'check' }];
    if (wasDelayedBeforeComplete(ticket.dueAt)) {
      badges.push({ text: '일감 마감 지연', bg: '#FEEBEE', color: '#FF1744' });
    }
    return badges;
  }
  if (status === 'CANCELED') return [{ text: '취소', bg: '#FEEBEE', color: '#FF1744', icon: 'cancel' }];
  if (status === 'HOLD')     return [{ text: '보류', bg: '#FEEBEE', color: '#FF1744' }];
  if (delayUrgent) {
    const { isOver } = getRemainingInfo(ticket.dueAt);
    return isOver
      ? [{ text: '일감 마감 지연', bg: '#FEEBEE', color: '#FF1744' }]
      : [{ text: '마감 시간 임박', bg: '#FEEBEE', color: '#FF1744' }];
  }
  switch (status) {
    case 'REPORTED':  return [{ text: '보고됨',  bg: '#E3F2FD', color: '#0D47A1' }];
    case 'PENDING':   return [{ text: '미배정',  bg: '#FFF3E0', color: '#E65100' }]; // ⚠️ 68차: UNASSIGNED→PENDING
    case 'ASSIGNED':  return [{ text: '배정됨',  bg: '#E8F5E9', color: '#1B5E20' }];
    case 'RESERVED':  return [{ text: '수행전',  bg: '#E8F5E9', color: '#1B5E20' }]; // ⚠️ 68차: BEFORE_START→RESERVED
    case 'STARTED':   return [{ text: '수행중',  bg: '#E0F7FA', color: '#006064' }]; // ⚠️ 68차: IN_PROGRESS→STARTED
    default:          return [{ text: status,    bg: '#EEEEEE', color: '#212121' }];
  }
}

// ── 좌측 색상바 ───────────────────────────────────────────────────────────────
function getLeftBarColor(status: TicketStatus, delayUrgent: boolean, dueAt?: string): string {
  if (delayUrgent) return '#FF1744';
  if (status === 'CANCELED' || status === 'HOLD') return '#FF1744'; // ⚠️ 68차: CANCELLED→CANCELED, ON_HOLD→HOLD
  if (status === 'RESOLVED' && dueAt && wasDelayedBeforeComplete(dueAt)) return '#FF1744'; // ⚠️ 68차: COMPLETED→RESOLVED
  return '#9E9E9E';
}

// ── 액션 버튼 정의 ────────────────────────────────────────────────────────────
// ⚠️ revert(되돌리기)는 서비스 정책상 존재하지 않습니다. 추가하지 말 것.
type CardAction =
  | 'urgentChange'
  | 'urgentCancel'
  | 'unassign'
  | 'start'
  | 'cancelStart'
  | 'forceComplete'
  | 'createFollowUp'
  | 'assign'
  | 'cancelTicket';

function getCardActions(
  status: TicketStatus,
  delayUrgent: boolean,
  localIsUrgent: boolean,
  activeFilter: import('@/types/dashboard').FeedFilter = 'ALL',
): CardAction[] {
  // ⚠️ 68차: COMPLETED→RESOLVED, CANCELLED→CANCELED, ON_HOLD→HOLD
  //          UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
  if (status === 'RESOLVED') return ['createFollowUp'];
  if (status === 'CANCELED' || status === 'HOLD') return [];

  if (delayUrgent) {
    if (status === 'STARTED') return ['forceComplete']; // ⚠️ 68차: IN_PROGRESS→STARTED
    return [localIsUrgent ? 'urgentCancel' : 'urgentChange', 'forceComplete'];
  }

  switch (status) {
    case 'REPORTED':
    case 'PENDING':   // ⚠️ 68차: UNASSIGNED→PENDING
      return ['cancelTicket', 'assign'];
    case 'ASSIGNED':
    case 'RESERVED':  // ⚠️ 68차: BEFORE_START→RESERVED
      if (activeFilter === 'TASK') {
        return [localIsUrgent ? 'urgentCancel' : 'urgentChange', 'unassign', 'start'];
      }
      return ['unassign', 'start'];
    case 'STARTED':   // ⚠️ 68차: IN_PROGRESS→STARTED
      if (activeFilter === 'TASK') {
        return [localIsUrgent ? 'urgentCancel' : 'urgentChange', 'cancelStart', 'forceComplete'];
      }
      return [];
    default:
      return [];
  }
}

function getActionLabel(
  action: CardAction,
  activeFilter: import('@/types/dashboard').FeedFilter = 'ALL',
): string {
  if (action === 'forceComplete') {
    return activeFilter === 'TASK' ? '완료 하기' : '완료';
  }
  const LABELS: Record<CardAction, string> = {
    urgentChange:   '긴급 변경',
    urgentCancel:   '긴급 취소',
    unassign:       '배정 해제',
    start:          '시작하기',
    cancelStart:    '시작 취소',
    forceComplete:  '완료',
    createFollowUp: '후속 일감 생성',
    assign:         '배정 하기',
    cancelTicket:   '일감 취소',
  };
  return LABELS[action];
}

type BtnVariant = 'error-outlined' | 'error-contained' | 'primary-contained' | 'neutral-outlined';

function getActionVariant(action: CardAction): BtnVariant {
  switch (action) {
    case 'urgentChange':
    case 'unassign':
    case 'cancelStart':
    case 'cancelTicket':
      return 'error-outlined';
    case 'urgentCancel':
    case 'createFollowUp': // SVG 8·9 실측 #D32F2F contained (58차 확정)
      return 'error-contained';
    default:
      return 'primary-contained';
  }
}

// ── 확인 팝업 (25차 신규) ─────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string;
  contents?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, contents, onConfirm, onCancel }: ConfirmModalProps) {
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
        }}>
          {title}
        </p>
        {contents && (
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 400,
            color: 'rgba(0,0,0,0.60)', lineHeight: '20px', letterSpacing: '0.20px',
          }}>
            {contents}
          </p>
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

// ── 이미지 그리드 ─────────────────────────────────────────────────────────────
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

// ── 액션 버튼 컴포넌트 ────────────────────────────────────────────────────────
function ActionButton({ action, isMobile, flex = false, activeFilter = 'ALL', onClick }: {
  action: CardAction; isMobile: boolean; flex?: boolean;
  activeFilter?: import('@/types/dashboard').FeedFilter; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const variant = getActionVariant(action);
  const base: React.CSSProperties = {
    height: isMobile ? 30 : 36, paddingInline: isMobile ? 10 : 16, paddingBlock: isMobile ? 4 : 6,
    fontSize: isMobile ? 13 : 14, fontWeight: 500, fontFamily: 'inherit', borderRadius: 4,
    cursor: 'pointer', letterSpacing: '0.20px', transition: 'background 0.15s, box-shadow 0.15s',
    ...(flex ? { flex: '1 1 0', minWidth: 0 } : {}),
  };
  const styles: Record<BtnVariant, React.CSSProperties> = {
    'error-outlined':    { ...base, border: '1px solid rgba(211,47,47,0.50)', background: hovered ? 'rgba(211,47,47,0.04)' : 'transparent', color: '#D32F2F' },
    'error-contained':   { ...base, border: 'none', background: hovered ? '#B71C1C' : '#D32F2F', color: 'white', boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' },
    'primary-contained': { ...base, border: 'none', background: hovered ? '#1565C0' : '#1976D2', color: 'white', boxShadow: hovered ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' },
    'neutral-outlined':  { ...base, border: '1px solid rgba(0,0,0,0.23)', background: hovered ? 'rgba(0,0,0,0.04)' : 'transparent', color: 'rgba(0,0,0,0.87)' },
  };
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={styles[variant]}>
      {getActionLabel(action, activeFilter)}
    </button>
  );
}

// ── 전화 툴팁 ─────────────────────────────────────────────────────────────────
function PhoneTooltip({
  phone, onClose, triggerRef,
}: {
  phone: string; onClose: () => void; triggerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const formatted = formatPhoneNumber(phone);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, triggerRef]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 38, right: 0, zIndex: 200,
      background: 'white', borderRadius: 8, padding: '12px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.18)', minWidth: 190,
      border: '1px solid #EEEEEE',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', marginBottom: 3, letterSpacing: '0.3px' }}>키퍼 연락처</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,0.87)', letterSpacing: '0.5px' }}>{formatted}</div>
      </div>
      <button type="button" onClick={onClose} style={{
        width: 24, height: 24, border: 'none', background: '#F5F5F5', borderRadius: 4,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="rgba(0,0,0,0.54)" />
        </svg>
      </button>
    </div>
  );
}

// ── 업무 상세 모달 ────────────────────────────────────────────────────────────
// ⚠️ 68차: UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
const STATUS_STEPS: { key: TicketStatus; label: string }[] = [
  { key: 'REPORTED',  label: '보고됨' },
  { key: 'PENDING',   label: '미배정' },
  { key: 'ASSIGNED',  label: '배정됨' },
  { key: 'RESERVED',  label: '수행전' },
  { key: 'STARTED',   label: '수행중' },
];

function formatDateTime(iso: string): string {
  const d   = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 100, flexShrink: 0, fontSize: 12, color: 'rgba(0,0,0,0.38)', paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: 'rgba(0,0,0,0.87)', fontWeight: 500, lineHeight: '20px' }}>{value}</div>
    </div>
  );
}

function TicketDetailModal({ ticket, onClose }: { ticket: TicketReport; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'basic' | 'result'>('basic');
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === ticket.ticketStatus);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 12, width: 560, maxWidth: '90vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #EEEEEE', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.87)' }}>일감 상세</h2>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(0,0,0,0.38)', letterSpacing: '0.3px' }}>{ticket.ticketId}</p>
            </div>
            <button type="button" onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#F5F5F5', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="rgba(0,0,0,0.54)" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {STATUS_STEPS.map((step, idx) => {
              const isActive = step.key === ticket.ticketStatus;
              const isPast   = idx < currentStepIdx;
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? '#1976D2' : isPast ? '#E3F2FD' : '#F5F5F5', border: `2px solid ${isActive ? '#1976D2' : isPast ? '#90CAF9' : '#E0E0E0'}` }}>
                      {isPast ? (
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#1976D2" /></svg>
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? 'white' : '#BDBDBD' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap', color: isActive ? '#1976D2' : isPast ? '#1976D2' : 'rgba(0,0,0,0.38)' }}>{step.label}</span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 32, height: 2, margin: '0 4px', marginBottom: 16, background: idx < currentStepIdx ? '#90CAF9' : '#E0E0E0' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex' }}>
            {([{ key: 'basic', label: '기본 정보' }, { key: 'result', label: '수행 정보' }] as const).map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                style={{ paddingBlock: 10, paddingInline: 16, border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? '#1976D2' : 'rgba(0,0,0,0.60)', borderBottom: activeTab === tab.key ? '2px solid #1976D2' : '2px solid transparent' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
          {activeTab === 'basic' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <DetailRow label="일감 유형"   value={ticket.taskType} />
              <DetailRow label="지점"        value={ticket.roomGroupName} />
              <DetailRow label="공간"        value={ticket.roomName} />
              <DetailRow label="배정 키퍼"   value={ticket.keeperName ?? '미배정'} />
              {ticket.keeperPhone && <DetailRow label="키퍼 연락처" value={formatPhoneNumber(ticket.keeperPhone)} />}
              <DetailRow label="시작 예정"   value={formatDateTime(ticket.scheduledAt)} />
              <DetailRow label="완료 기한"   value={formatDateTime(ticket.dueAt)} />
              {ticket.feedbackText && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', marginBottom: 6 }}>공간 유의사항</div>
                  <div style={{ padding: '12px 16px', background: '#F5F5F5', borderRadius: 8, fontSize: 14, color: 'rgba(0,0,0,0.87)', lineHeight: '20px' }}>{ticket.feedbackText}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ticket.photoUrls.length > 0 ? (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', marginBottom: 8 }}>수행 사진</div>
                  <ImageGrid urls={ticket.photoUrls} />
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.38)', fontSize: 14 }}>수행 사진이 없습니다.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
interface FeedCardProps {
  ticket: TicketReport;
  isMobile?: boolean;
  isSingleColumn?: boolean;
  onDismissNew?: (ticketId: string) => void;
  localOverride?: CardLocalState;
  onLocalStateChange?: (ticketId: string, next: CardLocalState) => void;
  activeFilter?: import('@/types/dashboard').FeedFilter;
}

export function FeedCard({ ticket, isMobile = false, isSingleColumn = false, onDismissNew, localOverride, onLocalStateChange, activeFilter = 'ALL' }: FeedCardProps) {
  const [cardHovered,   setCardHovered]   = useState(false);
  const [showDetail,    setShowDetail]    = useState(false);
  const [showPhoneTip,  setShowPhoneTip]  = useState(false);
  const [confirmType,   setConfirmType]   = useState<
    'urgentChange' | 'urgentCancel' | 'forceComplete' |
    'unassign' | 'start' | 'cancelStart' | 'cancelTicket' | null
  >(null);
  const [localStatus,   setLocalStatus]   = useState<TicketStatus>(ticket.ticketStatus);
  const [localIsUrgent, setLocalIsUrgent] = useState(false);
  const [memoText,      setMemoText]      = useState('');

  const effectiveStatus   = localOverride?.status   ?? localStatus;
  const effectiveIsUrgent = localOverride?.isUrgent ?? localIsUrgent;

  const phoneBtnRef = useRef<HTMLDivElement>(null);

  // ⚠️ 68차: COMPLETED→RESOLVED, CANCELLED→CANCELED, ON_HOLD→HOLD
  const delayUrgent  =
    !['RESOLVED', 'CANCELED', 'HOLD'].includes(effectiveStatus) &&
    isDelayOrUrgent({ ...ticket, ticketStatus: effectiveStatus });
  const statusBadges = getStatusBadges(effectiveStatus, delayUrgent, ticket);
  const leftBarColor = getLeftBarColor(effectiveStatus, delayUrgent, ticket.dueAt);
  const timeLabel    = getTimeLabel({ ...ticket, ticketStatus: effectiveStatus });
  const actions      = getCardActions(effectiveStatus, delayUrgent, effectiveIsUrgent, activeFilter);
  const isCompleted  = effectiveStatus === 'RESOLVED';  // ⚠️ 68차: COMPLETED→RESOLVED
  const isCancelled  = effectiveStatus === 'CANCELED' || effectiveStatus === 'HOLD'; // ⚠️ 68차: CANCELLED→CANCELED, ON_HOLD→HOLD

  const dismissNew = useCallback(() => {
    if (ticket.isNew) onDismissNew?.(ticket.ticketId);
  }, [ticket.isNew, ticket.ticketId, onDismissNew]);

  function handleActionClick(action: CardAction) {
    dismissNew();
    if (action === 'urgentChange')   { setConfirmType('urgentChange');   return; }
    if (action === 'urgentCancel')   { setConfirmType('urgentCancel');   return; }
    if (action === 'forceComplete')  { setConfirmType('forceComplete');  return; }
    if (action === 'unassign')       { setConfirmType('unassign');       return; }
    if (action === 'start')          { setConfirmType('start');          return; }
    if (action === 'cancelStart')    { setConfirmType('cancelStart');    return; }
    if (action === 'cancelTicket')   { setConfirmType('cancelTicket');   return; }
    if (action === 'createFollowUp') {
      console.log('[FeedCard] createFollowUp', ticket.ticketId);
      return;
    }
    console.log(`[FeedCard] ${action}`, ticket.ticketId);
  }

  function handleConfirm() {
    if (confirmType === 'urgentChange') {
      console.log('[FeedCard] urgentChange API call', ticket.ticketId);
      const next: CardLocalState = { status: effectiveStatus, isUrgent: true };
      setLocalIsUrgent(true);
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'urgentCancel') {
      console.log('[FeedCard] urgentCancel API call', ticket.ticketId);
      const next: CardLocalState = { status: effectiveStatus, isUrgent: false };
      setLocalIsUrgent(false);
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'forceComplete') {
      console.log('[FeedCard] forceComplete API call', ticket.ticketId);
      const next: CardLocalState = { status: 'RESOLVED', isUrgent: effectiveIsUrgent }; // ⚠️ 68차: COMPLETED→RESOLVED
      setLocalStatus('RESOLVED');
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'unassign') {
      console.log('[FeedCard] unassign API call', ticket.ticketId);
      const next: CardLocalState = { status: 'PENDING', isUrgent: effectiveIsUrgent }; // ⚠️ 68차: UNASSIGNED→PENDING
      setLocalStatus('PENDING');
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'start') {
      console.log('[FeedCard] start API call', ticket.ticketId);
      const next: CardLocalState = { status: 'STARTED', isUrgent: effectiveIsUrgent }; // ⚠️ 68차: IN_PROGRESS→STARTED
      setLocalStatus('STARTED');
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'cancelStart') {
      console.log('[FeedCard] cancelStart API call', ticket.ticketId);
      const next: CardLocalState = { status: 'ASSIGNED', isUrgent: effectiveIsUrgent };
      setLocalStatus('ASSIGNED');
      onLocalStateChange?.(ticket.ticketId, next);
    }
    if (confirmType === 'cancelTicket') {
      console.log('[FeedCard] cancelTicket API call', ticket.ticketId);
      const next: CardLocalState = { status: 'CANCELED', isUrgent: false }; // ⚠️ 68차: CANCELLED→CANCELED
      setLocalStatus('CANCELED');
      onLocalStateChange?.(ticket.ticketId, next);
    }
    setConfirmType(null);
  }

  function handleCancelConfirm() {
    setConfirmType(null);
  }

  const fs = { badge: isMobile ? 12 : 14, name: 16, location: 14, time: isMobile ? 12 : 14, alert: 14 };
  const cardPadding  = isMobile ? '12px' : '24px 24px 24px 16px';
  const alertPadding = isMobile ? '8px 12px' : '16px 20px';

  // 알림박스 텍스트 (47차 수정)
  // RESOLVED(완료) 카드에 alertMessages 있으면 노출 (COMPLETED→RESOLVED 68차)
  const alertText: string | null = delayUrgent
    ? getAlertBoxContent(ticket.dueAt, ticket.alertMessages)
    : isCompleted && ticket.alertMessages && ticket.alertMessages.length > 0
      ? getAlertBoxContent(ticket.dueAt, ticket.alertMessages)
      : null;

  // 메모 inputbox 노출 조건 (27차/51차)
  // ⚠️ 68차: UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED
  const showMemo =
    activeFilter === 'TASK' &&
    !isCompleted &&
    !isCancelled &&
    !delayUrgent &&
    ['REPORTED', 'PENDING', 'ASSIGNED', 'RESERVED', 'STARTED'].includes(effectiveStatus);

  const memoSaveActive = memoText.trim().length > 0;

  const hasPhone = !!ticket.keeperPhone;

  const detailBtnStyle: React.CSSProperties = {
    width: 30, height: 30, background: '#EEEEEE',
    borderRadius: isMobile ? 8 : 4, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const detailBtnIconColor = 'rgba(0,0,0,0.56)';

  const confirmConfig: { title: string; contents?: string } | null = (() => {
    switch (confirmType) {
      case 'urgentChange':
        if (effectiveStatus === 'REPORTED' || effectiveStatus === 'UNASSIGNED') {
          return { title: '배정하면 긴급업무로 생성돼요' };
        }
        return { title: '선택하신 일감을 긴급 처리 건으로 변경하시겠습니까?' };
      case 'urgentCancel':
        return { title: '선택하신 일감의 긴급 처리를 취소하시겠습니까?' }; // ⚠️ Q3 임시
      case 'forceComplete':
        return { title: '선택하신 일감을 완료 처리하시겠습니까?', contents: '완료 처리된 일감은 복구할 수 없습니다.' };
      case 'unassign':
        return { title: '키퍼 매칭을 해제하시겠습니까?' };
      case 'start':
        return { title: '선택하신 일감을 시작 처리하시겠습니까?' };
      case 'cancelStart':
        return { title: '선택하신 일감의 시작을 취소하시겠습니까?', contents: '취소 시 배정됨 상태로 되돌아갑니다.' };
      case 'cancelTicket':
        return { title: '일감을 취소하시겠습니까?', contents: '취소된 일감은 복구할 수 없으며 어드민에서 삭제됩니다.' };
      default:
        return null;
    }
  })();

  return (
    <>
      {showDetail && <TicketDetailModal ticket={ticket} onClose={() => setShowDetail(false)} />}

      {confirmType && confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          contents={confirmConfig.contents}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      <div
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
        onClick={dismissNew}
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
          <div style={{ width: 4, background: leftBarColor }} />
        </div>

        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* 헤더 영역
               opacity 정책 (47차/66차 버그C 수정):
               완료+지연 케이스는 지연 정보 노출을 위해 opacity 1 유지
               일반 완료(지연 없음)만 opacity 0.4 적용 */}
          <div style={{ opacity: isCompleted && !delayUrgent && !wasDelayedBeforeComplete(ticket.dueAt) ? 0.4 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              {/* 상태배지 영역: wrap 허용 — 62차 원정책 (nowrap+visible 조합 버그 → wrap 복원) */}
              <div style={{ flex: '1 1 0', display: 'flex', flexWrap: 'wrap', gap: isMobile ? 4 : 6, alignItems: 'center', minWidth: 0, overflow: 'visible' }}>
                {ticket.isNew && (
                  <span style={{
                    height: 30, paddingInline: 8, paddingBlock: 4,
                    background: '#D50000', borderRadius: 8, color: 'white',
                    fontSize: fs.badge, fontWeight: 700,
                    display: 'flex', alignItems: 'center',
                    lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>NEW</span>
                )}
                {statusBadges.map((badge, idx) => (
                  <span key={idx} style={{
                    height: 30, paddingInline: 8, paddingBlock: 4,
                    background: badge.bg, borderRadius: 8,
                    color: badge.color,
                    fontSize: fs.badge, fontWeight: (isMobile || badge.icon === 'check') ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: 4,
                    lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px', border: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {badge.icon === 'check' && (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill={badge.color} />
                      </svg>
                    )}
                    {badge.icon === 'cancel' && (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={badge.color} />
                      </svg>
                    )}
                    {badge.text}
                  </span>
                ))}
                <span style={{
                  height: 30, paddingInline: 8, paddingBlock: 4,
                  background: '#EEEEEE', borderRadius: 8, color: '#212121',
                  fontSize: fs.badge, fontWeight: isMobile ? 700 : 500,
                  display: 'flex', alignItems: 'center',
                  lineHeight: isMobile ? '12px' : '21.98px', letterSpacing: '0.20px',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {ticket.taskType}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 0, overflow: 'hidden' }}>
                {!isMobile && (
                  <span style={{
                    color: timeLabel.isRed ? '#FF1744' : '#757575',
                    fontSize: fs.time, fontWeight: 500,
                    lineHeight: '20.02px', letterSpacing: '0.20px', whiteSpace: 'nowrap',
                  }}>
                    {timeLabel.text}
                  </span>
                )}

                {hasPhone && (
                  <>
                    <div ref={phoneBtnRef} style={{ position: 'relative' }}>
                      {isMobileBrowser() ? (
                        <a href={`tel:${ticket.keeperPhone}`} style={{
                          width: 30, height: 30, background: '#EEEEEE',
                          borderRadius: isMobile ? 8 : 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                        }}>
                          <PhoneIcon />
                        </a>
                      ) : (
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setShowPhoneTip(v => !v); }}
                          style={{
                            width: 30, height: 30,
                            background: showPhoneTip ? '#E3F2FD' : '#EEEEEE',
                            borderRadius: isMobile ? 8 : 4,
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          <PhoneIcon />
                        </button>
                      )}
                      {showPhoneTip && ticket.keeperPhone && (
                        <PhoneTooltip
                          phone={ticket.keeperPhone}
                          onClose={() => setShowPhoneTip(false)}
                          triggerRef={phoneBtnRef}
                        />
                      )}
                    </div>
                    <div style={{ height: 12, width: 0, borderLeft: '1px solid rgba(0,0,0,0.12)' }} />
                  </>
                )}

                <button type="button"
                  onClick={e => { e.stopPropagation(); dismissNew(); setShowDetail(true); }}
                  style={detailBtnStyle}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill={detailBtnIconColor} />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 키퍼명 + 위치 정보 */}
          {/* opacity 정책 (헤더와 동일 — 66차 버그C 수정): 완료+지연 케이스는 지연 정보 노출을 위해 opacity 1 유지 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: isCompleted && !delayUrgent && !wasDelayedBeforeComplete(ticket.dueAt) ? 0.4 : 1 }}>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-start', alignItems: 'center' }}>
              <span style={{ color: 'rgba(0,0,0,0.87)', fontSize: fs.name, fontWeight: 700, lineHeight: '28px', letterSpacing: '0.20px' }}>
                {ticket.keeperName ?? '미배정'}
              </span>
              {isMobile && (
                <span style={{ color: timeLabel.isRed ? '#FF1744' : '#757575', fontSize: fs.time, fontWeight: 400, lineHeight: '19.92px', letterSpacing: '0.20px' }}>
                  {timeLabel.text}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="black" />
              </svg>
              <span style={{ color: 'rgba(0,0,0,0.87)', fontSize: fs.location, fontWeight: 700, lineHeight: '20.02px', letterSpacing: '0.20px' }}>
                {ticket.roomGroupName}ㆍ{ticket.roomName}
              </span>
            </div>
          </div>

          {/* 알림박스 */}
          {alertText && (
            <div style={{
              padding: alertPadding, background: '#FEEBEE', borderRadius: 8,
              color: '#D50000', fontSize: fs.alert, fontWeight: 400,
              lineHeight: '20.02px', letterSpacing: '0.20px',
              whiteSpace: 'normal',
            }}>
              {alertText}
            </div>
          )}

          {/* 수행 사진 */}
          {ticket.photoUrls.length > 0 && <ImageGrid urls={ticket.photoUrls} />}

          {/* 메모 입력 inputbox (SVG 5·6·7 — 업무관리 탭 + 미완료 상태) */}
          {showMemo && (
            <div style={{
              padding: 12, background: '#F5F5F5', borderRadius: 8,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ background: 'white', borderRadius: 4 }}>
                <textarea
                  value={memoText}
                  onChange={e => setMemoText(e.target.value)}
                  placeholder="내용을 작성해주세요."
                  rows={4}
                  style={{
                    width: '100%', height: 104, padding: '8px 12px',
                    border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4,
                    background: 'white', resize: 'none', boxSizing: 'border-box',
                    fontSize: 16, fontWeight: 400, lineHeight: '24px',
                    letterSpacing: '0.20px', fontFamily: 'inherit',
                    color: memoText ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.38)',
                  }}
                />
              </div>
              <div style={{ padding: 8, background: 'white', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 40, height: 40, background: '#D9D9D9', borderRadius: '50%', flexShrink: 0 }} />
                </div>
                <div style={{ height: 0, borderTop: '1px solid #EEEEEE' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(0,0,0,0.87)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', padding: '6px 8px' }}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="rgba(0,0,0,0.87)" />
                    </svg>
                    사진 추가
                  </button>
                  {/* 저장 — 취소 미노출 (50차 §12-9), OR 조건: memoText || images */}
                  <button
                    type="button"
                    disabled={!memoSaveActive}
                    onClick={() => console.log('[FeedCard] saveMemo', ticket.ticketId, memoText)}
                    style={{
                      height: isMobile ? 30 : 36, paddingInline: isMobile ? 10 : 16, paddingBlock: isMobile ? 4 : 6,
                      background: memoSaveActive ? '#1976D2' : 'rgba(0,0,0,0.12)',
                      borderRadius: 4, border: 'none',
                      color: memoSaveActive ? 'white' : 'rgba(0,0,0,0.38)',
                      fontSize: isMobile ? 13 : 14, fontWeight: 500, fontFamily: 'inherit',
                      cursor: memoSaveActive ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 읽기 전용 메모 박스 (SVG 9 Type B — 업무관리 탭 + COMPLETED + feedbackText 있음)
               테두리 없음: 입력 가능 textarea outline과 구분 → 수정 불가 시각화
               padding 12px 균일: 58차 SVG 9 실측 (이전 paddingLeft:20/paddingTop:16은 임시값) */}
          {isCompleted && activeFilter === 'TASK' && ticket.feedbackText && (
            <div style={{ padding: 12, background: '#F5F5F5', borderRadius: 8 }}>
              <div style={{
                padding: 12,
                background: 'white', borderRadius: 4,
                // 테두리 없음 — 수정 불가 상태 시각화
                color: '#212121', fontSize: 14, fontWeight: 400,
                lineHeight: '20.02px', letterSpacing: '0.20px',
                wordBreak: 'break-word',
              }}>
                {ticket.feedbackText}
              </div>
            </div>
          )}

          {/* 취소/보류 feedbackText — 취소 사유 표시 (CANCELLED·ON_HOLD 탭 전용) */}
          {isCancelled && ticket.feedbackText && (
            <div style={{
              padding: '16px 20px', background: '#F5F5F5', borderRadius: 8,
              outline: '1px #EEEEEE solid', outlineOffset: -1,
              color: 'rgba(0,0,0,0.87)', fontSize: 14, fontWeight: 400,
              lineHeight: '20.02px', letterSpacing: '0.20px',
            }}>
              {ticket.feedbackText}
            </div>
          )}

          {/* 하단 액션 버튼 */}
          {actions.length > 0 && (
            <>
              <div style={{ height: 0, borderTop: '1px solid #EEEEEE' }} />
              <div style={{ display: 'flex', justifyContent: actions.some(a => a === 'urgentChange' || a === 'urgentCancel') ? 'space-between' : 'flex-end', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {actions.filter(a => a === 'urgentChange' || a === 'urgentCancel').map((action) => (
                    <ActionButton key={action} action={action} isMobile={isMobile}
                      activeFilter={activeFilter} onClick={() => handleActionClick(action)}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {actions.filter(a => a !== 'urgentChange' && a !== 'urgentCancel').map((action) => (
                    <ActionButton key={action} action={action} isMobile={isMobile}
                      activeFilter={activeFilter} onClick={() => handleActionClick(action)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── 전화 아이콘 ───────────────────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="rgba(0,0,0,0.56)" />
    </svg>
  );
}
