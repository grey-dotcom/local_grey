# STATUS_POLICY 이력 아카이브
> 목적: STATUS_POLICY.md에서 이관된 완료 이력·교체 기록 보관
> 가드레일: 추가만 가능. 삭제·수정 금지. 300줄 초과 시 번호 붙여 분리.
> 참조: docs/STATUS_POLICY.md (현행 정책)
> 이관일: 2026-04-03 (75차)

---

## §9. 개발자 피드백 대응 기록 (68차 완료)

> 개발자: "BEFORE_START 등 이런 상태값은 없어요. 이슈 상태에 대기도 없습니다. 클레임 상태도 2종이 아니다."

이 피드백은 67·68차 작업 이전 코드 기준입니다. 현재 코드는 BE 원본 키로 전환 완료됐습니다.

| 피드백 항목 | 이전(as-is) | 현재(to-be, 68차 완료) |
|---|---|---|
| BEFORE_START 상태값 | 코드에 존재 | RESERVED로 교체 완료 |
| 이슈 대기(PENDING) 상태 | 코드에 존재 | 제거 완료 |
| 클레임 상태 2종 | PENDING·COMPLETED 2종 | 4종으로 확장 (BE 키 미확정 포함) |
| IN_PROGRESS | 코드에 존재 | STARTED로 교체 완료 |
| ON_HOLD | 코드에 존재 | HOLD로 교체 완료 |
| CANCELLED | 코드에 존재 | CANCELED로 교체 완료 |

---

## §11. 코드 교체 완료 목록 (75차 기준)

| 파일 | 상태 |
|---|---|
| `src/types/dashboard.ts` | 68차 — TicketStatus 6개 키 교체, IssueStatus named type 신규 |
| `src/mocks/feed.json` | 69차 — ticketStatus 교체 + completedAt 추가 |
| `src/mocks/issues.json` | 69차 — issueStatus 교체 + completedAt 추가 |
| `src/mocks/claims.json` | 73차 — 2안 기준 정책 주석 수정 / DISPUTED 종결 상태 재정의 / 미확인 3건으로 수정 |
| `src/components/dashboard/FeedCard.tsx` | 68차 — 전체 상태값 참조 교체 |
| `src/components/dashboard/IssueCard.tsx` | 68차 — 2단계 버튼 플로우 재정의 |
| `src/components/dashboard/FeedWidget.tsx` | 68차 — 필터 탭·상태 배열 교체 |
| `src/components/dashboard/IssueWidget.tsx` | 68차 — 필터 탭 키 교체 |
| `src/components/dashboard/KpiCards.tsx` | 73차 — 미확인 클레임 PENDING만 / 달성률 분자 DISPUTED 추가 / 파일 헤더 주석 현행화 |
| `src/app/(dashboard)/home/page.tsx` | 69차 확인 — 교체 대상 없음 |

> 신규 교체 완료 사항은 이 파일에 날짜·차수와 함께 추가한다.
