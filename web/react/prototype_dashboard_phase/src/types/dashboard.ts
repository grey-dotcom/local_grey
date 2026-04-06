/**
 * @file types/dashboard.ts
 * @description 대시보드 관련 타입 정의
 *
 * ─ BE 연동 가이드 ────────────────────────────────────────────────────────
 *   KPI:  GET https://indicator.11h.kr/page-dashboard/v1/ticket-stats
 *   피드: GET https://indicator.11h.kr/page-dashboard/v1/ticket-reports
 *   쿼리: roomGroupIds={id}&at={yyyyMMddHHmm}
 *
 * ─ BE DTO 출처 (Butler Keeper - Data Models v1.7.0+77) ──────────────────
 *   TicketThumbnail  lib/tickets/models/ticket_thumbnail.dart
 *   Report           lib/reports/models/report.dart
 *   Photo            lib/photo/models/photo.dart
 *   ImageSource      lib/photo/models/image_source.dart
 *
 * ─ 상태값 정책 ───────────────────────────────────────────────────────────
 *   67차 세션에서 BE 개발서버 실측 기반으로 전면 재정의.
 *   상세: docs/STATUS_POLICY.md
 */

// ─────────────────────────────────────────────────────────────────────────
// 사진 소스 (BE ImageSource 모델 기준)
//
// BE 원본 (lib/photo/models/image_source.dart):
//   id           String   이미지 ID
//   url          String   원본 이미지 URL
//   thumbnailUrl String   압축 썸네일 URL
//
// [BE 연동 시]: TicketReport.photoUrls: string[] → photoSources: PhotoSource[]
// ─────────────────────────────────────────────────────────────────────────
export interface PhotoSource {
  id: string;
  url: string;          // originalUrl (BE: url)
  thumbnailUrl: string; // 압축 썸네일
}

// ─────────────────────────────────────────────────────────────────────────
// 일감(Ticket) 상태 — TicketStatus
//
// BE 원본 (GET /shared/v1/ticket-statuses — 67차 실측 확인):
//   REPORTED  → 보고됨  (이슈 접수 상태)
//   PENDING   → 미배정  (배정 전)
//   ASSIGNED  → 배정됨
//   RESERVED  → 수행전
//   STARTED   → 수행중
//   RESOLVED  → 완료   (업무·이슈 완료 상태)
//   HOLD      → 보류
//   CANCELED  → 취소   (BE 원본 철자: D 1개)
//
// ⚠️ 67차 키 교체 이력:
//   UNASSIGNED  → PENDING   (BE 원본 키로 통일)
//   BEFORE_START → RESERVED
//   IN_PROGRESS  → STARTED
//   COMPLETED    → RESOLVED
//   CANCELLED    → CANCELED  (철자 주의: ED → D)
//   ON_HOLD      → HOLD
// ─────────────────────────────────────────────────────────────────────────
export type TicketStatus =
  | 'REPORTED'   // 보고됨 (이슈 접수 상태 — BE: REPORTED)
  | 'PENDING'    // 미배정 (배정 전 — BE: PENDING)
  | 'ASSIGNED'   // 배정됨 (BE: ASSIGNED)
  | 'RESERVED'   // 수행전 (BE: RESERVED)
  | 'STARTED'    // 수행중 (BE: STARTED)
  | 'RESOLVED'   // 완료   (BE: RESOLVED)
  | 'HOLD'       // 보류   (BE: HOLD)
  | 'CANCELED';  // 취소   (BE: CANCELED — 철자 D 1개)

// ─────────────────────────────────────────────────────────────────────────
// 이슈 상태 — IssueStatus (TicketReportStatus 기준)
//
// BE 원본 (GET /shared/v1/ticket-report-statuses — 67차 실측 확인):
//   REPORTED     → 접수됨  (보고된 이슈, 처리 이전 상태)
//   HOLD         → 보류    (관제자가 검토 후 보류한 이슈)
//   RESOLVED     → 완료    (관제자가 확인하여 완료 처리 — 운영자 "확인" 행위)
//   CANCELED     → 취소    (관리자 또는 키퍼가 취소)
//
// ⚠️ 67차 키 교체 이력:
//   RECEIVED  → REPORTED
//   CONFIRMED → RESOLVED  (BE 미존재 — 운영자 확인 행위 = RESOLVED)
//   PENDING   → 제거       (이슈 상태에 없음. 이슈→업무 전환 시 TicketStatus.PENDING으로 이동)
//   ON_HOLD   → HOLD
//   신규 추가: CANCELED
//
// ⚠️ IssueWidget은 이 enum을 기준으로 함 (FeedWidget의 TicketStatus와 별도)
// DRAFT, AFTER_TICKET은 대시보드 표시 범위 외 — 미구현
// ─────────────────────────────────────────────────────────────────────────
export type IssueStatus =
  | 'REPORTED'   // 접수됨 (BE: TicketReportStatus.REPORTED)
  | 'HOLD'       // 보류   (BE: TicketReportStatus.HOLD)
  | 'RESOLVED'   // 완료   (BE: TicketReportStatus.RESOLVED — 운영자 확인)
  | 'CANCELED';  // 취소   (BE: TicketReportStatus.CANCELED)

// ─────────────────────────────────────────────────────────────────────────
// 이슈 타입
// BE 대응: lib/reports/models/report.dart TicketReportType
// ─────────────────────────────────────────────────────────────────────────
export type IssueType =
  | 'ETC'           // 기타
  | 'SHORTAGE'      // 비품 부족
  | 'CONTAMINATION' // 오염
  | 'DAMAGE'        // 파손
  | 'PROBLEM'       // 문제 발생
  | 'MALFUNCTION';  // 기기 작동 불량

// ─────────────────────────────────────────────────────────────────────────
// 클레임 상태
//
// ⚠️ ClaimStatus.PENDING은 TicketStatus.PENDING(미배정)·IssueStatus와 전혀 다른 개념.
//    ClaimStatus 전용 enum으로 타입 시스템에서 분리됨.
//
// 클레임은 완료된 일감(Ticket)에서만 생성 가능한 정산금액 확정 절차.
// 전환 흐름: 처리대기(PENDING) → 인정완료(ACCEPTED) 또는 이의제기(DISPUTED) → 이의제기완료(DISPUTE_COMPLETED)
//
// ─ BE 연동 시 주의사항 ──────────────────────────────────────────────────
// 아래 키는 프로토타입 mock 전용 임시 키입니다.
// BE 실측 후 정확한 enum 키로 교체 필요:
//
//   ACCEPTED          → BE 키 미확정
//                        근거: Exception.body.KEEPER_ADMIN_CANNOT_ACCEPT_TICKET_CLAIM (11c-server-ko.csv)
//                        → 실 서비스 화면 표시: "인정 완료"
//
//   DISPUTED          → BE 키 미확정
//                        근거: Exception.body.KEEPER_ADMIN_CANNOT_DISPUTE_TICKET_CLAIM (11c-server-ko.csv)
//                        → 실 서비스 화면 표시: "이의 제기"
//
//   DISPUTE_COMPLETED → BE 키 미확정
//                        근거: 실 서비스 화면 표시 "이의 제기 완료" 직접 확인
//                        → BE /shared/v1/ticket-claim-statuses API 실측 필요
//
// [BE 개발자] 위 3개 키를 실 서비스 enum 값으로 교체 후 이 주석 삭제
// ─────────────────────────────────────────────────────────────────────────
export type ClaimStatus =
  | 'PENDING'           // 처리대기 — ClaimStatus 전용
  | 'ACCEPTED'          // 인정완료 — ⚠️ mock 임시 키, BE 확인 후 교체 필요
  | 'DISPUTED'          // 이의제기 — ⚠️ mock 임시 키, BE 확인 후 교체 필요
  | 'DISPUTE_COMPLETED'; // 이의제기완료 — ⚠️ mock 임시 키, BE 확인 후 교체 필요

// ─────────────────────────────────────────────────────────────────────────
// GET /page-dashboard/v1/ticket-stats 응답
// ─────────────────────────────────────────────────────────────────────────
export interface TicketStats {
  delayedCount: number;
  urgentCount: number;
  unresolvedIssueCount: number;
  unconfirmedClaimCount: number;
  completionRate: number;   // 0~100
  completedCount: number;
  incompleteCount: number;
}

// ─────────────────────────────────────────────────────────────────────────
// GET /page-dashboard/v1/ticket-reports 응답
//
// BE 대응 모델: TicketThumbnail (lib/tickets/models/ticket_thumbnail.dart)
//
// 필드 매핑:
//   ticketId        ← id
//   ticketStatus    ← status          (BE: TicketStatus enum)
//   taskType        ← taskGroupName   (BE: 작업 그룹명)
//   roomGroupId     ← roomGroupId     ✅ 동일
//   roomGroupName   ← roomGroupName   ✅ 동일
//   roomName        ← roomName        ✅ 동일 (roomFullName 조합 필요할 수 있음)
//   keeperName      ← (BE 미존재 — 별도 keeper 조회 또는 확장 필드)
//   keeperPhone     ← (BE 미존재 — 프로토타입 확장 필드)
//   scheduledAt     ← executableStartAt.epochMillis
//   dueAt           ← executableEndAt.epochMillis  or  maxExpectedStartAt
//   photoUrls       ← (BE: ImageSource[] → thumbnailUrl 배열로 변환)
//                     [BE 연동 시] photoSources: PhotoSource[] 로 교체
//   feedbackText    ← description (BE: 공간 유의 사항)
//   isNew           ← (BE 미존재 — 프로토타입 확장, 미확인 여부)
//   isUrgent        ← (BE 미존재 — dueAt 기준 30분 이내 판정으로 대체)
// ─────────────────────────────────────────────────────────────────────────

/**
 * 피드 필터 (탭 순서: 전체 → 지연/임박 → 업무관리 → 취소 → 완료)
 * 모바일과 웹 탭 순서 동일 적용
 *
 * TASK(업무관리):
 *   - 지연/임박 아닌 진행 중 상태 (REPORTED|PENDING|ASSIGNED|RESERVED|STARTED)
 *   [BE 연동 시] filter=TASK 또는 별도 API 파라미터 협의 필요
 */
export type FeedFilter =
  | 'ALL'
  | 'DELAY'
  | 'TASK'       // 업무관리 — 모바일과 동일 탭 순서
  | 'CANCELED'   // ⚠️ 67차: CANCELLED → CANCELED (BE 원본 철자)
  | 'STARTED'
  | 'COMPLETED';

// ─────────────────────────────────────────────────────────────────────────
// 알림 메시지 (AlertMessage) — 알림박스 우선순위 정책 (45차 확정)
//
// 알림박스 노출 우선순위:
//   1위: alertMessages 배열 중 registeredAt 기준 최신 1건 노출
//        (SYSTEM = BE 자동 생성 알럿 / OPERATOR = 운영자 직접 입력)
//   2위: alertMessages 없거나 빈 배열이면 마감시간 안내
//        → "마감시간(HH:mm)이 MM분 남았습니다."
//
// [BE 개발자 참고]
//   - 이 타입은 mock 운영용 임시 구조입니다.
//   - 실 서비스에서 BE가 내려줄 필드명/구조는 별도 협의 필요 (미결: B14, B15)
//   - source 구분:
//       'SYSTEM'   : 취소·상태변경 등 시스템 자동 생성 알럿
//                   예) "고객 요청으로 오더가 취소되었습니다. 배정된 키퍼에게 안내가 필요합니다."
//       'OPERATOR' : 웹 운영 서비스에서 운영자가 직접 입력한 문구
//                   예) "청소가 필요없는 곳으로 취소처리 했습니다."
//   - registeredAt: ISO8601 문자열. FE는 이 값 기준 정렬 후 최신 1건 사용.
//     실 서비스에서 BE가 정렬해서 내려주면 FE는 [0]만 사용.
// ─────────────────────────────────────────────────────────────────────────
export interface AlertMessage {
  message: string;          // 노출할 알림 문구
  registeredAt: string;     // 등록 시각 ISO8601 (서버 시간 기준 — 정렬 기준)
  source: 'SYSTEM' | 'OPERATOR'; // SYSTEM: BE 자동 알럿 / OPERATOR: 운영자 입력
}

export interface TicketReport {
  ticketId: string;
  ticketStatus: TicketStatus;
  isNew: boolean;              // 미확인 여부 (프로토타입 확장 — BE 연동 시 확인 트리거 정책과 연계)
  isUrgent: boolean;           // 긴급 여부 (프로토타입 확장 — dueAt 30분 이내 판정 대체 가능)
  taskType: string;            // 일감 타입 (BE: taskGroupName)
  roomGroupId: string;         // 지점 ID — 지점 필터링 기준 (BE: roomGroupId ✅)
  roomGroupName: string;       // 지점명 (BE: roomGroupName ✅)
  roomName: string;            // 공간명 (BE: roomName or roomFullName 조합)
  keeperName: string | null;   // 배정 키퍼명 (프로토타입 확장 — BE 별도 확인 필요)
  keeperPhone: string | null;  // 키퍼 연락처 (프로토타입 확장 — BE 미존재, 전화 아이콘용)
  scheduledAt: string;         // 예정 시각 ISO8601 (BE: executableStartAt.epochMillis)
  dueAt: string;               // 완료 기한 ISO8601 (BE: executableEndAt or maxExpectedStartAt)
  /**
   * 수행 사진 URL 목록
   * [BE 연동 시] BE는 ImageSource[] 구조 반환:
   *   { id: string, url: string, thumbnailUrl: string }
   * 연동 전환 시 photoUrls → photoSources: PhotoSource[] 로 교체할 것
   * PhotoSource 타입은 이 파일 상단에 정의됨
   */
  photoUrls: string[];
  feedbackText: string | null; // 피드백/코멘트 (BE: description — 공간 유의 사항 / 취소 탭에서는 취소 사유로 표시)
  /**
   * 알림박스 메시지 목록 (45차 신규 — 프로토타입 확장)
   * 노출 우선순위:
   *   1위: 이 배열이 있고 비어있지 않으면 registeredAt 최신 1건 노출
   *   2위: 배열 없거나 비어있으면 dueAt 기반 마감시간 안내 노출
   * [BE 연동 시] 실제 필드명·구조 확정 후 교체 필요 (미결: B14, B15)
   * AlertMessage 타입: { message, registeredAt, source: 'SYSTEM'|'OPERATOR' }
   */
  alertMessages?: AlertMessage[];
}

export interface TicketReportsResponse {
  content: TicketReport[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─────────────────────────────────────────────────────────────────────────
// 이슈 카드 (처리 필요 위젯)
//
// BE 대응 모델: TicketReport (lib/reports/models/report.dart)
// issueStatus는 TicketReportStatus 기준 (67차 실측 확정)
//
// 필드 매핑:
//   issueId         ← id
//   issueType       ← type (BE: TicketReportType)
//   issueStatus     ← status (BE: TicketReportStatus)
//   description     ← description     ✅ 동일
//   photoUrls       ← photos[].thumbnailUrl
//                     [BE 연동 시] photoSources: PhotoSource[] 로 교체
//   roomGroupId     ← (BE Report에 없음 — TicketThumbnail.roomGroupId에서 조인 필요)
//   roomGroupName   ← (동일)
//   roomName        ← (동일)
//   reporterName    ← (BE: keeper 정보에서 조인 필요)
//   reportedAt      ← (BE Report에 없음 — TicketThumbnail 시간 필드 활용)
// ─────────────────────────────────────────────────────────────────────────
export type IssueFilter =
  | 'ALL'
  | 'ISSUE'      // 접수됨(REPORTED) 상태
  | 'HOLD'       // 보류(HOLD) 상태 ⚠️ 67차: ON_HOLD → HOLD
  | 'COMPLETED'; // 완료(RESOLVED) 상태

export interface IssueReport {
  issueId: string;             // BE: id (Report.id)
  issueType: IssueType;        // BE: type (TicketReportType)
  issueStatus: IssueStatus;    // BE: TicketReportStatus (67차 재정의 — docs/STATUS_POLICY.md §4)
  isNew: boolean;              // 미확인 여부 (프로토타입 확장)
  roomGroupId: string;         // 지점 ID (BE: TicketThumbnail 조인)
  roomGroupName: string;
  roomName: string;
  reporterName: string;        // 보고한 키퍼명 (BE: keeper 정보 조인)
  reportedAt: string;          // 보고 시각 ISO8601
  description: string;         // BE: description ✅
  /**
   * [BE 연동 시] BE는 Photo[] 구조:
   *   { id, originalUrl, thumbnailUrl, type, state, ... }
   * 연동 전환 시 photoUrls → photoSources: PhotoSource[] 로 교체
   */
  photoUrls: string[];
  processingComment: string | null;
  scheduledDate: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// 클레임 카드
//
// BE 대응 모델: 현재 BE DTO에 클레임 전용 모델 없음
//   Report 모델의 특정 subtype이 클레임에 해당할 수 있음
//   [BE 연동 시] 클레임 전용 API 경로 및 응답 구조 확인 필요
// ─────────────────────────────────────────────────────────────────────────
export type ClaimFilter =
  | 'ALL'
  | 'PENDING'           // 처리대기
  | 'ACCEPTED'          // 인정완료 — ⚠️ mock 임시 키
  | 'DISPUTED'          // 이의제기 — ⚠️ mock 임시 키
  | 'DISPUTE_COMPLETED'; // 이의제기완료 — ⚠️ mock 임시 키

export interface ClaimReport {
  claimId: string;
  claimStatus: ClaimStatus;
  isNew: boolean;
  roomGroupId: string;
  roomGroupName: string;
  roomName: string;
  reporterName: string;
  reportedAt: string;          // ISO8601
  description: string;
  /**
   * [BE 연동 시] photoSources: PhotoSource[] 로 교체
   */
  photoUrls: string[];
  comment: string | null;
}
