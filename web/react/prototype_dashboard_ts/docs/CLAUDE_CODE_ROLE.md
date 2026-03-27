# Claude Code 역할 정의

> 작성일: 2026-03-24 | prototype_dashboard_ts 프로젝트 내 Claude Code의 역할과 제약사항

---

## 역할 요약

Claude Code는 **서브 도구**로, Claude Desktop(메인)이 진행하는 Phase 3 작업을 보조한다.
기초적인 UI 컴포넌트를 구현하고, mock 데이터가 올바르게 노출되는지 검증한다.

---

## 작업 범위

### 할 수 있는 것
- `src/components/dashboard/` 하위 **새 파일 생성** (IssueCard, ClaimCard 등)
- `IssueWidget.tsx`, `ClaimWidget.tsx` 수정 (카드 연결, 기초 UI)
- 기존 mock 데이터(`issues.json`, `claims.json`) **읽기 전용** 사용
- 데이터 → UI 매핑 검증 (필드가 올바르게 표시되는지)
- 예외처리 판단 (null, 빈 배열, 누락 필드 등)

### 하지 않는 것
- mock 데이터 생성/수정 (Claude Desktop 담당)
- 필터 탭 세부 로직 (Claude Desktop 담당)
- 정책 판단이 필요한 비즈니스 로직
- FeedWidget.tsx, FeedCard.tsx 수정

### 절대 금지
- `docs/POLICY.md`
- `docs/POLICY_notice.md`
- `src/stores/authStore.ts`
- `src/utils/`
- `DashboardHeader.tsx`
- `RoomGroupSelector.tsx`
- `RoomGroupBottomSheet.tsx`
- `KpiCards.tsx`
- `HANDOVER.md`

---

## 관계 규칙

| 방향 | 허용 여부 | 설명 |
|---|---|---|
| Claude Code → Claude Desktop | **영향 금지** | 서브가 메인 작업물을 변경하면 안 됨 |
| Claude Desktop → Claude Code | **영향 허용** | 메인이 서브 작업물을 수정/덮어쓰기 가능 |

---

## 작업 패턴

1. Claude Desktop이 생성한 mock 데이터를 읽는다
2. 타입 정의(`types/dashboard.ts`)에 맞춰 카드 UI를 구현한다
3. FeedCard.tsx의 스타일 패턴(색상, 간격, 폰트)을 참고한다
4. 예외 케이스를 식별하고 처리한다:
   - `photoUrls` 빈 배열 → 이미지 영역 미노출
   - `processingComment` / `comment` null → 코멘트 영역 미노출
   - `scheduledDate` null → 일정 영역 미노출
   - `isNew` true → NEW 배지 노출

---

## 참고 파일

| 파일 | 용도 |
|---|---|
| `src/types/dashboard.ts` | IssueReport, ClaimReport 타입 정의 |
| `src/mocks/issues.json` | 이슈 mock 데이터 (7건) |
| `src/mocks/claims.json` | 클레임 mock 데이터 (4건) |
| `src/components/dashboard/FeedCard.tsx` | 스타일 참고용 (수정 금지) |
