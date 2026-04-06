# prototype_dashboard_ts 세션 인수인계
> 최종 업데이트: 2026-04-06 (76차 완료)
> 필수 지시·가드레일·역할 정의: HANDOVER_BASE.md
> 세션 이력: docs/archive/HANDOVER_history.md
> 검증 이력: docs/archive/VALIDATION_LOG.md
> 정책 변경 이력: docs/archive/POLICY_history.md
> 파일 라우팅: CLAUDE.md

---

## 현재 세션 맥락 (77차 시작 기준)

진행 Phase: Phase 3 기능 정비 + 배포 준비.

완료된 것 (76차)
- SPEC_FEED·ISSUE·CLAIM 헤더 검증 참조 줄 추가
- 로컬 배포버전 docs/ 8종 복사 완료
- HANDOVER_BASE.md 문서 배포 프로토콜 추가 (76차 확정)
- RoomGroupSelector: 선택 카운팅 UI·하단 적용 버튼 제거 (ts·phase 공통)
- WidgetSelector: KPI 하위 개별 선택 제거 (ts·phase 공통)
- NoticeBanner: 자동 루프 제거 (ts)
- phase page.tsx: 공지사항 전체 제거
- DashboardHeader: 지점 선택 왼쪽 아이콘 → DomainFilled 교체 (ts·phase 공통)

다음 할 일 (우선순위 순)
1. git commit/push (76차 변경사항 전체)
2. 배포 — prototype_dashboard_phase Vercel
   - 로그인 실패 원인 확인 (NEXT_PUBLIC_USE_MOCK Vercel 적용 여부)
   - vercel --force → 로그인 확인 → 정상이면 vercel --prod
3. 배포 — prototype_dashboard_ts Vercel 연결
   - .vercel/ 없음 → vercel link 후 vercel --prod
4. IssueWidget Phase 3 카드 구현 (Claude Code)
5. ClaimWidget Phase 3 카드 구현 (Claude Code)

---

## 77차 세션 시작 프롬프트

HANDOVER.md와 HANDOVER_BASE.md를 읽고 시작해줘.

[76차 완료 반드시 숙지]
- SPEC_FEED·ISSUE·CLAIM 검증 참조 줄 추가 완료
- 로컬 배포버전 docs/ 8종 복사 + HANDOVER_BASE.md 문서 배포 프로토콜 추가
- RoomGroupSelector: 카운팅 UI·적용 버튼 제거 (ts·phase)
- WidgetSelector: KPI 하위 개별 선택 제거 (ts·phase)
- NoticeBanner: 자동 루프 제거 (ts) / phase page.tsx: 공지 전체 제거
- DashboardHeader: 지점 선택 왼쪽 아이콘 → DomainFilled 교체 (ts·phase)

[이번 세션 할 일 우선순위 순]

1. git commit/push (76차 변경사항)
   변경 파일:
   - docs/SPEC_FEED·ISSUE·CLAIM.md
   - HANDOVER_BASE.md
   - prototype_dashboard_phase/docs/ 8종 신규
   - RoomGroupSelector.tsx, WidgetSelector.tsx (ts·phase)
   - NoticeBanner.tsx (ts)
   - phase/page.tsx, DashboardHeader.tsx (ts·phase)

2. 배포 — prototype_dashboard_phase
   cd /Users/grey/Desktop/local_grey/web/react/prototype_dashboard_phase
   vercel --force → 로그인 확인 → 정상이면 vercel --prod

3. 배포 — prototype_dashboard_ts
   .vercel/ 없음 → vercel link 먼저 → vercel --prod

4. IssueWidget / ClaimWidget Phase 3 카드 구현 (Claude Code)

[미결 항목]
- DISPUTE_COMPLETED 발생 조건·처리 주체 미확정 (PM + BE)
- 클레임 상태값 BE 확정 필요
- 갱신 주기 API 엔드포인트 미확정
- POLICY.md(89KB) 분리 별도 세션 필요

[세션 종료 시]
HANDOVER_BASE.md 4단계 절차 준수.
docs/archive/HANDOVER_history.md에 이번 세션 완료·미결 추가.

---

## KPI 확정 수치 (73차 기준)

| KPI | 수치 | 근거 |
|---|---|---|
| 업무 현황 | 17건 | PENDING 3 + ASSIGNED 5 + RESERVED 4 + STARTED 5 |
| 미해결 이슈 | 6건 | REPORTED 4 + HOLD 2 |
| 미확인 클레임 | 3건 | PENDING 3 (DISPUTED 종결 상태로 제외) |
| 달성률 분모 | 42건 | 피드27 + 이슈9 + 클레임6 |
| 달성률 분자 | 15건 | 피드10 + 이슈3 + 클레임2 |
| 달성률 | 36% | 15/42 |

---

## 미결 이슈

| 구분 | 이슈 | 우선순위 |
|---|---|---|
| 배포 | prototype_dashboard_phase Vercel 로그인 실패 확인 | 최우선 |
| 배포 | prototype_dashboard_ts Vercel 연결 및 배포 | 최우선 |
| FE | IssueWidget Phase 3 카드 구현 | 최우선 |
| FE | ClaimWidget Phase 3 카드 구현 | 최우선 |
| BE | 클레임 상태값 확정 | 높음 |
| BE | 갱신 주기 API 엔드포인트 확정 | 높음 |
| PM | DISPUTE_COMPLETED 발생 조건·처리 주체 확정 | 높음 |
| PM | 긴급 처리 취소 팝업 확정 텍스트 | 높음 |
| FE | FE-R5: KpiCards any 타입 교체 | 중간 |
| FE | FE-R6: applyTodayDueAt 유틸 분리 | 중간 |
| 문서 | POLICY.md(89KB) 분리 | 높음 |

---

## 파일 상태 (76차 기준)

[레이어 0]
CLAUDE.md                              75차

[레이어 1]
HANDOVER_BASE.md                       76차 갱신 (문서 배포 프로토콜 추가)
HANDOVER.md                            76차 갱신
docs/archive/HANDOVER_history.md       76차 이력 추가 필요

[레이어 2 읽기 전용]
docs/SOURCE_TERMS.md                   74차
docs/SOURCE_KEYMAP.md                  75차

[레이어 3]
docs/STATUS_POLICY.md                  75차
docs/TERM_POLICY.md                    74차

[레이어 4]
docs/SPEC_KPI.md                       74차
docs/SPEC_FEED.md                      76차 (검증 참조 줄 추가)
docs/SPEC_ISSUE.md                     76차 (검증 참조 줄 추가)
docs/SPEC_CLAIM.md                     76차 (검증 참조 줄 추가)

[코드 ts]
src/components/dashboard/DashboardHeader.tsx   76차 (지점 선택 왼쪽 아이콘 교체)
src/components/dashboard/RoomGroupSelector.tsx 76차 (카운팅 UI·적용 버튼 제거)
src/components/dashboard/WidgetSelector.tsx    76차 (KPI 하위 개별 선택 제거)
src/components/notice/NoticeBanner.tsx         76차 (자동 루프 제거)
src/components/dashboard/KpiCards.tsx          73차
src/mocks/claims.json                          73차
src/mocks/feed.json, issues.json               69차
src/types/dashboard.ts                         68차

[코드 phase]
src/components/dashboard/DashboardHeader.tsx   76차 (동일 교체)
src/components/dashboard/RoomGroupSelector.tsx 76차
src/components/dashboard/WidgetSelector.tsx    76차
src/app/(dashboard)/home/page.tsx              76차 (공지 전체 제거)
docs/ (8종)                                    76차 신규 복사

---

## 프로젝트 기본 정보

로컬 전체버전: /Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts
로컬 배포버전: /Users/grey/Desktop/local_grey/web/react/prototype_dashboard_phase
포트: 전체 9004 / 배포 9006
Vercel 전체: prototype-dashboard-ten.vercel.app (.vercel/ 없음 vercel link 필요)
Vercel 배포: prototype-dashboard-phase.vercel.app (연결됨 로그인 실패 미해결)
실 서비스: https://indicator-dev.vercel.app
filesystem MCP 허용: /Users/grey/Desktop/local_grey, /Users/grey/Downloads
bash 사용 불가 (컨테이너 환경)
