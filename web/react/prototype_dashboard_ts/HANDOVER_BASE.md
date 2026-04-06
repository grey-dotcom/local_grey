# HANDOVER_BASE — 기준 지시사항
> 목적: grey님의 필수 지시·가드레일·역할·절차 정의. 변하지 않는 원칙.
> 수정 권한: grey님만. Claude가 임의 수정 금지.
> 참조: CLAUDE.md (파일 라우팅), HANDOVER.md (세션 현황)

---

## 역할 정의

PM: 사용자 경험·서비스 흐름 관점 검토. 개발 전문 용어 없이 작성.
FE: 화면 구현 관점. 정책-코드 일치 여부·구현 가능 여부 검토.
BE: mock 데이터·정책 주석·상태값 수치 정합성 검토.
클로드: 역할 간 교차 검증, 파일 간 불일치 발견, 수정 실행.

### 기획서 작성 에이전트 (PM-SPEC)
호출: "기획서 작성 에이전트로 전환해"
목적: 실 서비스 용어 기준으로 운영자 관점의 UI 기획서 작성.
시작 전 필수 read: docs/SOURCE_TERMS.md + 대상 SPEC_*.md (이어쓰기 시)
출력: 채팅창 직접 출력. 파일 저장 불가. 섹션 완료마다 멈추고 확인.
금지: 개발 전문 용어 / 영문 상태값 단독 사용 / mock 데이터 내용 포함.
자가 검증 (출력 전):
1. SOURCE_TERMS.md를 직접 read했는가
2. 개발 전문 용어·영문 상태값 단독 사용이 없는가
3. 실 서비스 화면 용어와 불일치하는 표현이 없는가
4. mock 데이터 내용이 포함되지 않았는가
5. 다음 섹션 진행 전 grey님 확인을 요청했는가

### 기능명세서 에이전트 (DEV-SPEC)
호출: "기능명세서 에이전트로 전환해"
목적: 기획서(SPEC_*.md)를 개발자가 바로 구현할 수 있는 기술 명세로 변환.
시작 전 필수 read: 대상 SPEC_*.md + docs/STATUS_POLICY.md + docs/SOURCE_KEYMAP.md
출력: 채팅창 직접 출력. 코드블록 사용 가능. 섹션 완료마다 멈추고 확인.
출력 항목: API 엔드포인트·파라미터 / 상태값 필터 조건(영문 키) / 컴포넌트 props / 엣지케이스 / 미확정 항목.
금지: 기획서에 없는 내용 추론 / UI 디자인 판단. 미확정 항목은 반드시 명시.
자가 검증 (출력 전):
1. 대상 SPEC_*.md를 직접 read했는가
2. STATUS_POLICY.md 상태값 기준과 일치하는가
3. SOURCE_KEYMAP.md 키 매핑과 일치하는가
4. 기획서에 없는 내용을 추론하지 않았는가
5. 미확정 항목이 명시되어 있는가

---

## 기획서·정책서 구분

기획서 (docs/SPEC_*.md): 사용자 경험·화면 흐름·시나리오 중심. 실제 개발자 전달용.
정책서 (docs/STATUS_POLICY.md, docs/POLICY.md): 상태값·집계 기준·기술 정책 정의.
원천 데이터 (docs/SOURCE_*.md): 실 서비스 확인 사실 원문. 읽기 전용. 해석 금지.

정책 변경 시 기획서와 정책서 모두 파일 직접 read로 반영 여부 확인.

---

## 기획서 작성 기준

- 개발 전문 용어 금지 (코딩 용어, 영문 상태값 단독 사용, 색상 코드값 등)
- 영문 상태값은 한글 병기 필수: DISPUTED(이의제기), HOLD(보류)
- mock 데이터 내용 기획서에서 제외. 실 서비스 기준으로 작성.
- 실제 개발자에게 전달 가능한 수준으로 작성.
- 실 서비스 화면 한글 용어 기준. docs/SOURCE_TERMS.md 참조.
- **기획서 작성 시작 전 반드시 docs/SOURCE_TERMS.md를 직접 read한 뒤 시작한다. read 없이 작성 착수 불가.**

기획서 출력 형식
- 채팅창에 바로 출력. 별도 파일 저장 불가.
- 표 사용 가능. 특수문자·이모티콘 사용 금지.
- 항목:설명 1:1 구조는 계층형 문장으로 작성.

---

## 인수인계 4단계 절차 (세션 종료 시 필수)

1단계 — 역할별 완료 항목 검증
- FE: 변경된 코드 파일 직접 read → 로직 오류·정책 불일치 확인
- BE: 변경된 mock 파일 직접 read → 정책 주석·수치·상태값 일치 확인
- PM: 변경된 기획서·정책서 직접 read → 기획 의도 불일치·미결 항목 확인
- 파일 직접 read 없는 확인 불인정. 선언만으로 통과 불가.

2단계 — 클로드-역할 교차 검증
- 코드 ↔ 정책서 ↔ 기획서 ↔ HANDOVER 일관성 대조
- 이슈 발견 시 수정 후 재검증

3단계 — 클로드 전체 수정
- 1·2단계 불일치 파일별 수정
- 수정 후 핵심 항목 재확인

4단계 — 다음 세션 프롬프트 갱신
- HANDOVER.md 세션 프롬프트 갱신
- 포함 항목: 핵심 변경 요약 / 읽을 문서 / 할 일 / 미결 / 작업 기준·출력 형식·다음 시작점
- HANDOVER_history.md에 이번 세션 완료·미결 추가

---

## 가드레일

파일별 줄 수 제한
- CLAUDE.md: 100줄 이하
- HANDOVER_BASE.md: 200줄 이하
- HANDOVER.md: 300줄 이하
- SOURCE_*.md: 200줄 이하 (SOURCE_KEYMAP.md 제외 — 원천 데이터 전체 저장 목적)
- SPEC_*.md: 300줄 이하
- STATUS_POLICY.md: 300줄 이하 (현재 초과 중 — 별도 세션에서 분리 예정)
- archive/*.md: 300줄 이하 (초과 시 번호 붙여 분리)

초과 시 조치: 내용 삭제 금지. archive로 이동 또는 파일 분리.
아카이브 이관 원칙: 현행 정책 판단에 필요한 섹션은 원본 유지. 완료된 이력·교체 기록만 이관.

원천 데이터 파일 (SOURCE_*.md)
- 추론·해석·정책 판단 기록 금지
- 실 서비스 화면 확인·CSV 기준 사실만 기록
- 수정 대신 버전 날짜 추가

검증 체크리스트 (역할별 최대 5개)
FE 체크리스트
1. 변경된 코드 파일을 직접 read했는가
2. 상태값이 STATUS_POLICY.md 기준과 일치하는가
3. SOURCE_TERMS.md의 화면 용어와 일치하는가
4. 구현 불가능한 정책이 포함되어 있는가
5. HANDOVER 파일 상태 표가 최신인가

BE 체크리스트
1. 변경된 mock 파일을 직접 read했는가
2. _policy 주석이 STATUS_POLICY.md와 일치하는가
3. 상태값 수치가 KPI 확정 수치와 일치하는가
4. completedAt 필드 정책이 반영되어 있는가
5. HANDOVER 파일 상태 표가 최신인가

PM 체크리스트
1. 변경된 기획서를 직접 read했는가
2. 개발 전문 용어가 사용되지 않았는가
3. SOURCE_TERMS.md 용어와 불일치하는 표현이 없는가
4. 미결 항목이 완료로 잘못 기재되지 않았는가
5. 다음 세션 시작점이 HANDOVER에 명시되어 있는가

---

## 현재 확정 정책 핵심 (73차 기준)

클레임 처리 흐름 2안: 고객사 등록(PENDING) → 파트너사 인정(ACCEPTED) 또는 이의제기(DISPUTED) → 종결
DISPUTED(이의제기): 종결 상태. 미확인 클레임 제외. 달성률 분자 포함.
KPI 확정 수치: 업무현황 17건 / 미해결 이슈 6건 / 미확인 클레임 3건 / 달성률 15/42건(36%)
로컬 저장 항목: 위젯 설정(ON/OFF) + 지점 선택 필터 ID 목록만

---

## Claude Code 역할 제약

작업 가능: src/components/dashboard/IssueWidget.tsx, ClaimWidget.tsx, 하위 신규 파일
절대 수정 금지: HANDOVER*.md / CLAUDE.md / HANDOVER_BASE.md / docs/POLICY.md
절대 수정 금지: FeedCard.tsx / FeedWidget.tsx / KpiCards.tsx / DashboardHeader.tsx
절대 수정 금지: RoomGroupSelector.tsx / RoomGroupBottomSheet.tsx
절대 수정 금지: src/stores/ 전체 / src/utils/ 전체 / src/types/dashboard.ts

Claude Desktop 추가 권한 (67차~)
- src/types/dashboard.ts — 상태값 교체 한정
- src/mocks/*.json — mock 데이터 수정 허용
- src/components/dashboard/KpiCards.tsx — KPI 집계 로직 한정

---

## 문서 배포 프로토콜 (76차 확정)

### 로컬 배포버전(prototype_dashboard_phase) 포함 문서
배포 대상: docs/ 아래 8개 파일만 복사. 나머지는 절대 포함 금지.

포함 (8종):
- MOCK_GUIDE.md      — BE 개발자 연동 안내
- SPEC_KPI.md        — KPI 위젯 기획서
- SPEC_FEED.md       — 피드 위젯 기획서 (KPI 집계 근거)
- SPEC_ISSUE.md      — 이슈 위젯 기획서 (KPI 집계 근거)
- SPEC_CLAIM.md      — 클레임 위젯 기획서 (KPI 집계 근거)
- SPEC_AUTH.md       — 인증·인가 기능 명세
- STATUS_POLICY.md   — 상태값 정의 (BE 연동 시 키 교체 기준)
- TERM_POLICY.md     — 용어 정의

제외 (절대 배포 금지):
- POLICY.md          — 89KB 내부 관리용 정책서 원본
- SOURCE_TERMS.md    — 내부 기획 탐색 원문
- SOURCE_KEYMAP.md   — 38KB 내부 CSV 키 매핑
- HANDOVER.md        — 세션 인수인계 내부 문서
- HANDOVER_BASE.md   — 세션 인수인계 내부 문서
- CLAUDE.md          — Claude 전용 라우팅 파일
- docs/archive/ 전체 — 이력 아카이브

### 적용 규칙
- git 커밋 전 로컬 배포버전 docs/ 파일 목록 반드시 확인
- 위 8종 외 파일이 prototype_dashboard_phase/docs/에 존재하면 즉시 제거
- sync 스크립트 수정 시 이 목록 기준으로 필터링 로직 검토
- mock JSON은 두 프로젝트 동일 유지. 내용 변경 시 양쪽 동시 반영.
