# 📋 STATUS_POLICY.md — 상태값 정책 전용 문서
> 작성: 67차 세션 (2026-03-30) | BE 개발서버 실측 기반 확정
> **최종 업데이트: 75차 세션 (2026-04-03) — §9·§11 archive 이관 / 아카이브 참조 링크 추가**
> 참고: `docs/POLICY.md §19`
> 교체 이력·피드백 기록: docs/archive/STATUS_POLICY_history.md

---

## §1. 이 문서의 목적

프로토타입 대시보드에서 사용하는 상태값(enum)의 키, 한글 표시, 전환 흐름, 위젯별 사용 기준을 단일 문서로 정의한다.

**68차 기준 코드 교체 완료.** 아래 내용이 현재 코드의 실제 상태입니다.

> 프로토타입 고지: 이 문서의 일부 정책은 구현 과정 상 임의로 구현된 기능을 포함하며, 실 서비스 정책과 다를 수 있다. 프로토타입 한정 동작은 별도 표기한다.

---

## §2. 위젯별 상태 enum 채택 기준

| 위젯 | 사용 enum | 근거 |
|---|---|---|
| 변경사항 피드(FeedWidget) | `TicketStatus` | 일감(Ticket) 전체 생애주기 |
| 처리필요(IssueWidget) | `IssueStatus` (= TicketReportStatus) | BE 실측: `/shared/v1/ticket-report-statuses` |
| 클레임(ClaimWidget) | `ClaimStatus` | 별도 4종 체계 (BE 키 미확정 포함) |

---

## §3. TicketStatus — 일감 상태 (FeedWidget)

### §3-1. 현재 코드 키 (68차 교체 완료)

| 코드 키 | 한글 | 비고 |
|---|---|---|
| `REPORTED` | 보고됨 | 이슈 접수 상태 |
| `PENDING` | 미배정 | 구: UNASSIGNED |
| `ASSIGNED` | 배정됨 | 유지 |
| `RESERVED` | 수행전 | 구: BEFORE_START |
| `STARTED` | 수행중 | 구: IN_PROGRESS |
| `RESOLVED` | 완료 | 구: COMPLETED |
| `HOLD` | 보류 | 구: ON_HOLD |
| `CANCELED` | 취소 | 구: CANCELLED (철자 변경) |

### §3-2. 상태 전환 흐름

```
보고됨(REPORTED)
  └→ 미배정(PENDING)
       └→ 배정됨(ASSIGNED) → 수행전(RESERVED) → 수행중(STARTED)
                                                      ├→ 완료(RESOLVED)
                                                      └→ 취소(CANCELED)
  └→ 보류(HOLD) ├→ 보고됨(REPORTED)
                └→ 취소(CANCELED)
  └→ 취소(CANCELED)
```

### §3-3. 피드 필터 탭

| 탭 | 포함 상태 |
|---|---|
| ALL | 전체 |
| TASK (업무관리) | PENDING·ASSIGNED·RESERVED·STARTED (지연/임박 제외) |
| DELAY (지연/임박) | PENDING·ASSIGNED·RESERVED·STARTED 중 dueAt 30분 이내 또는 초과 |
| CANCELED (취소) | CANCELED |
| COMPLETED (완료) | RESOLVED |

---

## §4. IssueStatus — 이슈 상태 (IssueWidget)

### §4-0. 이슈와 보류의 관계 정의 (72차 확정)

> **이슈(REPORTED 접수됨)와 보류(HOLD 보류)는 같은 이슈 타입 안에서 상태가 나뉜 것이다.**

- **이슈(REPORTED 접수됨)**: 키퍼·운영자가 업무 수행 중 문제를 접수한 건
- **보류(HOLD 보류)**: 접수된 이슈 중 즉시 처리가 어려워 일시 중단된 상태. 이슈의 한 종류이며 별도 타입이 아님
- KPI "미해결 이슈" 카드에서는 두 상태를 합산하여 표시. 이슈 위젯에서는 "이슈" 탭(REPORTED)과 "보류" 탭(HOLD)으로 나누어 각각 처리할 수 있도록 구분 제공.
- 두 상태 모두 issueTotal에 포함. 별도 holdTotal 가산 없음 — 중복 집계 방지

### §4-1. 현재 코드 키 (68차 교체 완료)

| 코드 키 | 한글 | 비고 |
|---|---|---|
| `REPORTED` | 접수됨 | 구: RECEIVED. 업무 중 보고된 이슈 |
| `HOLD` | 보류 | 구: ON_HOLD. 이슈의 보류 상태 |
| `RESOLVED` | 완료 | 구: CONFIRMED + COMPLETED 통합 |
| `CANCELED` | 취소 | 신규 추가 |

**제거된 키:** PENDING(이슈에 대기 단계 없음), CONFIRMED(BE 미존재 — 운영자 확인 = RESOLVED)

### §4-2. 상태 전환 흐름 (68차 2단계 확정)

```
접수됨(REPORTED)
  ├→ 완료(RESOLVED)    ← 운영자 확인 처리
  ├→ 보류(HOLD)        ← 보류 처리 (이슈 타입 유지, 상태만 전환)
  │    ├→ 접수됨(REPORTED) ← 재접수
  │    └→ 취소(CANCELED)
  └→ 취소(CANCELED)
```

### §4-3. IssueCard 버튼 구성

| 상태 | 왼쪽 버튼 | 오른쪽 버튼 |
|---|---|---|
| REPORTED (접수됨) | 보류 | 완료 |
| HOLD (보류) | 취소 | 재접수 |
| RESOLVED (완료) | 없음 | — |
| CANCELED (취소) | 없음 | — |

### §4-4. 처리필요 필터 탭

| 탭 | 포함 상태 |
|---|---|
| ALL | 전체 |
| ISSUE (이슈) | REPORTED (접수됨) |
| HOLD (보류) | HOLD (보류) |
| COMPLETED (완료) | RESOLVED (완료) |

### §4-5. 배지 색상

| 상태 | 한글 | bg | color |
|---|---|---|---|
| `REPORTED` | 접수됨 | #E3F2FD | #1565C0 |
| `HOLD` | 보류 | #FEEBEE | #FF1744 |
| `RESOLVED` | 완료 | #E8F5E9 | #2E7D32 |
| `CANCELED` | 취소 | #F5F5F5 | #9E9E9E |

---

## §5. ClaimStatus — 클레임 상태 (ClaimWidget)

### §5-0. 클레임 처리 흐름 (73차 확정 — 2안 기준)

> **고객사가 클레임을 등록하고, 파트너사(운영자)가 인정 또는 이의제기로 처리하는 구조.**

```
고객사: 클레임 등록 → 처리 대기(PENDING)
         ↓
파트너사(운영자): 검토 후 처리
         ├→ 인정(ACCEPTED 인정완료)        : 클레임 종결
         └→ 이의제기(DISPUTED 이의제기)    : 클레임 종결
                  ↓ (후속 처리 완료 시)
              이의제기 후속 처리 완료(DISPUTE_COMPLETED)
```

- **PENDING(처리 대기)**: 고객사가 등록한 클레임. 파트너사의 처리를 기다리는 상태. 미확인 클레임에 포함.
- **ACCEPTED(인정완료)**: 파트너사가 클레임을 인정하여 처리 완료. 클레임 종결. 미확인 클레임에서 제외.
- **DISPUTED(이의제기)**: 파트너사가 클레임에 이의를 제기하여 처리 완료. 클레임 종결. 미확인 클레임에서 제외.
- **DISPUTE_COMPLETED(이의제기 후속 처리 완료)**: 이의제기 이후 후속 처리까지 완료된 상태. 미확인 클레임에서 제외.

> DISPUTED vs DISPUTE_COMPLETED 핵심 구분 (73차 확정)
> - DISPUTED: 파트너사가 이의제기 처리를 완료한 순간 = 클레임 종결
> - DISPUTE_COMPLETED: 이의제기 후 발생한 후속 업무(신규 일감 등)까지 모두 완료된 상태
> - 두 상태 모두 미확인 클레임에서 제외

### §5-1. 현재 코드 키

| 코드 키 | 한글 | 종결 여부 | 미확인 포함 | 비고 |
|---|---|---|---|---|
| `PENDING` | 처리 대기 | 미처리 | 포함 | ClaimStatus 전용 (TicketStatus.PENDING과 무관) |
| `DISPUTED` | 이의제기 | 종결 | 제외 | mock 임시 키 — 파트너사 처리 완료 상태 |
| `ACCEPTED` | 인정완료 | 종결 | 제외 | mock 임시 키 |
| `DISPUTE_COMPLETED` | 이의제기 후속 처리 완료 | 종결 | 제외 | mock 임시 키 |

PENDING 제외 나머지 BE 키 미확정 — BE `/shared/v1/ticket-claim-statuses` 실측 후 교체 필요.

### §5-2. 클레임 권한 정책 (73차 확정)

| 계정 유형 | 클레임 등록 | 인정 처리 | 이의제기 |
|---|---|---|---|
| 고객사 | 가능 | 불가 | 불가 |
| 파트너사 | 불가 | 가능 | 가능 |

### §5-3. 클레임 조회 기준 (72차 확정)

- 조회 기준 날짜: 클레임 발생일(reportedAt) 기준
- 과거 미완료 건 포함: 과거에 등록된 건이라도 완료처리(ACCEPTED·DISPUTED·DISPUTE_COMPLETED)되지 않은 건은 전부 위젯에 노출.

---

## §6. KPI 위젯 집계 정책 (73차 수정)

### §6-0. 달성률 확정 수식

```
오늘 업무 달성률 = 오늘 완료 건수 / 오늘 00:00:00 스냅샷 + 당일 신규 생성 건수

분모: 오늘 00:00:00 기준 미완료 전체 + 오늘 신규 생성 건 누적
분자: 오늘 완료된 (티켓 + 이슈 + 클레임) 건수
      D+1 00:00:00 리셋
```

| 환경 | 갱신 방식 | 주기 |
|---|---|---|
| mock 환경 (NEXT_PUBLIC_USE_MOCK=true) | mockStore 재로드 | 30초 (프로토타입 한정) |
| 실운영 환경 | BE API polling | 1분(60초) — 엔드포인트 미확정 |

### §6-1. 업무 현황

| 항목 | 내용 |
|---|---|
| 해당 상태 | PENDING(미배정)·ASSIGNED(배정됨)·RESERVED(수행전)·STARTED(수행중) |
| 집계 범위 | 시작 가능 일시가 오늘 이하인 모든 미완료 일감 (과거 누적 포함) |
| 제외 상태 | REPORTED(보고됨)·HOLD(보류)·RESOLVED(완료)·CANCELED(취소) |
| 확정 수치 (mock) | 17건 (PENDING 3 + ASSIGNED 5 + RESERVED 4 + STARTED 5) |

### §6-2. 미해결 이슈

| 항목 | 내용 |
|---|---|
| 해당 상태 | REPORTED(접수됨)·HOLD(보류) |
| 집계 범위 | 과거 미완료 건 전체 포함 |
| 제외 상태 | RESOLVED(완료)·CANCELED(취소) |
| 확정 수치 (mock) | 6건 (REPORTED 4 + HOLD 2) |

### §6-3. 미확인 클레임

| 항목 | 내용 |
|---|---|
| 해당 상태 | PENDING(처리 대기)만 포함 |
| 제외 상태 | DISPUTED·ACCEPTED·DISPUTE_COMPLETED (모두 종결) |
| 확정 수치 (mock) | 3건 (PENDING 3) |

> DISPUTED(이의제기)는 미확인 클레임에서 제외한다. 파트너사가 처리 완료한 종결 상태이므로 미처리 건으로 보지 않는다.

### §6-4. 달성률 분모

| 항목 | 내용 |
|---|---|
| 구성 | 오늘 00:00:00 기준 미완료 전체 스냅샷 + 이후 당일 신규 생성 건 누적 |
| 확정 수치 (mock) | 42건 (피드 27 + 이슈 9 + 클레임 6) |
| 리셋 | D+1 00:00:00 |

### §6-5. 달성률 분자

| 항목 | 내용 |
|---|---|
| 구성 | 피드 RESOLVED+CANCELED / 이슈 RESOLVED+CANCELED / 클레임 ACCEPTED+DISPUTED+DISPUTE_COMPLETED |
| 완료 기준 | completedAt 필드가 오늘 날짜인 건만 포함 |
| 확정 수치 (mock) | 15건 (피드 10 + 이슈 3 + 클레임 2) |

> 클레임 분자에 DISPUTED(이의제기)를 포함한다. 파트너사 처리 완료(종결) 상태이므로 달성률 분자에 포함된다.

### §6-6. completedAt 필드 정책

| 항목 | 내용 |
|---|---|
| mock 전용 | completedAt: "_TODAY_T{HH:mm:ss}" → KpiCards.tsx에서 오늘 날짜로 치환 |
| BE 연동 시 | feed: resolvedAt/canceledAt / issues: resolvedAt / claims: 미확정 |

### §6-7. 조회 가능 지점 최대 수 (72차 확정)

현재 최대 10개. 향후 최대 30개로 점진적 확대 예정. 확대 시 RoomGroupSelector.tsx MAX_SELECTED 수정 필요.

---

## §7. 한글 표시 통일

| 코드 키 | 한글 | 적용 위젯 |
|---|---|---|
| `REPORTED` (TicketStatus) | 보고됨 | 피드 |
| `REPORTED` (IssueStatus) | 접수됨 | 처리필요 |
| `PENDING` (TicketStatus) | 미배정 | 피드 |
| `ASSIGNED` | 배정됨 | 피드 |
| `RESERVED` | 수행전 | 피드 |
| `STARTED` | 수행중 | 피드 |
| `RESOLVED` (TicketStatus) | 완료 | 피드 |
| `RESOLVED` (IssueStatus) | 완료 | 처리필요 |
| `HOLD` | 보류 | 피드·처리필요 |
| `CANCELED` | 취소 | 피드·처리필요 |
| `PENDING` (ClaimStatus) | 처리 대기 | 클레임 |
| `DISPUTED` (ClaimStatus) | 이의제기 | 클레임 (mock 임시 / 종결) |
| `ACCEPTED` (ClaimStatus) | 인정완료 | 클레임 (mock 임시 / 종결) |
| `DISPUTE_COMPLETED` (ClaimStatus) | 이의제기 후속 처리 완료 | 클레임 (mock 임시 / 종결) |

---

## §8. 키 혼선 방지 규칙

1. **PENDING** — 위젯마다 의미가 다름. 항상 타입과 함께 표기.
   - TicketStatus.PENDING = 미배정
   - ClaimStatus.PENDING = 처리 대기
   - IssueStatus에는 PENDING 없음

2. **RESOLVED vs COMPLETED** — TicketStatus·IssueStatus는 RESOLVED. ClaimStatus 완료는 ACCEPTED·DISPUTED·DISPUTE_COMPLETED.

3. **DISPUTED vs DISPUTE_COMPLETED** — DISPUTED는 이의제기 처리 완료 순간(클레임 종결). DISPUTE_COMPLETED는 후속 업무까지 완료된 상태. 둘 다 미확인 클레임 제외.

4. **CANCELED 철자** — D 1개. 구 버전 CANCELLED(ED 2개)는 전부 교체 완료.

5. **HOLD vs ON_HOLD** — BE 원본은 HOLD. 구 버전 ON_HOLD는 전부 교체 완료.

6. **REPORTED 이중 의미** — TicketStatus.REPORTED(보고됨, 피드) / IssueStatus.REPORTED(접수됨, 처리필요). 위젯 컨텍스트로 구분.

7. **issueTotal vs holdCount** — HOLD(보류)는 issueTotal 안에 포함. 별도 holdCount 가산 없음(이중집계 방지).

8. **로컬 저장 항목** — 위젯 설정(ON/OFF)·지점 선택 필터 ID 목록만 저장. KPI 수치 등 서버 데이터는 저장하지 않음.

---

## §9. BE 연동 시 참고사항 (미확정 항목 포함)

| 항목 | 내용 |
|---|---|
| TicketStatus API | GET /shared/v1/ticket-statuses |
| IssueStatus API | GET /shared/v1/ticket-report-statuses |
| ClaimStatus API | GET /shared/v1/ticket-claim-statuses (미확인) |
| 필드명: 시작시각 | scheduledAt ← BE: executableStartAt |
| 필드명: 기한 | dueAt ← BE: executableEndAt |
| 필드명: 완료시각 (피드) | completedAt (mock) ← BE: resolvedAt / canceledAt |
| 필드명: 완료시각 (이슈) | completedAt (mock) ← BE: resolvedAt |
| 필드명: 완료시각 (클레임) | completedAt (mock) ← BE: 미확정 |
| KPI polling API | 미확정 — BE 확정 후 KpiCards.tsx 연동 |

---

## §10. 위젯 정책표 (73차 기준)

### §10-1. 위젯별 KPI 집계 정책

| 위젯 | 목적 | 해당 상태값 | 제외 상태값 |
|---|---|---|---|
| 업무 현황 | 오늘 수행해야 할 일감 수 | PENDING·ASSIGNED·RESERVED·STARTED | REPORTED·HOLD·RESOLVED·CANCELED |
| 미해결 이슈 | 미완료 이슈·보류 건 수 | REPORTED(접수됨)·HOLD(보류) | RESOLVED·CANCELED |
| 미확인 클레임 | 파트너사 미처리 클레임 건 수 | PENDING(처리 대기) | DISPUTED·ACCEPTED·DISPUTE_COMPLETED |
| 달성률 (분모) | 오늘 해결해야 할 업무 전체 | 피드 27 + 이슈 9 + 클레임 6 = 42건 | — |
| 달성률 (분자) | 오늘 완료된 업무 | 피드: RESOLVED+CANCELED / 이슈: RESOLVED+CANCELED / 클레임: ACCEPTED+DISPUTED+DISPUTE_COMPLETED | — |

### §10-2. 상태값 범례

| 구분 | 코드 키 | 한글 | 구 코드 키 |
|---|---|---|---|
| [피드] 8종 | `REPORTED` | 보고됨 | REPORTED |
| | `PENDING` | 미배정 | UNASSIGNED |
| | `ASSIGNED` | 배정됨 | ASSIGNED |
| | `RESERVED` | 수행전 | BEFORE_START |
| | `STARTED` | 수행중 | IN_PROGRESS |
| | `HOLD` | 보류 | ON_HOLD |
| | `RESOLVED` | 완료 | COMPLETED |
| | `CANCELED` | 취소 | CANCELLED |
| [처리필요] 4종 | `REPORTED` | 접수됨 | RECEIVED |
| | `HOLD` | 보류 | ON_HOLD |
| | `RESOLVED` | 완료 | CONFIRMED + COMPLETED |
| | `CANCELED` | 취소 | — (신규) |
| [클레임] 4종 | `PENDING` | 처리 대기 | PENDING |
| | `DISPUTED` (mock 임시) | 이의제기 (종결) | — (신규) |
| | `ACCEPTED` (mock 임시) | 인정완료 (종결) | COMPLETED |
| | `DISPUTE_COMPLETED` (mock 임시) | 이의제기 후속 처리 완료 (종결) | — (신규) |

DISPUTED·ACCEPTED·DISPUTE_COMPLETED: BE 키 미확정 — BE 실측 후 교체 필요.
