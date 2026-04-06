# KEEPER 대시보드 프로토타입 — Claude 디폴트 컨텍스트
> 이 파일은 Claude Code가 프로젝트를 열 때 자동으로 읽는다.
> 수정 권한: grey님만. Claude가 임의 수정 금지.

---

## 프로젝트 개요

실 서비스 운영 대시보드(KEEPER)의 프로토타입. Next.js 기반 웹 앱.
포트: 9004 | API Base: https://indicator.11h.kr
실 서비스: https://indicator-dev.vercel.app

---

## 파일 라우팅 규칙

세션 시작 시 반드시 읽을 파일
- HANDOVER.md — 직전 세션 변경사항·다음 할 일
- HANDOVER_BASE.md — 필수 지시사항·가드레일·역할 정의

상황별 추가로 읽을 파일 (필요한 것만 선택)

기획서 작성 시 (PM-SPEC 에이전트)
- docs/SOURCE_TERMS.md (실 서비스 용어 원문 — 검증 기준)
- docs/SOURCE_KEYMAP.md (BE/FE 키 매핑표)
- 해당 SPEC_*.md (작성 대상 기획서)

기능명세서 작성 시 (DEV-SPEC 에이전트)
- 해당 SPEC_*.md (변환 원본)
- docs/STATUS_POLICY.md (상태값·정책 기준)
- docs/SOURCE_KEYMAP.md (BE/FE 키 매핑표)

정책 확인·수정 시
- docs/STATUS_POLICY.md (상태값·집계 기준)

코드 작업 시
- docs/STATUS_POLICY.md (상태값 기준)
- 해당 컴포넌트 파일

이력·검증 확인 시
- docs/archive/HANDOVER_history.md
- docs/archive/VALIDATION_LOG.md

아카이브 참조 규칙
- 코드 교체 이력 확인 필요 시: docs/archive/STATUS_POLICY_history.md
- 정책 변경 이력 확인 필요 시: docs/archive/POLICY_history.md
- 세션 완료 이력 확인 필요 시: docs/archive/HANDOVER_history.md
- 아카이브는 현행 판단에 필요한 경우에만 참조. 기본 작업에서는 원본 파일로 충분.

---

## 절대 규칙 (위반 시 즉시 중단)

1. keeper-admin.com — CRUD 원천 금지. 읽기 전용.
2. prototype_dashboard_ts (dev 브랜치) — 배포 목적 수정 금지.
3. HANDOVER_BASE.md — grey님 승인 없이 수정 금지.
4. POLICY.md — write_file 전체 교체 방식 강제. 부분 수정 시 초기화 위험.
5. 파일 변경 완료 확인 — 반드시 직접 read로 검증. 선언만으로 완료 처리 불가.

---

## 세션당 읽는 파일 수 제한

권장: 세션당 최대 3개 파일 읽기.
필수 2개 (HANDOVER.md + HANDOVER_BASE.md) + 작업 관련 1개.
파일을 많이 읽을수록 컨텍스트 소모가 증가하여 실제 작업 여력이 줄어든다.
