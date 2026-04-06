# 정책 변경 이력
> 목적: 세션별 정책 변경사항 누적 보관
> 가드레일: 추가만 가능. 삭제·수정 금지. 300줄 초과 시 POLICY_history_2.md로 분리.
> 참조: docs/STATUS_POLICY.md (현행 정책)

---

## 74차 (2026-04-03)

신규 파일 생성
- docs/TERM_POLICY.md: 용어 정의 정책서 신규 작성
- docs/SOURCE_TERMS.md: 실 서비스 화면 용어 원문 (레이어 2, 읽기 전용)
- docs/SOURCE_KEYMAP.md: BE/FE 키 매핑표 (레이어 2, 읽기 전용)

문서 체계 변경
- CLAUDE.md 신규: 디폴트 컨텍스트·파일 라우팅 규칙
- HANDOVER_BASE.md 신규: 필수 지시·가드레일·역할·절차 (기존 HANDOVER.md에서 분리)
- HANDOVER.md 축소: 463줄 → 150줄 (세션 현황만 유지)
- docs/archive/ 폴더 신규 생성

---

## 73차 (2026-04-03)

STATUS_POLICY.md 변경
- §5-0: 클레임 처리 흐름 2안 신규 추가
- §6-3: 미확인 클레임 PENDING + DISPUTED → PENDING만으로 수정 (3건)
- §6-5: 달성률 분자 클레임 완료에 DISPUTED 추가
- §7: DISPUTED 한글 표시 "이의제기 진행중" → "이의제기(종결)" 수정
- §11: KpiCards.tsx 수정 완료 상태로 갱신

SPEC_CLAIM.md 변경
- §0: 클레임 처리 흐름 신규 추가
- 시나리오C: 이의제기 = 종결로 수정
- 색상바: DISPUTED 빨간색 → 회색으로 수정

---

## 72차 (2026-04-03)

STATUS_POLICY.md 변경
- §4-0: 이슈와 보류의 관계 정의 신규 추가
- §6-4: 달성률 분모 42건 확정 (44→42, holdCount 이중집계 제거)
- §6-7: 지점 최대 조회 수 10개 정책 추가
- §6-8: KPI 갱신 주기 정책 추가 (mock 30초 / 실운영 60초)

---

## 71차

STATUS_POLICY.md §6 전면 교체: KPI 집계 정책 69차 수정분 반영
POLICY.md §15 업데이트: KPI 확정 수치 반영

---

## 69차

KpiCards.tsx 반영 정책 변경
- 업무현황 집계 조건 전면 교체
- 달성률 분모·분자 산식 전면 교체

---

## 68차

상태값 전면 교체 (BE 원본 키로)
- TicketStatus: UNASSIGNED→PENDING, BEFORE_START→RESERVED, IN_PROGRESS→STARTED, COMPLETED→RESOLVED, ON_HOLD→HOLD, CANCELLED→CANCELED
- IssueStatus: RECEIVED→REPORTED, CONFIRMED+COMPLETED→RESOLVED, ON_HOLD→HOLD
- ClaimStatus 4종 확장: PENDING / ACCEPTED / DISPUTED / DISPUTE_COMPLETED
