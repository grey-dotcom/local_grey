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
// 일감(Ticket) 상태
//
// BE 원본 (lib/tickets/utils/enums.dart TicketStatus):
//   PENDING    → 대기 (배정 전)
//   ASSIGNED   → 배정됨
//   RESERVED   → 예약됨 (수행전)
//   STARTED    → 수행중
//   RESOLVED   → 완료
//   CANCELED   → 취소
//
// 프로토타입 확장 (BE와 협의 중인 8단계):
//   REPORTED   — 보고됨 (접수 단계, BE PENDING 이전)
//   UNASSIGNED — 미배정 (BE PENDING과 유사)
//   ON_HOLD    — 보류 (BE 미존재, 프로토타입 확장)
//
// [BE 연동 시]: BE 응답값 → 프로토타입 매핑 테이블 확인 필요
// ─────────────────────────────────────────────────────────────────────────
export type TicketStatus =
  | 'REPORTED'     // 보고됨     (프로토타입 확장 — BE: PENDING 이전 단계)
  | 'UNASSIGNED'   // 미배정     (프로토타입 확장 — BE: PENDING 유사)
  | 'ASSIGNED'     // 배정됨     (BE: ASSIGNED)
  | 'BEFORE_START' // 수행전     (프로토타입 확장 — BE: RESERVED)
  | 'IN_PROGRESS'  // 수행중     (프로토타입 확장 — BE: STARTED)
  | 'COMPLETED'    // 완료       (프로토타입 확장 — BE: RESOLVED)
  | 'ON_HOLD'      // 보류       (프로토타입 확장 — BE 미존재)
  | 'CANCELLED';   // 취소       (프로토타입 확장 — BE: CANCELED)

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
// ─────────────────────────────────────────────────────────────────────────
export type ClaimStatus =
  | 'PENDING'    // 처리 대기
  | 'COMPLETED'; // 완료

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
 *   - 지연/임박 아닌 진행 중 상태 (REPORTED|UNASSIGNED|ASSIGNED|BEFORE_START|IN_PROGRESS)
 *   - 지연/임박 카드도 업무관리 탭에 포함 여부 → PM 확인 필요
 *   [BE 연동 시] filter=TASK 또는 별도 API 파라미터 협의 필요
 */
export type FeedFilter =
  | 'ALL'
  | 'DELAY'
  | 'TASK'       // 업무관리 — 모바일과 동일 탭 순서
  | 'CANCELLED'
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
// BE 대응 모델: Report (lib/reports/models/report.dart)
//
// 필드 매핑:
//   issueId         ← id
//   issueType       ← type (BE: TicketReportType)
//   issueStatus     ← (BE Report에 status 없음 — 대시보드 전용 확장 필드)
//   description     ← description     ✅ 동일
//   photoUrls       ← photos[].thumbnailUrl
//                     [BE 연동 시] photoSources: PhotoSource[] 로 교체
//   roomGroupId     ← (BE Report에 없음 — TicketThumbnail.roomGroupId에서 조인 필요)
//   roomGroupName   ← (동일)
//   roomName        ← (동일)
//   reporterName    ← (BE: keeper 정보에서 조인 필요)
//   reportedAt      ← (BE Report에 없음 — TicketThumbnail 시간 필드 활용)
//
// ⚠️ BE Report 모델은 특이사항(단건) 기준. 대시보드 이슈 목록 API는 별도 확인 필요.
// ─────────────────────────────────────────────────────────────────────────
export type IssueFilter =
  | 'ALL'
  | 'ISSUE'
  | 'ON_HOLD'
  | 'COMPLETED';

export interface IssueReport {
  issueId: string;             // BE: id (Report.id)
  issueType: IssueType;        // BE: type (TicketReportType)
  issueStatus:                 // 대시보드 전용 확장 — BE 연동 시 API 응답 확인 필요
    | 'RECEIVED'   // 접수
    | 'PENDING'    // 대기
    | 'CONFIRMED'  // 확정
    | 'COMPLETED'; // 완료
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
  | 'PENDING'
  | 'COMPLETED';

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
