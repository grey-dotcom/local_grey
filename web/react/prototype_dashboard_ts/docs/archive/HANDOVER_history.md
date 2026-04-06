# HANDOVER 세션 이력
> 목적: 세션별 완료 사항·정책 변경·미결 이력 누적 보관
> 가드레일: 추가만 가능. 삭제·수정 금지. 300줄 초과 시 HANDOVER_history_2.md로 분리.
> 참조: /HANDOVER.md (현행), /HANDOVER_BASE.md (기준 지시)

---

## 74차 완료 (2026-04-03)

완료
- 실 서비스 화면 탐색: 홈 대시보드 + 관제 일감/이슈 현황
- CSV 수령: 11c-server-ko.csv(BE), admin_lokalise.csv(FE)
- 문서 체계 레이어 구조 설계 및 전체 실행
  - CLAUDE.md 신규 (레이어 0)
  - HANDOVER_BASE.md 신규 / HANDOVER.md 축소 (레이어 1)
  - SOURCE_TERMS.md / SOURCE_KEYMAP.md 신규 (레이어 2, 읽기 전용)
  - TERM_POLICY.md 신규 (레이어 3)
  - archive/ 폴더 + HANDOVER_history.md / VALIDATION_LOG.md / POLICY_history.md 신규 (레이어 5)
- SPEC_KPI.md 헤더 검증 참조 줄 추가
- HANDOVER_BASE.md 기획서 작성 기준에 SOURCE_TERMS.md read 의무 추가

미결 이월
- SPEC_FEED / SPEC_ISSUE / SPEC_CLAIM 헤더 검증 참조 줄 추가 미완료
- SPEC_REALSERVICE_TERMS.md 삭제 미완료
- STATUS_POLICY.md 줄 수 초과 여부 확인 및 분리 계획 수립 필요
- SOURCE_KEYMAP.md CSV 전체 매핑 미완료
- POLICY.md(89KB) 분리 — 별도 세션
- 기획서 이어 작성 (상단 바 / 지점 탭 / 위젯 설정 / 실시간 관리지표)
- git commit/push (72·73·74차)
- IssueWidget / ClaimWidget Phase 3 구현

---

## 74차 초반 (2026-04-03)

완료
- HANDOVER.md 구조 보강: 기획서·정책서 구분 명시 / 출력 형식 확정 / 검증 절차 강화
- 74차 인수인계 누락 사고 기록 추가 (파일 직접 read 의무화)

---

## 73차 (2026-04-03)

완료
- 클레임 처리 흐름 2안 확정: 고객사 등록 → 파트너사 인정/이의제기 → 종결
- DISPUTED(이의제기) 종결 상태 재정의. 미확인 클레임 제외. 달성률 분자 포함.
- KpiCards.tsx, SPEC_KPI.md, STATUS_POLICY.md, SPEC_CLAIM.md, claims.json 73차 업데이트

KPI 확정 수치 (현재 코드 기준 정답)
- 업무현황 17건 / 미해결 이슈 6건 / 미확인 클레임 3건 / 달성률 15/42건(36%)

---

## 72차 (2026-04-03)

완료
- KpiCards.tsx holdCount 이중집계 제거 (분모 44→42건)
- KpiCards.tsx polling 구조 추가 (mock 30초 / 실운영 60초)
- STATUS_POLICY.md 전면 재작성
- 화면 수치 검증 완료

---

## 71차

완료: SPEC_FEED.md / SPEC_ISSUE.md / SPEC_CLAIM.md 기획서 신규 작성

---

## 69차

완료: KPI 정책 검증·수정 / KpiCards.tsx 전면 교체 / SPEC_KPI.md 초안

---

## 68차

완료: 상태값 전면 교체 / 클레임 4종 확장 / 지점 10개 제한 / ClaimWidget 정렬

---

## 65차 (사고 기록)

사고: POLICY.md write_file 2줄만 담아 호출 → 파일 전체 초기화
규칙: POLICY.md 수정 시 전체 read → 변경분 포함 write_file

---

## 63차 (사고 기록)

사고: deploy/phase1 브랜치 작업 중 dev 브랜치 파일 직접 수정
결과: FeedWidget/IssueWidget/ClaimWidget 화면에서 사라짐 → 복구 완료
규칙: 배포 작업은 prototype_dashboard_phase 폴더에서만 진행
