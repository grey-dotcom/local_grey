# 🔄 prototype_dashboard_ts — 인수인계 문서
> 작성일: 2026-03-19 | **최종 업데이트: 2026-03-27 (63차 완료)** | 다음 세션에서 이 문서를 먼저 읽고 시작할 것
> **정책 상세**: `docs/POLICY.md` + `docs/POLICY_notice.md` 참고

---

## 🚨 [63차 사고 기록 — 모든 세션 최우선 필독]

> **이 섹션은 삭제하거나 아래로 내리지 말 것. 모든 세션의 첫 번째 확인 항목.**

### 사고 내용
63차 세션에서 Claude가 `deploy/phase1` 브랜치 작업 중 **브랜치를 먼저 만들기 전에 `dev` 브랜치의 파일을 직접 수정**했습니다.
- 수정 대상: `WidgetSelector.tsx` (feed/issue/claim 기본값 false 처리), `page.tsx` (위젯 import 제거)
- 결과: `dev` 브랜치의 FeedWidget/IssueWidget/ClaimWidget이 화면에서 사라짐
- 복구: grey님이 반복적으로 확인 질문을 해주신 덕분에 발견 및 복구 성공
- **grey님이 확인 질문을 하지 않았다면 `dev` 브랜치 개발물이 그대로 망가졌을 것**

### 근본 원인
git 브랜치를 만들기 **전에** 워킹 디렉토리 파일을 수정하면, 브랜치 생성 후에도 수정된 파일이 두 브랜치에 공유됩니다. Claude가 이 순서를 지키지 않았습니다.

### 확정된 해결 구조 (63차)
- **개발:** `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts` (`dev` 브랜치) — 절대 건드리지 않음
- **배포:** `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_phase` — 별도 물리 폴더로 완전 분리
- `prototype_dashboard_ts`에서 선택된 파일만 `prototype_dashboard_phase`로 복사하는 스크립트 별도 마련

### Claude Code / Claude Desktop 모든 세션 준수 규칙
1. `prototype_dashboard_ts` (`dev` 브랜치) 파일은 **배포 목적으로 절대 수정하지 않는다**
2. 배포 관련 작업은 반드시 `prototype_dashboard_phase` 폴더에서만 진행한다
3. 브랜치 작업 전 반드시 `git branch` 로 현재 브랜치를 확인한다
4. 파일 수정 전 반드시 어느 브랜치/폴더에서 작업하는지 grey님에게 명시한다

---

---

## 🚀 NEW SESSION QUICK START (매 세션 최우선 확인)

> 이 섹션만 읽으면 새 세션 즉시 작업 가능. 아래 순서대로 실행할 것.

### ⚠️ Step 0 — 컨텍스트 상태 확인 (매 턴 별도 체크)

| 상태 | 기준 | 행동 |
|---|---|---|
| 🟢 정상 | 70% 미만 | 작업 계속 |
| 🟡 주의 | 70~85% | 현재 작업 마무리 후 HANDOVER 업데이트 준비 |
| 🔴 위험 | 85% 이상 | **즉시 중단 → HANDOVER 업데이트 → 새 세션 시작** |

> Claude는 컨텍스트 사용량을 매 응답에서 스스로 추정할 것.
> 70% 초과 시: "컨텍스트 약 N% 수준입니다. 현재 작업 완료 후 새 세션을 권장합니다." 알림.
> 85% 초과 시: 작업 시작 전 반드시 경고 후 HANDOVER 업데이트하고 중단.

### ⚠️ Step 0-2 — 컨텍스트 압축·세션 이동 시 절대 손실 금지 규칙 (모든 세션 불변)

> **이 규칙은 컨텍스트 압축, 세션 종료, 새 세션 시작 모든 상황에 동일하게 적용됩니다.**
> 과거 세션에서 D 시리즈·W 시리즈 작업 항목, 역할별 논의 루프 결과가 압축 시 소실된 사례가 있었음 (45~46차 교훈).

**절대 손실 금지 항목 (압축 시 반드시 보존):**

| 항목 | 보존 위치 | 손실 시 영향 |
|---|---|---|
| 작업 시리즈 항목 (W-N, D-N 등) | HANDOVER Step 3 또는 즉시 작업 섹션 | 다음 세션이 작업 목록을 모름 |
| 역할별 논의 루프 결과 (FE/디자인/PM 합의) | HANDOVER 완료 섹션 + POLICY.md | 합의 내용 재논의 낭비 |
| 미확정·재루프 대상 항목 | HANDOVER 미결 이슈 표 | 미결 항목 누락으로 정책 공백 |
| 코드 변경 사유·차수 | 코드 주석 + HANDOVER | 다음 세션이 변경 맥락을 모름 |
| POLICY.md 확정 정책 | docs/POLICY.md | 정책 공백 → 임의 구현 위험 |

**압축 시 체크리스트 (압축 전 반드시 확인):**
- [ ] 진행 중인 W-N, D-N 시리즈 항목이 HANDOVER Step 3에 전부 있는가?
- [ ] 역할별 논의 루프(FE/디자인/PM)가 있었다면 결과가 POLICY.md 또는 완료 섹션에 기록됐는가?
- [ ] 미결·재루프 대상 항목이 미결 이슈 표에 있는가?
- [ ] 이번 세션에서 확정된 정책이 POLICY.md에 반영됐는가?
- [ ] 다음 세션 첫 번째 작업이 Step 2 표에 명확히 적혀 있는가?

**변경 발생 시 즉시 반영 원칙:**
> 코드 변경, 정책 변경, 사용자 환경 변경(BP, 레이아웃, API 등) 발생 시
> **작업 완료 즉시** HANDOVER + POLICY.md 업데이트를 최우선으로 수행.
> 세션 종료 시까지 미루지 않는다.

---

### ⚠️ Step 0-1 — HANDOVER 업데이트 필수 항목 (세션 종료 또는 75% 도달 시)

아래 항목을 **빠짐없이** edit_file로 업데이트할 것. write_file 전체 덮어쓰기 금지.

| 항목 | 위치 | 내용 |
|---|---|---|
| 세션 차수 | Step 2 제목 | `(N차 기준)` 업데이트 |
| 진행 Phase | Step 2 표 | 현재 상태 한 줄 요약 |
| 완료된 것 | Step 2 표 | 이번 세션 완료 항목 |
| 다음 할 일 | Step 2 표 | 다음 세션 첫 번째 작업 |
| 우선순위 표 | Step 3 | 완료 항목 제거, 순위 재정렬 |
| 완료 기준 | Step 3 하단 | 변경사항 피드 완료 조건 갱신 |
| 완료 섹션 | `✅ N차 완료 사항` | 이번 세션 완료 내역으로 교체 |
| 미결 이슈 | `⚠️ 미결 이슈` 표 | 완료된 항목 ✅ 처리, 신규 이슈 추가 |
| POLICY.md | 해당 섹션 | 이번 세션에서 확정된 정책 반영 |

> **확인 체크리스트** — 업데이트 후 스스로 검토:
> - [ ] Step 2 차수·맥락 갱신됐는가?
> - [ ] Step 3 우선순위가 현재 상태와 일치하는가?
> - [ ] 완료 섹션이 이번 세션 기준으로 교체됐는가?
> - [ ] POLICY.md에 확정된 정책이 반영됐는가?
> - [ ] 미결 이슈 표가 최신 상태인가?

### ⚠️ Step 0-3 — Claude Code 전용 역할 제약 (Claude Code 세션에만 적용)

> **Claude Code로 작업 시작 시 이 섹션을 Step 0보다 먼저 읽을 것.**
> Claude Desktop(메인)과 Claude Code(서브)의 역할은 엄격히 분리됩니다.

**Claude Code 작업 가능 파일:**
- `src/components/dashboard/IssueWidget.tsx`
- `src/components/dashboard/ClaimWidget.tsx`
- `src/components/dashboard/` 하위 신규 파일 생성 (IssueCard, ClaimCard 등)

**Claude Code 절대 수정 금지 파일:**
```
HANDOVER.md / docs/POLICY.md / docs/POLICY_notice.md
FeedCard.tsx / FeedWidget.tsx / KpiCards.tsx
DashboardHeader.tsx / RoomGroupSelector.tsx / RoomGroupBottomSheet.tsx
src/stores/ 전체 / src/utils/ 전체
```

**미결 이슈 표 주의사항:**
> 아래 섹션의 `⚠️ 미결 이슈` 표에 있는 🔴 항목은 **BE/PM/디자인 응답 대기 중**인 항목입니다.
> Claude Code가 정책 판단 없이 임의로 구현하는 것은 금지입니다.
> 미결 항목은 grey님이 직접 확인 후 다음 작업 지시를 받아 처리합니다.

**역할 관계:**
| 방향 | 허용 여부 |
|---|---|
| Claude Code → Claude Desktop 작업물 수정 | **금지** |
| Claude Desktop → Claude Code 작업물 수정 | **허용** |

---

### Step 1 — HANDOVER 정본 경로 확인 (최우선)

> 세션 시작 시 **반드시 이 경로**로 HANDOVER를 읽을 것. 다른 경로의 HANDOVER는 구버전이므로 무시.

```
/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/HANDOVER.md
```

- `/Users/grey/Downloads/HANDOVER.md` → 9차 구버전, 히스토리 전용. 절대 정본으로 사용 금지
- 업로드된 파일(`/mnt/user-data/uploads/`)로 전달된 HANDOVER도 참고용일 뿐 — 반드시 위 정본 경로를 filesystem MCP로 직접 읽어 최신 상태 확인

### Step 1-1 — 서버 확인
```bash
npm run dev   # 포트 9004
```

### Step 2 — 현재 작업 맥락 (62차 기준)

| 항목 | 내용 |
|---|---|
| **진행 Phase** | Phase 3 — 62차 전체 완료. 브라우저 검증 grey님 진행 중. 다음 세션은 FeedCard 버그 B·C + IssueWidget/ClaimWidget Phase 3 구현. |
| **완료된 것** | ✅ 62차 배지 중첩 버그 수정(FeedCard/IssueCard flexWrap:'wrap') / ✅ NORMAL dueAt 동적 계산(_normalOffsetMin, FeedWidget+KpiCards 동시 적용) / ✅ KpiCards 웹 2열 2×2 그리드(PM 정책) / ✅ POLICY.md §12-5 wrap 갱신, §15-1·3·4 확정 수치(17/8/3건), §14-4 BP 배치 / ✅ HANDOVER Step 6-B 카드 변경 금지 원칙 추가 |
| **다음 할 일** | **① FeedCard 버그 B** — 완료 카드 feedbackText 박스 디자인 (SVG 8·9 전달 필요) / **② FeedCard 버그 C** — UI 깨짐 재현 케이스 확인 / **③ IssueWidget Phase 3 카드 구현** |

### Step 3 — 다음 작업 우선순위

| 순위 | 작업 | 조건 | 파일 |
|---|---|---|---|
| ✅ | ~~브레이크포인트 전환 버그 수정~~ | 40차 완료 | `page.tsx` |
| ✅ | ~~**대안 2 코드 구현**~~ | 42차 완료 | `layout.tsx` / `page.tsx` |
| ✅ | ~~**FeedCard.tsx 렌더링 마무리**~~ | 46차 완료 | `FeedCard.tsx` |
| ✅ | ~~**POLICY.md §12-7 알림박스 정책 섹션 추가**~~ | 46차 완료 | `docs/POLICY.md` |
| ✅ | ~~**SVG 6~9 순서대로 분석**~~ | 52차 완료 | 정책 문서 |
| ✅ | ~~**버그 수정: ASSIGNED/BEFORE_START 긴급 변경 버튼 누락**~~ | 55차 완료 — `getCardActions` TASK 분기 추가 | `FeedCard.tsx` |
| ✅ | ~~**취소/보류 feedbackText 중복 노출**~~ | 56차 완료 — `alertText` isCancelled 분기 제거 | `FeedCard.tsx` |
| 🟡 2 | **FeedCard 버그 B** | 완료 카드 feedbackText 박스 — SVG 8·9 분석 후 검수 (이슈 #3은 정상 확인됨) | `FeedCard.tsx` |
| 🟡 3 | **FeedCard 버그 C** | UI 깨짐 재현 케이스 확인 | `FeedCard.tsx` |
| ✅ | ~~**브라우저 검수 루프 재개**~~ | 57차 완료 — 취소 탭 재검수 + 완료 탭 전체 검수 이상 없음 | 브라우저 |
| 🔴 5 | **IssueWidget Phase 3 카드 구현** | 변경사항 피드 완료 후 진행 | `IssueWidget.tsx` |
| 🔴 6 | **ClaimWidget Phase 3 카드 구�** | 변경사항 피드 완료 후 진행 | `ClaimWidget.tsx` |
| 🔵 7 | **mock 데이터 정책 문서화** | 정책 정리 후 다음 세션에서 진행 | `docs/POLICY.md` + `MOCK_GUIDE.md` |
| 🔴 7 | **mock 재설계 구현** | 다음 세션 첫 번째 작업 | `feed.json` + `applyTodayDueAt()` |

> **변경사항 피드 완료 기준**: 버그 수정 + 전체 탭 검수 이상 없음 확인 → IssueWidget/ClaimWidget 진행

### Step 4 — 절대 수치 표 (수정 금지 — 매 세션 첫 조회 필수)

> 이 표의 수치는 실측 기반 확정값입니다. 코드를 작성/수정할 때 이 수치를 다른 값으로 바꿀 경우 맨 아래에 근거를 명시할 것.

| 상수 | 값 | 위치 | 이유 |
|---|---|---|---|
| `MOBILE_BP` | **960px** | `page.tsx` / `layout.tsx` | 사이드바 BP 제외, 칠드런만 기준 (416×2+16+64+48=960) (41차) |
| `WEB_2COL_MIN_CHILDREN` | **848px** | `layout.tsx` | Sub 열릴 때 칠드런<848이면 Sub 자동 닫힘, 의독 기억 후 여유 생기면 자동 복원 (대안 2, 41차) |
| `SINGLE_COL_BP` | **717px** | `page.tsx` | 모바일 1열+탭 전환 (327×2+16+48=718≈717) |
| `MIN_1COL_CHILDREN` | **1,280px** | `page.tsx` | 웹 3열 최소 칠드런 (416×3+16×2=1,280) |
| `MIN_2COL_CHILDREN` | **685px** | `page.tsx` | 모바일 2열 최소 칠드런 (717−32=685) |
| `COMP_MIN_W` | **416px** | `page.tsx` | SVG 원본 역산 (1280-32)÷3 |
| `PAD_MOBILE` | **32px** | `page.tsx` | 모바일 좌우 패딩 (16×2) |
| `GAP` | **16px** | `page.tsx` | 위젯 간 간격 |
| `MAX_VISIBLE_CARDS` | **4개** | `FeedWidget.tsx` | Feed 최대 노출 카드 수 |
| `CARD_GAP` | **8px** | `FeedWidget.tsx` | 카드 간 간격 |
| `LIST_PADDING_V` | **16px** | `FeedWidget.tsx` | 카드 리스트 상하 패딩 |
| 필터탭 `flexWrap` | **`'wrap'`** | `FeedWidget.tsx` | 33차 확정 — 375px에서 2줄, 그 이상은 1줄 |
| 필터탭 `gap` | **8px** | `FeedWidget.tsx` | 33차 실측 — 컨테이너 339px 기준 1줄 보장 |
| 필터탭 비활성 `paddingBlock` | **4px** | `FeedWidget.tsx` | 33차 확정 — 터치 타겟 32px 확보 |
| 필터탭 카운트 상한 | **99+** | `FeedWidget.tsx` | 33차 확정 POLICY §12-5 |
| 상태배지 `flexWrap` | **`'wrap'`** | `FeedCard.tsx` / `IssueCard.tsx` | 62차 확정 — 배지 초과 시 두 줄 허용, 우측 영역 침범 방지 |
| FeedWidget `paddingRight` | **`paddingLeft`와 동일** (데스크탑 24px) | `FeedWidget.tsx` | 33차 SVG 원본 실측 — 우측 여백 24px |
| `needsScroll` 조건 | **`!isMobile && !isSingleColumn`** | `FeedWidget.tsx` | 1열 탭 구간 스크롤 제외 |
| FeedCard `maxWidth` | **없음 (37차 제거)** | `FeedCard.tsx` | 1열 우측 공백 해소 |
| 버튼 `flex` | **`false` (항상)** | `FeedCard.tsx` | 34차 확정 — stretch 제거, 우측정렬+content 크기 |
| 그리드 `alignItems` | **`'start'`** | `page.tsx` | 34차 확정 — 카드 수 적을 때 위젯 늘어남 방지 |
| Empty 마진 (데스크탑 2열) | **200px** 상하 | `FeedWidget.tsx` | 34차 확정 |
| Empty 마진 (모바일·1열) | **40px** 상하 | `FeedWidget.tsx` | 34차 확정 |
| 2열 레이아웃 구조 | **1행: Feed+Issue 나란히 / 2행: Claim+(4번예정)** | `page.tsx` | 40차 확정 — 이전 구현(1열:Feed+Issue세로/2열:Claim) 전부 오류였음 |
| 모바일 1열 탭 3종 | **변경사항피드 / 처리필요 / 클레임** | `page.tsx` | 34차 디자인 SVG 기준 확정 |
| FeedCard `maxWidth` | **없음** (37차 제거 완료) | `FeedCard.tsx` | 우측 122px 공백 해소 — 절대 다시 추가 금지 |
| `singleColTab` 타입 | **`'feed' \| 'issue' \| 'claim'`** | `page.tsx` | 36차 확정 — feed가 기본탭 |
| 탭 전환 조건 | **`isSingleColumn \|\| (isMobile && desktopCols===1)`** | `page.tsx` | 38차 확정 — 웹에는 절대 탭 없음 |
| 웹 1열(3개) 기준 | **`MIN_1COL_CHILDREN = 1280`** | `page.tsx` | 38차 칠드런 기준 확정 |
| 웹·모바일 2열 기준 | **`MIN_2COL_CHILDREN = 685`** | `page.tsx` | 40차 확정 — SINGLE_COL_BP(717) - PAD_MOBILE(32) = 685 |
| `SINGLE_COL_BP` | **717px (복원)** | `page.tsx` | 모바일 위젯(327px)×2 + gap(16) + pad(48) = 718 ≈ 717 — 모바일 2열 최소 vw |
| 모바일 1열+탭 구간 | **vw 375~717px** | `page.tsx` | 40차 확정 |
| 모바일 2열 구간 | **vw 718~960px** | `page.tsx` | 41차 확정 (MOBILE_BP 960으로 재조정 — 사이드바 BP 제외) |
| BP 도출 원칙 | **위젯 1개 최소 너비 기준** | `page.tsx` | 웹 416px(필터탭 1행, 카드 1행 보장) / 모바일 327px(아이폰SE 기준 줄바꿈 방지) |
| 칠드런 실측 방식 | **`<main>` DOM ResizeObserver 직접 실측** | `page.tsx` | 사이드바 열림 상태 그대로 유지 — main 실제 너비를 실측하므로 Sub 열림/닫힌 자동 반영 |
| Sub 자동 닫힘 | **있음 — 대안 2 확정 (41차)** | `layout.tsx` | Sub 열릴 때 칠드런<848이면 자동 닫힘, 의독(열림) 기억, 여유 생기면 자동 복원 |

> ⚠️ 아래 표의 모든 값은 **실측 기반 확정값**입니다. 코드 수정 시 어떤 이유로도 이 값을 임의로 바꾸지 말 것. 바꾸려면 해당 차수와 근거를 명시합니다.

### Step 5 — 세션 시작 필수 체크리스트

> 다음 두 원칙은 모든 세션에서 불변으로 적용한다.

**원칙 1 — 인수인계 시 정책-주석-HANDOVER 삼중 검토 후 진행**
- 세션 시작 시 HANDOVER(Step 4 절대수치 표) + 해당 코드 주석 + POLICY.md 필수 섹션(§ 3 반응형) 삼중 동시 확인
- 세 곳에서 서로 다른 값이 발견되면 HANDOVER Step 4 절대수치 표가 정본 — 코드와 POLICY를 수정하여 정합성 맞춰야 함

**원칙 2 — 정책의 연관 맥락 전체를 판단하여 수정**
- BP, 위젯 1개 너비, PAD, GAP, 칠드런 계산식은 서로 연동된 값
- SINGLE_COL_BP ↔ MIN_2COL_CHILDREN ↔ MOBILE_BP ↔ 위젯 최소 너비(웹/모바일) 중 하나를 바꾸면 나머지 전체 재계산 필수
- 칰다 하나만 바꾸면 된다는 접근 절대 금지

---

### Step 6-A — 레이아웃 구조 변경 금지 원칙 (44차 확정 — 모든 세션 불변)

> **아래 구조는 사용자 UX와 FE 성능을 모두 해결한 최종 확정 구조입니다. 절대 변경 금지.**

| 구조 | 파일 | 이유 |
|---|---|---|
| `<div style={{ width: sidebarOpen ? 260 : 0, overflow: 'hidden', transition: 'width 0.2s ease' }}><SubSidebar /></div>` | `layout.tsx` | SubSidebar 언마운트 없이 width 트랜지션으로 제어 — 마운트/언마운트 방식은 리플로우 2회 + 떨림 발생 |
| Sub 자동닫힘 판단: `vw` 수식 기준 (`vw < SUB_AUTO_CLOSE_VP=1,220`) | `layout.tsx` | `main` 실측 기반 판단 시 ResizeObserver 피드백 루프(떨림) 발생 |
| 단일 ResizeObserver — vw + Sub 자동닫힘 통합 | `layout.tsx` | 중복 Observer 는 상태 업데이트 중첩으로 리렌더링 폭탄 유발 |

**이 구조에 영향을 주는 작업 요청 시 클로드는 반드시 FE·PM·디자인에 의견 요청 후 진행.**
- **FE**: 사용자 사용 맥락 + FE 성능 저하 관점 의견 제시
- **PM**: 정책 부합 여부 확인
- **디자인**: UX 시각 영향 확인
- 세 역할의 의견을 모두 반영한 후 수정 진행

---

### Step 6-B — 카드 컴포넌트 변경 금지 원칙 (62차 확정 — 모든 세션 불변)

> **사용자 명시 요청: 카드 관련 BP 정책 및 스타일은 더이상의 변경 없이 확정 상태입니다.**
> **사용자가 직접 요청할 때에만 카드 컴포넌트를 수정합니다. 클로드가 자의적으로 판단하여 수정하는 것은 절대 금지입니다.**

**변경 금지 대상 파일:**

| 파일 | 금지 이유 |
|---|---|
| `FeedCard.tsx` | 카드 레이아웃·배지·버튼·색상 정책 전체 확정 완료 |
| `IssueCard.tsx` | FeedCard 패턴 이식, 동일 정책 적용 완료 |
| `ClaimCard.tsx` | (향후 구현 시 동일 규칙 적용) |

**변경이 필요하다고 판단되는 경우의 처리 절차:**
1. 사용자에게 변경 필요성과 근거를 먼저 설명
2. 사용자의 명시적 승인을 받은 후에만 수정 진행
3. 수정 시 FE·디자인·PM 역할별 루프 검토 필수
4. 수정 후 부작용 범위(인접 flex 형제, overflow, wrap 등) 반드시 확인

**재발 방지 교훈 (62차):**
- 61차에서 `overflow: hidden → visible` 수정 시 `flexWrap: 'nowrap'` 유지로 우측 시간 영역 침범 버그 발생
- 스타일 속성 1개 변경이 인접 flex 형제 전체에 영향을 줄 수 있음
- 수정 후 브라우저 zoom으로 헤더 배지 행 반드시 시각 확인

---

### Step 6-C — DOM 구조 설계 이유 (실 서비스 연동 전 리팩토링 대상)

> 현재 DOM 구조는 UX와 FE 성능을 동시에 해결한 확정 설계입니다. 임의 변경 금지.

| 구조 | 파일 | 설계 이유 | 리팩토링 시점 |
|---|---|---|---|
| Sub 사이드바 wrapper div + 항상 렌더 | `layout.tsx` | 조건부 렌더({sidebarOpen&&})는 마운트/언마운트 시 DOM 리플로우 2회 + CSS transition 불가 → 답 닫히고 다시 열리는 깨발임 (44차 해결) | 실 서비스에서도 동일 UX 요구되므로 변경 불필요 |
| Sub 자동닫힌: vw 수식 기준 | `layout.tsx` | main 실측 기반으로 sidebarOpen 바꾸면 main 너비 변화 → ResizeObserver 재발화 → 피드백 루프 트릴림 (43차 해결) | 변경 불필요 |
| 웹 3열 위젯 wrapper div | `page.tsx` | FeedWidget 등 위젯은 width:100% 고정 독립 컴포넌트 → flex-item 역할을 외부 wrapper로 분리해야 컴포넌트 재사용성 유지 | 실 서비스 연동 시 위젯에 flex prop 직접 주도록 수정 후 제거 가능 |
| 웹 2열 IssueWidget wrapper div | `page.tsx` | HANDOVER Step 3에 '4번 위젯 예정' 항목 있음 → 향후 외 컴럼 두 번째 위젯 추가 시 gap/flexDirection 역할 담당을 위해 향상 유지 | 4번 위젯 확정 후 재검토 |
| KpiCards 데이터 이중 페치 | `KpiCards.tsx` + `FeedWidget.tsx` | 프로토타입에서 각 위젯이 독립적으로 동작해야 하므로 독립 페치 의도된 설계 | 실 서비스 연동 시 dashboardStore로 일원화 후 page.tsx에서 단일 페치 + prop 전달로 교체 |

---

### Step 6-D — Vercel 배포 정리 (63차 확정)

> **배포 대상:** Vercel (프로토타입 외부 공유)
> **이유:** middleware.ts(라우트 가드) + Next.js 서버 모드 필요 → Firebase 정적 배포(output:'export') 불가

**페이즈 1 배포 체크리스트:**

```bash
# 1. next.config.ts 확인 (output:'export' 주석 상태 유지 여부)
# 2. .env 환경변수 Vercel 대시보드에 등록
#    NEXT_PUBLIC_USE_MOCK=true
#    NEXT_PUBLIC_API_BASE=https://indicator.11h.kr
# 3. GitHub 레포 연결 → Vercel 자동 배포
# 4. cam 프로젝트(prototype-web-grey Firebase)와 완전히 독립
```

**로컈 개발 vs Vercel 배포 방식 차이:**
| 항목 | 로컈(npm run dev) | Vercel 배포 |
|---|---|---|
| middleware.ts | 활성화 | 활성화 |
| output:'export' | 불필요 | 불필요 |
| 포트 | 9004 | Vercel 자동 할당 |
| cam 프로젝트 영향 | 없음 | 없음 |

---

### Step 6 — 코드 수정 금지 규칙 (수정 전 반드시 확인)

> **이전 4개 세션(32~35차)에서 수정한 내용이 37차 탭 추가 작업 시 page.tsx 재작성으로 전부 날아갔습니다.**
> 구체적으로는 `MIN_3COL_CONTAINER`, `MIN_2COL_CONTAINER`, `calcContainerWidth`, `flexWrap`, `needsScroll` 등이 값이 바뀌거나 삭제되었음.

**코드 수정 시 반드시 지켜야 할 3가지:**

1. **Step 4 절대수치 표를 먼저 확인한다** — 표에 있는 값이 코드에 없으면 마지막으로 삭제된 것. 비교 후 복원.
2. **page.tsx를 재작성할 때** — 기존 상수/함수/조건을 한 줄씩 확인하면서 복사. 새로 써도 복사, 절대 덮어쓰기 금지.
3. **주석이 코드와 다를 때** — 주석을 기준으로 코드를 좋다고 판단하지 말 것. 주석이 낡아도 코드가 맞으면 코드가 정답.

### Step 6 — 역할별 미결 합의 (코드 작업 전 반드시 확인)

| 역할 | 항목 | 우선순위 |
|---|---|---|
| 🎨 디자인 | **P4**: REPORTED/UNASSIGNED 긴급 변경 팝업 문구 확정 | 🔴 |
| 🎨 디자인 | **SVG 4** HTML/CSS 파일 전달 (`/Users/grey/Desktop/local_grey/workspace/` 저장) | 🔴 |
| 📋 PM | **Q3**: urgentCancel 팝업 확정 텍스트 | 🔴 |
| 📋 PM | **Q5**: 후속 일감 생성 링크 동작 (새 탭/라우팅/팝업) | 🔴 |
| ⚙️ BE | **B1~B13**: API 엔드포인트 전체 — 현재 모두 `console.log` 목업 | 🔴 |

### Step 5 — localStorage 리셋 (필요 시)
```js
// NEW 상태 리셋
localStorage.removeItem('feed_new_w1');
localStorage.removeItem('feed_new_w2');
// 피드 데이터 리셋
localStorage.removeItem('feed_mock_w1');
localStorage.removeItem('feed_mock_w2');
```

---

## 📌 현재 상태 요약

- **Phase 1 (프레임)**: ✅ 완료
- **Phase 2 (집계 컴포넌트)**: ✅ 완료 (18차)
- **Phase 3 (필터 레이아웃)**: 🟡 진행 중
  - 높이 정책 구현 ✅ (19차)
  - FeedCard 전면 재설계 ✅ (20~21차)
  - FeedWidget 탭 순서/필터 ✅ (21차 확정)
  - feed.json dueAt 자동재계산 ✅ (21차 — _dueAt_role 방식)
  - FeedWidget NEW 세션 랜덤 복구 ✅ (22차 — localStorage 기반)
  - PhoneTooltip 외부클릭 토글 충돌 버그픽스 ✅ (22차)
  - 피드 카드 액션 공통 정책 문서화 ✅ (22~23차 — POLICY.md § 12)
  - FeedCard revert 버튼 제거 ✅ (23차 — 완료 불가 정책 코드 반영)
  - FeedCard SVG 11종 전체 학습 반영 ✅ (24차 — 케이스 A~F 확정)
  - urgentChange / complete / urgentCancel 확인 팝업 구현 ✅ (25차)
  - FeedWidget state lifting (localOverrides) ✅ (25차 — 탭 카운터/필터 실시간 반영)
  - SVG 1~6 플로우 분석 및 정책 반영 ✅ (26차)
  - urgentChange/urgentCancel 버튼 스타일 확정 ✅ (26차 — outlined/contained)
  - 업무관리 탭 urgentChange 전면 제거 ✅ (26차 — SVG 5·6 기준)
  - IN_PROGRESS 상태 urgentChange 불가 정책 확정 ✅ (26차)
  - SVG 분석 규칙 CLAUDE.md·HANDOVER.md 명시 ✅ (26차)
  - SVG 7~11 분석 및 정책 반영 ✅ (27차)
  - 버튼 정책 전면 재정의 ✅ (27차 — 한글명/키 확정)
  - 상태 배지 텍스트 실서비스 기준 통일 ✅ (27차)
  - 탭별 필터 기준 확정 및 filterTickets 수정 ✅ (27차)
  - showMemo activeFilter 조건 추가 ✅ (27차 — 업무관리 탭 한정)
  - NEW/신규 배지 정책 분리 정의 ✅ (27차 — 코드 주석 반영)
  - FeedCard 디자인 버그 수정 ✅ (28차 — SVG 1·2·3 기준 검수)
  - FeedCard 레이아웃/버튼/폰트 추가 수정 ✅ (29차 — minWidth/maxWidth, 버튼 flex 균등, textarea 14px)
  - SVG 3 알림박스 1줄 브라우저 검수 ✅ (29차 — 지연/임박 탭 확인 완료)
  - FeedCard 카드 좌측 패딩 누락 원인 분석 ✅ (30차 — 근본 원인 DOM 실측 확인)
  - FeedCard 좌측 패딩 수정 ✅ (31차 — `minWidth: 280 → 0`)
  - mock IN_PROGRESS+지연/임박 케이스 추가 ✅ (31차 — 012B·012C)
  - POLICY.md 27차 버튼 정책 동기화 ✅ (31차 — § 12-1 전체 버튼 표 추가)
  - **KpiBoard.tsx 삭제 ✅ (32차 — 터미널에서 직접 rm)**
  - **FeedCard 버그 3종 분석 ✅ (32차 — 브라우저 검수 완료, 수정 대기)**
  - **FeedCard 버그 A 수정 ✅ (33차 — delayUrgent COMPLETED/CANCELLED/ON_HOLD 제외)**
  - **필터 탭 99+ 카운트 상한 처리 ✅ (33차)**
  - **필터 탭 레이아웃 반응형 수정 ✅ (33차 — flexWrap wrap, gap 8, paddingBlock 4)**
  - **브레이크포인트 컨테이너 기준 전환 ✅ (33차 — MIN_3COL=1280, MIN_2COL=848, 1열 폴백)**
  - **FeedWidget 우측 패딩 SVG 원본 기준 수정 ✅ (33차 — paddingRight 16→24)**
  - FeedCard 버그 B(feedbackText 박스 디자인) 수정 ❌ 미완 (SVG 8·9 전달 필요)
  - FeedCard 버그 C(UI 깨짐 재현) ❌ 미완
  - SVG 4 정의 ❌ 미완 (다음 세션 — HTML/CSS 전달 필요)
  - 탭 필터별 카드 노출 기준 검수 필요 (브라우저 직접 확인)
  - IssueWidget 카드 구현 ❌ 미완
  - ClaimWidget 카드 구현 ❌ 미완

---

## 🔴 46차 즉시 작업 — FeedCard.tsx 렌더링 마무리 (세션 시작 즉시)

### 45차에서 완료된 것

| 파일 | 작업 내용 | 상태 |
|---|---|---|
| `src/types/dashboard.ts` | `AlertMessage` 인터페이스 추가 (message, registeredAt, source) | ✅ 완료 |
| `src/mocks/feed.json` | SVG1~4 케이스별 `alertMessages` mock 추가 + `_alert_messages_policy` 메타 추가 | ✅ 완료 |
| `FeedCard.tsx` | `getAlertBoxText` → `getAlertBoxContent(dueAt, alertMessages?)` 교체 완료 | ✅ 완료 |
| `FeedCard.tsx` | `AlertMessage` import 추가 | ✅ 완료 |

### 46차에서 마저 해야 할 것 (컨텍스트 차서 중단)

**① `alertText` 계산 변수 수정 (FeedCard.tsx 렌더링 부분)**

현재 코드에서 `alertText` 변수가 `getAlertBoxText(ticket.dueAt)` 로 여전히 구버전 함수를 호출하고 있음.
→ `getAlertBoxContent(ticket.dueAt, ticket.alertMessages)` 로 교체 필요.

찾을 코드:
```
const alertText: string | null = delayUrgent
    ? getAlertBoxText(ticket.dueAt)
    : isCancelled
      ? ticket.feedbackText
      : null;
```

교체할 코드:
```
const alertText: string | null = delayUrgent
    ? getAlertBoxContent(ticket.dueAt, ticket.alertMessages)
    : isCancelled
      ? ticket.feedbackText
      : null;
```

**② 알림박스 `whiteSpace` 수정 (W-3)**

현재 알림박스 div에 `whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'` 있음.
→ `whiteSpace: 'normal'` 로 교체, `overflow`·`textOverflow` 제거.

찾을 코드 (alertText 렌더 div):
```
whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
```
교체할 코드:
```
whiteSpace: 'normal',
```

**③ `>` 버튼 색상 조건 수정 (W-1)**

현재: `delayUrgent` 만으로 파란색 여부 결정
→ `delayUrgent && !isCompleted` 조건으로 변경

찾을 코드:
```
const detailBtnStyle: React.CSSProperties = delayUrgent
    ? { width: 30, height: 30, background: '#1976D2',
```
교체:
```
const detailBtnStyle: React.CSSProperties = (delayUrgent && !isCompleted)
    ? { width: 30, height: 30, background: '#1976D2',
```

그리고 `detailBtnIconColor` 도:
```
const detailBtnIconColor = delayUrgent ? 'white' : 'rgba(0,0,0,0.56)';
```
→
```
const detailBtnIconColor = (delayUrgent && !isCompleted) ? 'white' : 'rgba(0,0,0,0.56)';
```

**④ 전화 아이콘 색상 조건 수정 (W-2)**

전화 아이콘 버튼 배경색이 현재 항상 `#EEEEEE` 이므로 별도 수정 불필요.
단, PhoneIcon SVG 내부 fill이 `rgba(0,0,0,0.56)` 고정이므로 그대로 유지 — 디자인 확정 완료.

**⑤ POLICY.md §12-7 신규 섹션 추가 (W-7)**

`docs/POLICY.md` 의 `## 12. 피드 카드 액션 버튼 공통 정책` 하단에 `### 12-7. 알림박스 우선순위 정책 (45차 확정)` 섹션 추가:
```
### 12-7. 알림박스 우선순위 정책 (45차 확정 — SVG 1~4 전체 적용)

알림박스 노출 우선순위:

| 순위 | 조건 | 내용 | 예시 |
|---|---|---|---|
| 1위 | alertMessages 배열 있고 비어있지 않음 | registeredAt 기준 최신 1건 노출 | "고객 요청으로 오더가 취소되었습니다." |
| 2위 | alertMessages 없거나 빈 배열 | dueAt 기반 마감시간 안내 | "마감시간(15:00)이 10분 남았습니다." |

source 구분:
- SYSTEM: BE 자동 생성 알럿 (취소·상태변경 등)
- OPERATOR: 웹 운영 서비스에서 운영자가 직접 입력

1위 동등 처리: 동일 배열 내 registeredAt 최신 1건만 노출 (동시 2건 표시 없음)

[BE 개발자 참고] 미결 B14(BE 알럿 필드명)·B15(운영자 문구 필드명) — mock 임시 구조 사용 중
```

**⑥ HANDOVER Step 4 절대수치 표 확인**
수정 완료 후 Step 4 표의 기존 값이 코드와 일치하는지 확인할 것.

---

## 🔴 45차 선행 검토 요약 (SVG 4 + 알림박스 정책 변경 — 참고용 유지)

### SVG 4 정의 분석

SVG 4는 **케이스 C-1** (지연/임박 완료 카드) 입니다. SVG 1~3에서 `완료` 버튼 콴후 전환되는 상태.

**확인된 요소:**
- 좌측 색상바: `#FF1744` (빨겕 유지 — 지연 정보 표시)
- 상태 배지: `완료`(#E8F5E9/체크) + `마감 시간 임박`(빨겕)
- 알림박스: `#FEEBEE` 배경, `#D50000` 텍스트 (마감 시간 15:00 · 잔여 10분)
- 하단 버튼: `되돌리기` (error-contained #D32F2F)

**포리시 충돌 이슈 (FE·PM·디자인 협의 필요):**
1. **되돌리기 버튼**: POLICY §12-2 `완료된 일감은 수정·변경·슭제·되돌리기가 원천적으로 불가`를 직접 위반 — SVG 4는 완료 카드에 `되돌리기`가 노출됨 (기존 포리시에 없던 버튼)
2. **전화 아이콘**: 색상 `rgba(0,0,0,0.56)` — 지연/임박 카드는 `#1976D2`여야 하는지 확인 필요
3. **상세업무 호출 버튼(>) 색상**: `#EEEEEE` — 주설에는 지연/임박 카드는 `#1976D2`이었는데, SVG 4는 다 마쳤으니까 `#EEEEEE`이 맞았는지 확인 필요

### 알림박스 정책 변경 (신규, SVG 1~4 전체 적용)

알림박스 노출 우선순위 (**PM이 지시한 신규 정책**):

| 우선 | 조건 | 내용 |
|---|---|---|
| 1위 | BE 얼럼 문구 있음 | 취소/상태변경 관련 쿠. 예) `고객 요청으로 오더가 취소되었습니다. 배정된 키퍼에게 안내가 필요합니다.` |
| 1위 ()동등) | 운영자 입력 문구 있음 | 웹 운영서비스에서 운영자가 직접 입력한 내용. 예) `청소가 필요없는 곳으로 취소수 했습니다.` |
| 2위 | 아무 이슈 없음 | 마감시간 안내. 예) `마감시간(HH:mm)이 MM분 남았습니다.` |

**FE 구현 시 유의사항:**
- BE가 얼럼 문구를 떨기는 필드명 미확정 → **B14 신규 미결 이슈 생성 필요**
- 운영자 입력 문구 필드명도 미확정 → **B15 신규 미결 이슈 생성 필요**
- 1위와 1위(동등) 동시에 있을 때 어떤 것을 우선하는지 **PM 확정 필요**
- 현재 FeedCard에서 알림박스는 `feedbackText` 기반으로 동작 → 우선순위 로직 추가 필요

---

## ✅ 61차 완료 사항

### KPI 정책 전면 개정 (61차 PM 직접 확정)

**확정된 수치 표 (mock 기준, 배포 준비 정본)**

| KPI/탭 | 확정값 | 계산 근거 |
|---|---|---|
| 변경사항 피드 전체 | 27건 | feed.json 전체 |
| 피드 업무관리 탭 | 6건 | active 17건 중 지연/임박 6건 제외 |
| 피드 지연/임박 탭 | 6건 | dueAt 30분 이내/초과 (UNASSIGNED/ASSIGNED/BEFORE_START만) |
| 피드 취소 탭 | 3건 | CANCELLED만 |
| 피드 완료 탭 | 7건 | COMPLETED만 |
| 업무현황 KPI | **17건** | 27 - 완료7 - 취소3 = 17 |
| 미해결 이슈 KPI | **8건** | issueticket미완료6 + ON_HOLD보류2 |
| 미확인 클레임 KPI | **3건** | PENDING만 |
| 달성률 | **30% (12/40건)** | 분모: 피드27+처리필요9+클레임438=40 / 분자: 피드(완료7+취소3)10+이슈오늘완료1+클레임오늘완료1=12 |
| 처리필요 전체 | 9건 | issueticket7 + ON_HOLD2 |
| 처리필요 이슈 탭 | 6건 | issueStatus를 COMPLETED과 ON_HOLD 제외 |
| 처리필요 보류 탭 | 2건 | ON_HOLD만 |
| 클레임 전체 | 4건 | 전체 |
| 클레임 처리대기 | 3건 | PENDING만 |

**PM 확정 정책 핵심:**
- 업무관리 탭: active 17건에서 **지연/임박 제외** (6+6=12건, 중복 없이 정확히 분리)
- 달성률 분모: 전체 40건 (취소 포함, ON_HOLD 포함)
- 달성률 분자: **취소도 완료 건으로** 집계 (10+1+1=12건)
- 이슈와 보류는 **완전히 다른 데이터**, 중복 없음

**D+1 시나리오:**
- 잃일 이월: active(6+6)12건 + 처리필요미완료8건 + 클레임미완료3건 = 23건
- D+1 00:00에 완료·취소건 0으로 리셋, 미배정 신규 등록건 추가

### ① [1번지] 다음 세션 첫 번째 작업 — 61차 확정 정책 전체 검증

> localStorage 오염 전 **반드시 리셋 후** 시작
> ```js
> localStorage.removeItem('feed_new_w1'); localStorage.removeItem('feed_new_w2');
> localStorage.removeItem('feed_mock_w1'); localStorage.removeItem('feed_mock_w2');
> ```

**KPI 카드 4종**

| 항목 | 기대값 | 확인 |
|---|---|---|
| 업무 현황 | 17건 | □ |
| 미해결 이슈 | 8건 | □ |
| 미확인 클레임 | 3건 | □ |
| 오늘 업무 달성률 | 30% (12/40건) | □ |

**변경사항 피드 탭 5종**

| 탭 | 기대값 | 확인 |
|---|---|---|
| 전체 | 27건 | □ |
| 업무관리 | 6건 (지연/임박 제외) | □ |
| 지연/임박 | 6건 | □ |
| 취소 | 3건 | □ |
| 완료 | 7건 | □ |

**처리필요 탭 4종**

| 탭 | 기대값 | 확인 |
|---|---|---|
| 전체 | 9건 | □ |
| 이슈 | 6건 (ON_HOLD 제외) | □ |
| 보류 | 2건 (ON_HOLD만) | □ |
| 완료 | 1건 | □ |

**클레임 탭 3종**

| 탭 | 기대값 | 확인 |
|---|---|---|
| 전체 | 4건 | □ |
| 처리 대기 | 3건 | □ |
| 완료 | 1건 | □ |

위 모든 체크가 ✅ 이후 ②번(배지 잠림)~③번(POLICY 갱신) 진행

### 수정된 파일 (61차)

| 파일 | 변경 내용 |
|---|---|
| `src/mocks/feed.json` | REPORTED 4건 제거, ON_HOLD 2건 제거, 27건 최종 |
| `src/mocks/issues.json` | ON_HOLD 2건 추가 (ISSU-W1-008/009), completedAt 플레이스홀더 추가, totalElements 9 |
| `src/mocks/claims.json` | CLAM-W1-004 completedAt 플레이스홀더 추가 |
| `FeedWidget.tsx` | DELAY탭: COMPLETED·CANCELLED 제외 조건 추가 / TASK탭: 지연/임박 제외 추가 |
| `IssueWidget.tsx` | ISSUE 탭: ON_HOLD 제외 / ON_HOLD 탭: issueStatus===ON_HOLD만 |
| `KpiCards.tsx` | 업무현황: CANCELLED·COMPLETED 제외 전체 / 달성률: 취소 포함 40건 분모, 12건 분자 / completedAt 프로토타입 로직 추가 |
| `FeedCard.tsx` | 배지 행 overflow: hidden → visible 수정 |
| `docs/POLICY.md` | §15-2 달성률 정책 개정 |

---

## ✅ 60차 완료 사항

### 역할별 검토 반영 (60차)

| 파일 | 변경 내용 |
|---|---|
| `src/app/(dashboard)/layout.tsx` | MobileHeader를 LayoutContext.Provider 안으로 이동 — widgetVisibility 기본값만 수신하던 버그 수정 (60차) |
| `docs/POLICY.md` | §14-3보완 세그먼트 탭 OFF 동작 정책 추가 / §14-6 KPI 하위 연동 정책 신규 등록 |
| `HANDOVER.md` | 60차 기준 갱신 |

**FE 버그 수정 (60차):** layout.tsx에서 MobileHeader가 LayoutContext.Provider 바깥에 있어 `useLayoutContext()`가 기본값만 반환하던 이슈. 포함 후 widgetVisibility 변경이 MobileHeader 엄소들(토글 스위치 실제 상태 리딩 등)에 정상 반영됨.

### KPI 집계 로직 개편 (60차 PM 확정 반영)

| 파일 | 변경 내용 |
|---|---|
| `KpiCards.tsx` | PM 확정 정책으로 집계 로직 전면 개편 |
| `docs/POLICY.md` | §15 KPI 숫자 정책 (60차 PM 확정) 등록 |

**업무 현황**: 오늘/이전 미배정 건 + 지연/임박 건 합산, 중복 ticketId Set 제거
**미확인 클레임**: ON_HOLD 티켓 + 클레임 PENDING 합산
**잔여 문제**: mock `scheduledAt`이 `2026-01-01` 고정값이라 달성률 0% 표시 → mock 재설계 시 해결 예정 (연개 일정: 모바일 바텀시트 검수 → FeedCard 버그 B·C → mock 재설계 순)

### KPI 집계 테이블 아키텍처 토론 (60차 BE·PM 로프 미확정)

| 미결 | 내용 |
|---|---|
| Q-BE-A | 업무 현황 중복 건 제거 기준 — BE API 파라미터로 처리 vs FE Set 제거 |
| Q-BE-B | 집계 방식: 이벤트 기반 증분(A안) vs 1분 스냅샷(B안) 선택 |
| Q-BE-C | API 응답 구조: 전체+지점별 한 번에 vs 별도 요청 |
| Q-FE-1 | 10분 폴링 vs SSE 푸시 방식 선택 |
| Q-FE-2 | `aggregatedAt` 트낙스탬프 포함 여부 (N분 전 기준 UI 표시용) |

---

## ✅ 57차 완료 사항

### 취소 탭 재검수 + 완료 탭 전체 검수 (57차)

| 탭 | 카드 수 | 결과 |
|---|---|---|
| 취소 탭 재검수 | 5개 (보류 2 + 취소 3) | ✅ 전체 이상 없음 — 회색 박스 단독 노출, 빨간 알림박스 없음 확인 |
| 완료 탭 | 6개 (전체 COMPLETED+지연) | ✅ 전체 이상 없음 — 배지 중첩/색상바/알림박스/후속 일감 생성 버튼 모두 정상 |

**변경사항 피드 전체 탭 검수 완료 (전체/업무관리/지연임박/취소/완료).**
다음 작업: FeedCard 버그 B·C 순서대로 진행.

---

## ✅ 52차 완료 사항

### SVG 7~9 분석 + FeedCard.tsx 코드 반영 + 문서 업데이트 (52차)

| 항목 | 내용 |
|---|---|
| SVG 7 정의 | `IN_PROGRESS` 업무관리 카드. 업무관리 탭 한정 urgentChange 노출 (26차 지연/임박 정책과 구분) |
| SVG 8 정의 | COMPLETED Type A — 메모 없음. 후속 일감 생성 단독 |
| SVG 9 정의 | COMPLETED Type B — 메모 있음. 읽기 전용 박스(테두리없음/white/20px좌우 16px상하/자연높이) + 후속 일감 생성 |
| 코드 반영 | `getCardActions()` activeFilter 파라미터 추가, `getActionLabel()` 함수 신설(탭별 레이블 분기), memoText 훅 컴포넌트 상단으로 이동 |
| 코드 반영 | SVG 9 읽기 전용 입력박스 구현, 버튼 레이아웃 좌우 분리, unassign 팝업 문구 교체 |
| POLICY.md | §12-6 urgentChange 조건 + COMPLETED 카드 항목 업데이트 / §12-12 SVG 7 / §12-13 SVG 8·9 신규 등록 |
| FeedCard.tsx 주석 | 케이스 D~H 전면 갱신 / COMPLETED 정책 주석 51차 반영 |
| B22 신규 | `startedAt` 필드 여부·필드명 BE 확정 필요 |

**역할별 루프 결과:**
- FE: 훅 규칙 위반 수정(모오스텍스트 컴포넌트 상단으로), createFollowUp 단독 시 flex-end 레이아웃 확인
- 디자인: 읽기 전용 박스 테두리 없음 = 수정 불가 시각 표현 확정 / 이미지는 SVG 미제공으로 현재 숨김
- PM: 업무관리 탭 완료 카드 메모 박스 노출 조건 확인(탭=TASK && isCompleted && feedbackText)

---

## ✅ 51차 완료 사항

### SVG 6 분석 + ASSIGNED 카드 정책 확정 (51차)

| 항목 | 내용 |
|---|---|
| SVG 6 정의 | `ASSIGNED(배정됨)` 상태, 업무관리 탭, SVG 5에서 [배정 하기] 후 전환된 결과 카드 |
| unassign 팝업 문구 | `"키퍼 매칭을 해제하시겠습니까?"` 확정 (기존 임시 문구 교체) |
| unassign 실패 토스트 | `"배정이 해제되지 않았습니다. 다시 시도해 주세요."` 확정 |
| BE 검증 조건 | 배정 해제 시 BE 가능여부 검증 필요 — B20 신규 등록 |
| 헤더 우측 시간 | ASSIGNED 카드 = 배정 완료 시각 (`assignedAt` 계열) — B21 신규 등록 |
| inputbox 취소 버튼 | SVG 6 구버전 디자인 — 취소 버튼 없음 유지 (50차 §12-9 정책 그대로) |
| POLICY §12-1 | unassign 행 팝업 문구·실패 처리 업데이트 |
| POLICY §12-11 | SVG 6 ASSIGNED 카드 정책 신규 섹션 추가 |
| B20 신규 등록 | 배정 해제 API — 가능여부 검증 포함 여부·실패 응답 구조 미정 |
| B21 신규 등록 | `assignedAt` 필드명·타입 확정 필요 |
| FeedCard.tsx 주석 | 신규 배지 AND 조건 (`isCreatedToday + UNASSIGNED`) 반영 |

**역할별 루프 결과:**
- FE: unassign API 응답 분기(성공→UNASSIGNED 전환 / 실패→토스트) 정책 확정. 헤더 시간 필드는 B21 확정 후 교체.
- 디자인: SVG 6 취소 버튼 = 구버전. 취소 버튼 없음 유지 확정.
- PM: 배정 해제 팝업 문구·실패 안내 문구 확정.
- BE: B20(배정 해제 API 검증 포함 여부)·B21(assignedAt 필드) 신규 등록.

---

## ✅ 50차 완료 사항

### SVG 5 분석 + 업무관리 탭 정책 확정 (50차)

| 항목 | 내용 |
|---|---|
| SVG 5 정의 | `UNASSIGNED(미배정)` 상태, 업무관리 탭, 메모 입력 열린 상태 |
| SVG 5~9 | 업무관리 탭 카드군 전체. SVG 5가 공통 컴포넌트 기준점 |
| PM Q6 확정 | `UNASSIGNED(미배정)`에서 긴급 변경 버튼 노출 확정 — 이미 생성된 티켓에 긴급 여부 지정 가능 |
| 메모 inputbox | 업무관리 탭 진입 시 기본 열림 / `저장` = 내용 확정 버튼 / disabled 조건 `memoText.trim().length > 0` |
| 저장 후 상태 | 비활성화 카드로 전환 — 별도 SVG 제공 예정, 현재 구현 보류 |
| POLICY §12-1 | urgentChange 대상 상태에 UNASSIGNED 포함 확정 표기 추가 |
| POLICY §12-2 | 긴급 변경 가능 조건 전체 상태 명시 (REPORTED·UNASSIGNED·ASSIGNED·BEFORE_START) |
| POLICY §12-9 | 업무관리 탭 메모 inputbox 정책 신규 섹션 추가 |
| B17 신규 등록 | 메모 저장 API 엔드포인트·payload 미정 |
| B18 신규 등록 | 이미지 업로드 API 파일 크기·포맷·presigned URL 미정 |

**역할별 루프 결과:**
- FE: inputbox 구현 가능, 저장 OR 조건(`memoText || images.length>0`), 5장 토스트, 취소버튼 제거, mock 처리 후 BE 연결 대기
- 디자인: SVG 5 스펙 명확. 저장 후 비활성화 카드 SVG 추후 제공 예정. 이미지 다수장 레이아웃 SVG 미제공
- PM: Q-A~D 전부 확정 완료
- BE: B17·B18·B19 신규 등록. §12-4·12-10 주석 보완 완료. 필드명 확정 후 FE 공유 필요

---

## ✅ 48차 완료 사항

### 완료+지연 케이스 시각 요소 코드 수정 + 인수인계 마무리 (48차)

| 파일 | 변경 내용 |
|---|---|
| `FeedCard.tsx` | `getLeftBarColor()` dueAt 파라미터 추가 — COMPLETED+지연 케이스 `#FF1744` 반환 |
| `FeedCard.tsx` | opacity 조건 수정 — COMPLETED+지연 케이스 opacity 1 유지 |
| `POLICY.md` | §12-8 정상 실성한 섹션 포함 (하단 오타 있는 구 셀션은 다음 세션 시작 시 1순위 삭제 필요) |
| `HANDOVER.md` | Step 2 49차 기준 갱신, 인수인계 완료 |

**FE·디자인·PM 루프 완료:**
- 레이아웃구조 변경 금지 원칙 주제로 FE·PM·디자인 논의 결과: 완료+지연 케이스 좌측바 빨간, 헤더 opacity 1, 탭 자동이동 없음 — 확정
- 자동 탭 이동 범위 외 (tabMovePolicy 미연 원인): 우선순위 중간으로 등록

---

## ✅ 47차 완료 사항

### 완료 카드 알림박스·배지 정책 + 로케일 판정 기준 확정 (47차)

| 파일 | 변경 내용 |
|---|---|
| `FeedCard.tsx` | `localeNowMs()` 함수 추가 — 로케일 시스템 시각 기준 epoch ms 통일 |
| `FeedCard.tsx` | `wasDelayedBeforeComplete()` 함수 추가 — COMPLETED 카드의 지연 여부 도별 판정 |
| `FeedCard.tsx` | `getStatusBadge()` → `getStatusBadges()` 배열 반환으로 변경 — 완료+지연 배지 중첩 대응 |
| `FeedCard.tsx` | `alertText` 조건 추가 — COMPLETED + alertMessages 있으면 노출 |
| `FeedCard.tsx` | 완료 카드 feedbackText 노출 조건에서 `!delayUrgent` 제거 |
| `POLICY.md` | §12-8 완료 카드 알림박스·배지 정책 섹션 추가 |
| `HANDOVER.md` | Step 0-2 컨텍스트 압축·세션 이동 시 절대 손실 금지 규칙 추가 |
| `HANDOVER.md` | 미결 이슈 B16 `completedAt` 필드 요청 등록 |

**역할별 논의 루프 완료:**
- 알림박스 = 마감시간/운영자등록/시스템 알럿을 빨간 컴포넌트에 표기 — 정의 확정
- 완료 카드 alertMessages 노출 — 확정
- 완료+지연 배지 중첩 (PM/디자인 루프) — 확정
- 지연 판단 기준 `dueAt < 로케일 현재시각` — 확정 (B16 임시)

---

## ✅ 46차 완료 사항

### FeedCard.tsx 렌더링 마무리 + POLICY.md §12-7 추가 (46차)

**확인 사항:**
- FeedCard.tsx `alertText` 변수: `getAlertBoxContent(ticket.dueAt, ticket.alertMessages)` 호출 — 45차 이후 코드에 이미 적용되어 있음 ✅
- FeedCard.tsx 알림박스 `whiteSpace: 'normal'` — 이미 적용되어 있음 ✅
- FeedCard.tsx `>` 버튼 색상 조건 `delayUrgent && !isCompleted` — 이미 적용되어 있음 ✅
- POLICY.md §12-7 알림박스 우선순위 정책 셀션 추가 ✅

---

## ✅ 45차 완료 사항

### SVG 1~4 알림박스 정책 + 공통 컴포넌트 검토 (45차)

**역할별 협의 루프 완료:**
- SVG 4 디자인 파일의 `되돌리기` 버튼 = 디자인 실수 확정 → `후속 일감 생성`(neutral-outlined) 유지
- 전화 아이콘: 완료 카드에서 `rgba(0,0,0,0.56)` 회색 — 의도된 스펙 확정
- `>` 버튼: 완료 카드에서 `#EEEEEE` 회색 — 의도된 스펙 확정
- 알림박스 우선순위: BE알럿/운영자문구 > 마감시간 안내 — 확정
- 1위 동등 처리: `registeredAt` 최신 1건만 노출 — 확정

**코드 작업 (일부 완료, 나머지 46차 첫 작업):**
- `AlertMessage` 인터페이스 `types/dashboard.ts`에 추가 ✅
- `TicketReport.alertMessages?: AlertMessage[]` 필드 추가 ✅
- `feed.json` SVG1~4 케이스별 `alertMessages` mock 데이터 추가 ✅
- `getAlertBoxText` → `getAlertBoxContent(dueAt, alertMessages?)` 함수 교체 ✅
- FeedCard.tsx 렌더링 부분 (`alertText` 변수, `whiteSpace`, `>` 버튼 색상 조건) ❌ 미완
- POLICY.md §12-7 추가 ❌ 미완

## ✅ 44차 완료 사항

### SubSidebar 마운트/언마운트 떨림 피스 (44차)
**원인**: `{sidebarOpen && <SubSidebar />}` 방식 — `true→false→true` 시 DOM 완전 파괴·재생성 → 리플로우 2회 + CSS 트랜지션 불가
**해결**: wrapper div `width` 트랜지션 방식
- SubSidebar 항상 렌더 (언마운트 없음)
- `width: sidebarOpen ? 260 : 0`, `overflow: hidden`, `transition: width 0.2s ease`
- 리플로우 없이 부드럽한 애니메이션 동작

## ✅ 43차 완료 사항

### ResizeObserver 피드백 루프 버그 피스 (43차)
**원인**: `main` DOM 실측 기반으로 `sidebarOpen`을 바꾸면 `main` 너비가 바뀌고, 다시 ResizeObserver가 발화되는 피드백 루프 → 떨림
**해결**: `vw` 수식 기반으로 전환
- `SUB_AUTO_CLOSE_VP = 1,220` 추가 (= WEB_2COL_MIN_CHILDREN(848)+GNB(64)+Sub(260)+PAD(48))
- `main` DOM ResizeObserver 슬롯(개별 useEffect) 제거
- `wasMobileRef` 추가 — 모바일→데스크탑 전환 시 `lastDesktopSidebarRef` 복원 정확화
- 단일 ResizeObserver로 통합 — 중복 Observer 제거

## ✅ 42차 완료 사항

### 대안 2 코드 초기 구현 (42차)
- `layout.tsx` MOBILE_BP **1220 → 960** 수정 (41차 확정, 사이드바 BP 제외)
- `layout.tsx` WEB_2COL_MIN_CHILDREN=848 상수 추가
- `page.tsx` MOBILE_BP **1220 → 960** 수정 + 주석 동기화

---

## ✅ 39차 완료 사항

### 브라우저 검수 (39차)
- 웹 2열/3열 레이아웃 확인 ✅
- 필터탭 1줄(변경사항 피드) ✅
- 상태배지 1줄(flexWrap wrap) ✅
- 웹 탭 없음 정책 코드 확인 ✅
- JS 시뮬레이션으로 브레이크포인트 로직 정합성 확인 ✅

### needsScroll 모바일 2열 적용 (39차)
- `FeedWidget.tsx` `IssueWidget.tsx` `ClaimWidget.tsx` 수정
- `needsScroll` 조건: `(!isMobile || (isMobile && desktopCols===2)) && !isSingleColumn`
- IssueWidget/ClaimWidget 함수 시그니처에 `isSingleColumn` destructure 추가

### 모바일 2열 위젯 배치 정독 (39차 확정)
- 1열: Feed+Issue 세로 / 2열: Claim
- page.tsx 수정 완료(문법 에러 해결 포함)
- ⚠️ 브레이크포인트 연속 전환 미해결 — 다음 세션 1번 작업

---

## ✅ 37차 완료 사항

### 반응형 열 수 코드 수정 (page.tsx)
- `MIN_3COL_CONTAINER` 상수 삭제
- `TAB_UPPER_THRESHOLD` 상수 삭제 (컨테이너 ≥1280 → 탭 정책 폐기)
- `desktopCols: 2 | 1` — 웹 항상 2, 모바일은 `mobileContainerW >= MIN_2COL_CONTAINER(670)` 기준
- `calcContainerWidth`(데스크탑 전용) → `calcMobileContainerWidth(vw - 32)` 분리
- 탭 전환 조건: `isSingleColumn`(vw ≤ 717px) 단독
- FeedCard `maxWidth: 600` 제거 ✅ (36차 작업)

### FeedWidget 수정
- 필터탭 `flexWrap: 'wrap'` 복원 (POLICY § 12-5, 33차 확정값)
- `needsScroll`: `!isMobile && !isSingleColumn` 조건 추가
- 상태배지 `flexWrap: 'wrap'` 고정 (배지 잘림 방지)

### POLICY.md 수정
- § 3-2: A/B/C 3구간으로 재정의
- § 3-7: 탭 전환 조건 `isSingleColumn` 단독으로 수정
- § 3-8: 웹 항상 2열, 모바일 컨테이너(vw-32)≥670 → 2열

### 이전 세션 수정이 날아간 근본 원인 확정
- 33~36차에서 수정한 컨테이너 너비 실측값, flexWrap 조건, needsScroll 조건이 HANDOVER 완료 섹션에 기록되지 않음
- 37차 탭 추가 작업 시 page.tsx 분기를 재작성하면서 기존 수치들을 덮어씀
- calcContainerWidth(데스크탑 전용)를 모바일에도 호출하는 버그가 재도입됨

---

## ✅ 36차 완료 사항

### 세그먼트 탭 3종 전환 구현 (page.tsx)
- `singleColTab` 타입: `'issue' | 'claim'` → `'feed' | 'issue' | 'claim'`
- 기본값: `'feed'` (변경사항 피드)
- FeedWidget 탭 위 상단 고정 노출 제거 → `feed` 탭 콘텐츠로 통합
- 3개 탭 균등 배분 (변경사항 피드 / 처리필요 / 클레임)

### 반응형 열 수 정사 분석 (POLICY.md § 3-7·3-8 갱신)
- **3열 완전 폐지** 정책 확정: 직접 컨테이너 너비 실측(vw=1094, 컨테이너=722px)
- 컨테이너 848~1,279px → 2열, ≥1,280px → 탭, <848px → 탭
- FeedCard `maxWidth: 600` 하드코딩 이슈 실측 확인 (1열 우측 122px 공백)
- `page.tsx` 탭 전환 조건 수정 미완 (37차 첫 작업)

---

## ⚠️ 37차 미완 작업 — 38차 첫 작업

### 🔴 이전 4개 세션 크롬 학습 및 절대 수치 검증
- 이전 세션(33~36차)에서 수정했던 내용을 크롬에서 1세션씩 학습·확인
- 확인된 절대 수치를 HANDOVER § 절대수치 섹션에 기록
- 학습 완료 후 컨테이너 최소 너비(상태배지+업무종류+마진+시간+전화아이콘+버튼 전부 표시 기준) 조정

---

## ⚠️ 이전(36차) 미완 작업

### 🔴 반응형 열 수 정사 코드 수정 (page.tsx + FeedCard.tsx) — 37차 완료

**문제**: 현재 `isSingleColumn` 구간에서 FeedWidget이 탭 밖에 상단 노출되고 세그먼트 탭은 처리필요/클레임 2종만 전환. 사용자가 전달한 SVG/CSS 기준 **3종 탭 전환**으로 바꾸야 함.

**목표 구조** (이미지+CSS 전달됨):
```
[변경사항 피드 7] [처리필요 2] [클레임 1]  ← 세그먼트 탭 (3종)
———————————————————————————
[선택된 탭 콘텐츠 노출]      ← FeedWidget or IssueWidget or ClaimWidget
```

**CSS 스펝** (전달된 styled-components 기준):
- 전체 컨테이너: `width: 343px`, `height: 40px`, `borderRadius: 8px`, `display: inline-flex`
- 활성 탭(`On`): `background: #212121`, 좌측 borderRadius 8px, 텍스트 `white`, `font-size: 12px`, `font-weight: 500`
- 비활성 탭(`Non`): `background: white`, 텍스트 `#757575`, 테두리 상/우/하 `1px #E0E0E0`
- 배지: 활성=`white` 배경, 비활성=`#F5F5F5` 배경, 텍스트 `rgba(0,0,0,0.87)`, 20xd720px

**코드 변경 내용** (`page.tsx` `isSingleColumn` 분기):
1. `singleColTab` 타입: `'issue' | 'claim'` → `'feed' | 'issue' | 'claim'`
2. 탭 항목: 2종(처리필요/클레임) → 3종(변경사항피드/처리필요/클레임)
3. FeedWidget을 탭 위에서 제거 → 탭 콘텐츠로 이동
4. 세그먼트 탭 콜렉션: `['feed', 'issue', 'claim']` 루프로 렌더
5. 첫 번째 탭 좌측 borderRadius, 마지막 탭 우측 borderRadius

**주의사항**:
- FeedWidget `isMobile isSingleColumn desktopCols={1}` prop 유지
- 변경사항 피드 콴테츠 수: 실제 `roomFilteredTickets` 수 연동 필요 (TODO)
- POLICY.md § 3-7 업데이트: 탭 항목 3종으로 갱신 필요

---

## ✅ 34차 완료 사항

### FeedCard 버튼 레이아웃 수정
- `actions.length >= 2` 시 `flex: 1 1 0` stretch 제거 → `flex: false`, `justifyContent: flex-end` 통일
- SVG 원본 스펙(우측 정렬 + content 크기) 일치

### 그리드 alignItems 수정
- `page.tsx` 위젯 그리드에 `alignItems: 'start'` 추가
- 카드 1~2장일 때 위젯이 옹 위젯 높이에 맞춰 늘어나던 문제 해소

### Empty UI 구현 (POLICY.md § 6-7)
- 카드 0장 시 `"조회된 일감이 없습니다."` 문구 중앙 배치
- 데스크탑(2열/3열): paddingTop/Bottom 100px, 모바일/1열: 40px
- `desktopCols` prop 연결: `page.tsx` → `FeedWidget`
- 공간번호 검색 기능 도입 시 동일 UI 재사용 예정

### POLICY.md § 6-7 신규 추가
- 역할별 체크리스트 포함 (FE/디자인/PM/BE)
- BE 공간번호 검색 API 파라미터 예시 기록
- Empty 상하 마진 100px → 200px 수정

### IssueWidget / ClaimWidget Empty UI 적용
- 기존 문구("해당하는 이슈가 없습니다" / "클레임 카드 영역") → "조회된 일감이 없습니다." 통일
- `desktopCols` prop 추가, 데스크탑 상하 200px / 모바일 40px

### 2열 레이아웃 위젯 배치 변경 (POLICY.md § 3-8)
- 기존: 그리드 3칸 나란히 → 변경: FeedWidget 왼쪽 1열, Issue+Claim 오른쪽 1열 세로
- 3열: 기존대로 3개 나란히 유지

### 모바일 1열 탭 UI 교체 (POLICY.md § 3-7)
- 기존 파란색 단순 버튼 → 디자인 SVG 기준 세그먼트 탭 적용
- 활성: #212121 배경 + 흰 텍스트, 비활성: 흰 배경 + #E0E0E0 테두리
- 카운트 하드코딩(2/1) — Phase 3 실제 카운트로 교체 필요 (미결 항목)

---

## ✅ 33차 완료 사항

### FeedCard 버그 A 수정
- `delayUrgent` 계산에서 COMPLETED/CANCELLED/ON_HOLD 상태 제외
- `>` 버튼 색상 오류 해결 (파란색 → 회색 정상화)

### 필터 탭 반응형 수정
- `flexWrap: wrap`, `gap: 8`, 비활성 탭 `paddingBlock: 4` (터치 타겟 32px 확보)
- 카운트 `99+` 상한 처리 — POLICY.md § 12-5 신규 추가
- 활성 탭 카운트 배지 `width:20` → `minWidth:20`

### 브레이크포인트 컨테이너 기준 전환
- `COMP_MIN_W` 방식 → `calcContainerWidth()` + `MIN_3COL_CONTAINER=1280` / `MIN_2COL_CONTAINER=848`
- 1열 폴백(`desktopCols=1`) 추가

### FeedWidget 우측 패딩 수정
- SVG 원본 실측 기준 `paddingRight: 16` → `paddingLeft`(24)로 통일

### 탭 필터 검수 완료 ✅
- 012B(Z1 키퍼): IN_PROGRESS + isUrgent=false → `완료` 단독 버튼 ✅
- 012C(Z2 키퍼): IN_PROGRESS + isUrgent=true → `완료` 단독 버튼 ✅ (urgentCancel 미노출 확인)

### 미결 버그
#### 🟡 버그 B — 완료 카드 feedbackText 박스 디자인
**증상:** feedbackText 박스 `outline: 1px #EEEEEE`가 배경 `#F5F5F5`와 구분 안 됨.
SVG 8·9 원본 전달 시 재검수 후 수정.

#### 🟡 버그 C — UI 깨짐 재현 케이스
31차 `minWidth: 0` 수정 후 현재 미재현. 다음 세션에서 구체적 카드/해상도 확인 필요.

---

## ⚠️ 다음 세션 시작 즉시

### 서버 재시작
```bash
npm run dev
```

### localStorage 캐시 초기화 (NEW 상태 리셋 시)
```js
localStorage.removeItem('feed_new_w1');
localStorage.removeItem('feed_new_w2');
// 피드 데이터 리셋 시
localStorage.removeItem('feed_mock_w1');
localStorage.removeItem('feed_mock_w2');
```

### 다음 세션 첫 번째 우선순위
위에 **NEW SESSION QUICK START** 섹션 참고

### ⚠️ 다음 세션 시작 방법
```
1. HANDOVER.md 읽기 — filesystem MCP로 직접 읽을 것
2. NEW SESSION QUICK START 섹션 실행
3. SVG 파일은 /Users/grey/Desktop/local_grey/workspace/ 저장 후 filesystem으로 읽기
```

---

## 🔴 역할별 미결 합의 항목 (25차 검수 기준 — 해결 전까지 매 세션 유지)

> 아래 항목은 각 역할 담당자와 합의 완료 전까지 FE에서 임의 결정하지 않는다.
>
> 확정 (26차): IN_PROGRESS 상태에서 urgentChange 불가 — 코드 및 POLICY.md 반영 완료
> 합의 완료 시 해당 행을 ✅로 변경하고 코드에 반영한다.

### 디자인
| # | 항목 | 현행 (임시) | 합의 필요 내용 |
|---|---|---|---|
| P1 | ✅ urgentCancel 버튼 스타일 | error-contained (#D32F2F) | 확정 완료 |
| P2 | ✅ urgentChange 버튼 텍스트 | `긴급 변경` | 27차 확정 |
| P3 | ✅ SVG 4 완료 후 버튼 | `후속 일감 생성` (neutral-outlined) | 27차 확정 |
| P4 | REPORTED/UNASSIGNED 긴급 변경 팝업 문구 | `배정하면 긴급업무로 생성돼요` (임시) | 디자인 확정 필요 |

### PM
| # | 항목 | 현행 | 합의 필요 내용 |
|---|---|---|---|
| Q1 | ✅ 업무관리↔지연/임박 중복 표시 | 중복 표시 | 확정: 업무관리에 지연/임박 포함 |
| Q2 | ✅ 업무관리 COMPLETED 표시 | 미노출 | 확정: COMPLETED는 업무관리 미노출 |
| Q3 | urgentCancel 팝업 타이틀 | `긴급 처리를 취소하시겠습니까?` (임시) | 확정 텍스트 전달 요청 |
| Q4 | ✅ 메모 영역 노출 조건 | 업무관리 탭 한정 | 확정: 업무관리 탭에서만 노출 |
| Q5 | 후속 일감 생성 링크 동작 | console.log 목업 | 새 탭? 라우팅? 팝업? 정책 확정 필요 |
| Q6 | ON_HOLD(보류) | 취소 탭 포함 | 확정: 완료 건의 정산 보류 등 → 취소 탭 통합 |
| Q7 | ✅ REPORTED·UNASSIGNED 긴급 변경 | 50차 확정 — 배정 전 전 상태 전체에서 노출 | — |

### BE
| # | 항목 | 현행 (임시) | 합의 필요 내용 |
|---|---|---|---|
| B1 | urgentChange API | `console.log` 목업 | 엔드포인트 제공 |
| B2 | forceComplete API | `console.log` 목업 | 엔드포인트 제공 |
| B3 | 키퍼 수락 상태 필드 | 미제공 | urgentCancel 미노출 조건용 필드명/타입 |
| B4 | cancellationReason 필드 | `feedbackText` 임시 사용 | 취소 사유 전용 필드 여부 |
| B5 | ✅ TicketStatus 8단계 | 실서비스 확인 완료 | 보고됨/미배정/배정됨/수행전/수행중/완료/보류/취소 |
| B6 | keeperName / keeperPhone 제공 여부 | 프로토타입 확장 필드 | BE API 응답에 포함 여부 |
| B7 | 처리 후 앱 내 카드 노출/삭제 이벤트 | FE API 호출 후 로컬 상태만 변경 | BE 응답 이벤트 구조 (WebSocket 등) |
| B8 | unassign API | `console.log` 목업 | 엔드포인트 제공 |
| B9 | start API | `console.log` 목업 | 엔드포인트 제공 |
| B10 | cancelStart API | `console.log` 목업 | 엔드포인트 제공 (ASSIGNED로 롤백) |
| B11 | cancelTicket API | `console.log` 목업 | 엔드포인트 제공 |
| B12 | 신규 배지용 필드 | 미구현 | 오늘 생성 여부 판단 필드 (isCreatedToday 또는 createdAt) |
| B13 | NEW 배지 확인 처리 API | `console.log` 목업 | 사용자 확인 시 서버 전달 엔드포인트 |

---

## 📋 확정된 정책 목록 (25차 기준)

### 🔴 피드 카드 케이스 정의 (27차 SVG 11종 최종 확정)

| SVG | 탭 | 상태 | isUrgent | 하단 버튼 |
|---|---|---|---|---|
| 1 | 지연/임박 | ASSIGNED or BEFORE_START | false | `긴급 변경`(error-outlined) + `완료`(primary-contained) |
| 2 | 지연/임박 | ASSIGNED or BEFORE_START | true | `긴급 취소`(error-contained) + `완료`(primary-contained) |
| 3 | 지연/임박 | IN_PROGRESS | any | `완료`(primary-contained) 단독 |
| 4 | 지연/임박 | COMPLETED | any | `후속 일감 생성`(**error-contained** #D32F2F) (58차 SVG 4 실측 확인) |
| 5 | 업무관리 | REPORTED or UNASSIGNED | false | `일감 취소`(error-outlined) + `배정 하기`(primary-contained) |
| 6 | 업무관리 | ASSIGNED | false | `배정 해제`(error-outlined) + `시작하기`(primary-contained) |
| 7 | 업무관리 | IN_PROGRESS | any | `긴급 변경`(error-outlined) + `시작 취소`(error-outlined) + `완료 하기`(primary-contained) — 51차 확정 |
| 8 | 완료 | COMPLETED | any | `후속 일감 생성`(**error-contained** #D32F2F) — 짧은 카드 (58차 SVG 8 실측) |
| 9 | 완료 | COMPLETED | any | `후속 일감 생성`(**error-contained** #D32F2F) — 2행 카드 (58차 SVG 9 실측) |
| 10 | 취소 | CANCELLED + NEW | any | 없음 |
| 11 | 취소 | CANCELLED | any | 없음 |

### 🔴 피드 카드 액션 공통 정책 (27차 최종 확정)
> **상세 내용**: `docs/POLICY.md` § 12 참고 (Claude Code 개발자 필독)

#### 긴급 변경 권한
| 항목 | 내용 |
|---|---|
| 권한 | 운영자 CRUD 권한 보유자 (ADMIN / MANAGER 모두 해당) |
| 일반 변경 가능 조건 | ASSIGNED 이상 + IN_PROGRESS 미만 + 키퍼 수락 전 |
| 특수 케이스 | REPORTED·UNASSIGNED — 일감 미생성 상태, 배정 시 긴급으로 등록됨 |
| 키퍼 수락 후 | `긴급 취소` 버튼 미노출 (BE 수락 상태 필드 기준) |

#### 버튼 전체 정책 (27차 최종 확정)

| 버튼 키 | 한글명 | 대상 상태 | 스타일 | 팝업 title | 팝업 contents | 확인 후 동작 |
|---|---|---|---|---|---|---|
| urgentChange | 긴급 변경 | REPORTED·UNASSIGNED(특수) / ASSIGNED·BEFORE_START(일반) | error-outlined | 배정하면 긴급업무로 생성돼요 (특수) / 선택하신 일감을 긴급 처리 건으로 변경하시겠습니까? (일반) | 없음 | urgentCancel 버튼으로 교체 |
| urgentCancel | 긴급 취소 | isUrgent=true 상태 | error-contained | 선택하신 일감의 긴급 처리를 취소하시겠습니까? (**⚠️ Q3 임시**) | 없음 | urgentChange 버튼으로 복귀 |
| unassign | 배정 해제 | ASSIGNED | error-outlined | 선택하신 일감의 배정을 해제하시겠습니까? | 없음 | UNASSIGNED로 롤백 |
| start | 시작하기 | ASSIGNED·BEFORE_START | primary-contained | 선택하신 일감을 시작 처리하시겠습니까? | 없음 | IN_PROGRESS로 전환 |
| cancelStart | 시작 취소 | IN_PROGRESS | error-outlined | 선택하신 일감의 시작을 취소하시겠습니까? | 취소 시 배정됨 상태로 되돌아갑니다. | ASSIGNED로 롤백 |
| forceComplete | 완료 | 지연/임박 전 상태 | primary-contained | 선택하신 일감을 완료 처리하시겠습니까? | 완료 처리된 일감은 복구할 수 없습니다. | COMPLETED로 전환 |
| createFollowUp | 후속 일감 생성 | COMPLETED | neutral-outlined | 없음 (링크) | — | 후속 일감 생성 페이지 연결 (**⚠️ Q5 정책 미확정**) |
| assign | 배정 하기 | REPORTED·UNASSIGNED | primary-contained | (팝업 없음) | — | 배정 처리 |
| cancelTicket | 일감 취소 | REPORTED·UNASSIGNED | error-outlined | 일감을 취소하시겠습니까? (⚠️ Q-C 임시) | 취소된 일감은 복구할 수 없으며 어드민에서 삭제됩니다. | 일감 취소(삭제) 처리 |

#### 완료 처리 최강 디폴트 정책 (서비스 전체 — 절대 변경 불가)
> **완료된 일감은 수정·변경·삭제·되돌리기가 원천적으로 불가합니다.**
- COMPLETED 카드: 액션 버튼 일체 미노출
- `revert`(되돌리기) 버튼: **존재하지 않음** (FeedCard.tsx에서 완전 제거됨)

### 🔴 탭별 필터 기준 (27차 확정)

| 탭 | 포함 상태 | 메모 영역 | 비고 |
|---|---|---|---|
| 전체 | 모든 상태 | ❌ | |
| 업무관리 | REPORTED·UNASSIGNED·ASSIGNED·BEFORE_START·IN_PROGRESS | ✅ | 지연/임박 카드 중복 포함 |
| 지연/임박 | dueAt 30분 이내/초과 또는 isUrgent=true | ❌ | |
| 취소 | CANCELLED·ON_HOLD | ❌ | ON_HOLD = 정산 보류 등 종료 처리 보류 |
| 완료 | COMPLETED | ❌ | |

### 🔴 상태 배지 정의 (27차 확정)

| ticketStatus | 한글 배지 | 출처 | 비고 |
|---|---|---|---|
| REPORTED | 보고됨 | BE | |
| UNASSIGNED | 미배정 | BE | |
| ASSIGNED | 배정됨 | BE | |
| BEFORE_START | 수행전 | BE | 배정됨~수행전 구간. 수행중 트리거 시 IN_PROGRESS 전환 |
| IN_PROGRESS | 수행중 | BE | |
| COMPLETED | 완료 | BE | |
| ON_HOLD | 보류 | BE | |
| CANCELLED | 취소 | BE | |
| dueAt 30분↓ | 마감 시간 임박 | FE 판단 | |
| dueAt 초과 | 일감 마감 지연 | FE 판단 | |
| isNew=true | NEW | BE isNew 필드 | 사용자 미확인 일감. 확인 시 BE 전달 필요 (**⚠️ B13**) |
| isCreatedToday | 신규 | BE 필드 (**⚠️ B12**) | 오늘 생성된 일감. 미배정 전환 시 소멸 |
| taskType | 재실청소·정규청소 등 | BE | 일감 유형. FE는 그대로 표시 |

### 전화버튼 UX (22차 확정)
| 플랫폼 | 동작 |
|---|---|
| 웹 브라우저 | 전화 아이콘 클릭 → 툴팁 열림 (전화번호 표기) |
| 웹 브라우저 | 전화 아이콘 재클릭 → 툴팁 토글 닫힘 |
| 웹 브라우저 | 툴팁 내 X버튼 클릭 → 닫힘 |
| 웹 브라우저 | 툴팁 외부 클릭 → 닫힘 (mousedown, 버튼 영역 제외) |
| 모바일 브라우저 | 전화 아이콘 클릭 → OS 전화앱 연결 (tel: 링크) |

### NEW 세션 랜덤 복구 (22차)
- **localStorage 키**: `feed_new_w1`, `feed_new_w2`
- **비율**: `NEW_RANDOM_RATIO = 0.35`
- **소멸**: 카드/버튼 클릭 → `onDismissNew` → localStorage 동기
- **⚠️ 실서비스**: `applyRandomNew()` 등 제거, isNew는 BE API 직접 사용

### 기존 확정 정책 (19~21차)
| 항목 | 정책 |
|---|---|
| 지연/임박 대상 | REPORTED·UNASSIGNED·ASSIGNED·BEFORE_START·IN_PROGRESS (dueAt 30분 이내) |
| 알림박스 텍스트 | "마감 시간 HH:mm · 잔여 N분" / "+N분 초과" |
| 잔여시간 최솟값 | 1분 / 초과시간 최댓값 +999분 cap |
| > 버튼 색상 | 지연/임박 → 파란(#1976D2) / 그 외 → 회색(#EEEEEE) |
| 취소 탭 알림박스 | feedbackText → 취소 사유 표시 |
| 좌측 색상바 | 지연/임박·취소·보류 → 빨강(#FF1744) / 그 외 → 회색(#9E9E9E) |
| 메모 영역 | 업무관리 탭 + REPORTED~IN_PROGRESS 상태일 때만 노출 (27차 확정) |

---

## 📋 PM/QA 검토 요청 (답변 대기)

| # | 항목 | 질문 |
|---|---|---|
| 1 | ✅ 업무관리↔지연/임박 중복 표시 | 확정: 중복 포함 |
| 2 | ✅ 업무관리 COMPLETED 표시 | 확정: 미노출 |
| 3 | ✅ 메모 영역 노출 조건 | 확정: 업무관리 탭 한정 |
| 4 | 취소 사유 전용 필드 | feedbackText 사용 vs cancellationReason 별도 필드 |
| 5 | 후속 일감 생성 링크 동작 | 새 탭? 라우팅? 팝업? 정책 확정 필요 |
| 6 | REPORTED(보고됨) 긴급 변경 별도 버튼 | 현행 배정 하기와 연동 처리 중 — 별도 노출 필요한지 |

---

## 🔴 환경 규칙

| 규칙 | 내용 |
|---|---|
| filesystem MCP 허용 경로 | `/Users/grey/Desktop/local_grey`, `/Users/grey/Downloads` |
| bash 사용 불가 | 컨테이너 환경 |
| write_file로 큰 파일 쓸 때 | 타임아웃 위험 있음 → 가능하면 edit_file 사용, 불가시 write_file |
| **HANDOVER 업데이트 방식** | **edit_file로 변경된 부분만 교체할 것 — write_file로 전체 덮어쓰기 금지 (32차 교훈: 파일 잘림 + 불필요한 전체 재전송 발생)** |
| str_replace / edit_file 실패 시 | filesystem:write_file로 전체 교체 |
| HANDOVER 업데이트 | 세션 종료 시 묻지 않고 바로 업데이트 |
| **컨텍스트 75% 도달 시** | **즉시 HANDOVER 업데이트(edit_file) → 완료 항목·잔여 항목 정리해서 사용자에게 전달 → 사용자가 다음 세션에 전달하는 방식으로 이관** |
| keeper-admin.com | 운영 서버 — CRUD 원천 금지, 읽기 전용 |
| 검수 방식 | 디자인·BE·FE는 브라우저 직접 확인, PM·QA는 동시 진행 |
| 수정 완료 후 | Before/After 비교 표로 정리해서 보여줄 것 |
| 세션 중 버벅임 | write_file 대용량 시 발생 → 파일 잘림 주의, 반드시 tail로 완성 확인 |
| **한글 인코딩 이슈 (58차 신규)** | edit_file 실행 중 한글 포함 oldText 매칭 실패 시 → 아래 가이드 참고 |

#### 한글 인코딩 이슈 대응 가이드 (FE / BE / PM 공통, 58차 추가)

**증상**: `edit_file` 의 `oldText` 에 한글이 포함된 경우 `Could not find exact match` 에러 발생

**원인**: filesystem MCP 가 파일을 읽어올 때 일부 한글 문자가 다른 바이트로 변환되어 내부 표현과 불일치

**FE / BE 가이드 (코드 파일 `.tsx` `.ts` `.json`):**
1. `read_text_file` 로 해당 파일을 다시 읽어 정확한 raw 텍스트 확인
2. `oldText` 를 읽어온 텍스트에서 복사 — 절대 직접 타이핑 금지
3. 그래도 실패 시: 한글을 포함하지 않는 영어/숫자/기호만으로 구성된 고유한 앵커 라인 기준으로 `oldText` 범위를 넓혀 재시도
4. 모두 실패 시: `write_file` 로 전체 교체 (단, 파일 잘림 주의 — tail 로 완성 확인 필수)

**PM 가이드 (HANDOVER.md / POLICY.md 문서 파일):**
1. 위 1~3 동일 적용
2. `oldText` 를 영어·숫자·기호로만 이루어진 고유 라인 기준으로 설정하고, `newText` 에 해당 라인 + 추가 내용을 함께 작성
3. 한글 단어가 반드시 필요한 경우 → **영어 단어로 교체 가능** (예: `긴급 변경` → `urgentChange`, `완료` → `COMPLETED`)
4. 문서 전체를 교체해야 할 경우 `write_file` 사용 — HANDOVER.md 는 tail 검증 후 사용자에게 확인 요청

### 🔑 세션 시작 시 권한 확인 절차 (필수)

1. `filesystem:list_allowed_directories` 로 허용 경로 확인
2. 허용 경로에 필요한 디렉토리가 없으면 **즉시 사용자에게 알리고 중단**
3. **filesystem MCP 권한은 필요하면 모두 준다** — 경로 추가가 필요한 경우 사용자에게 요청하면 즉시 승인됨
4. 권한 오류(`Access denied`) 발생 시 작업 진행하지 말고 권한 요청 먼저
5. 세션 간 MCP 권한 상태는 유지되지 않을 수 있으므로 매 세션 시작마다 확인

### 📂 필수 참고 문서 경로

| 문서 | 경로 | 용도 |
|---|---|---|
| **HANDOVER (정본)** | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/HANDOVER.md` | 세션 인수인계 — 이 파일이 유일한 정본 |
| **정책 문서** | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/docs/POLICY.md` | 서비스 정책 전체 — 코드 작성 전 반드시 확인 |
| **공지 정책** | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/docs/POLICY_notice.md` | 공지사항 배너 정책 |
| **Claude Code 역할** | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/docs/CLAUDE_CODE_ROLE.md` | Claude Code 작업 범위 및 금지 파일 목록 |
| **Mock 가이드** | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts/docs/MOCK_GUIDE.md` | Mock 데이터 구조 및 수정 방법 |

> ⚠️ `/Users/grey/Downloads/HANDOVER.md` 는 정본이 아닙니다. 해당 파일이 있어도 무시하고 위 정본 경로를 사용할 것.

### 🚨 SVG 분석 및 역할별 맥락 규칙 (모든 세션 불변)

| 규칙 | 내용 |
|---|---|
| **SVG = 플로우 먼저** | SVG 전달 시 독립 케이스 vs 상태 전이인지 **먼저 판단** |
| **POLICY 우선** | 분석 전 POLICY.md 확인 — 이미 답이 있으면 미결로 올리지 않음 |
| **역할별 검토** | FE(코드 구조) + 디자인(비주얼 스펙) + BE(API 필요성) + PM(정책 부합) 항상 동시 검토 |
| **스타일 다르면** | 스타일 차이 = UX 의도적 구분 — 디자이너에게 미결 올리기 전에 맥락 확인 |

### 🚨 SVG / 대용량 자산 전달 규칙 (컨텍스트 초과 방지)

| 규칙 | 내용 |
|---|---|
| SVG 전달 단위 | **최대 3개/턴** — 한 번에 11개 절대 금지 |
| SVG 사전 확인 | 세션 초반 SVG를 보내야 할 때는 대화 먼저 최소화하고 새 세션 시작 후 즉시 전달 |
| SVG 전달 전 체크 | 현재 세션 길이가 길다면 **새 세션을 열고 SVG부터** 전달 |
| SVG 파일로 저장 | SVG를 직접 붙여넣기 대신 `/Users/grey/Desktop/local_grey/workspace/` 에 파일로 저장 후 filesystem으로 읽는 방식 권장 |

---

## 🗂 프로젝트 기본 정보

| 항목 | 내용 |
|---|---|
| 경로 | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts` |
| 포트 | **9004** |
| API Base | `https://indicator.11h.kr` |
| 피그마 (메인) | `https://www.figma.com/design/r8cvycY0ct22PNSPMjsyEg/-WEB-Indicator-v2.0-Design-Prep` |
| 피그마 (대시보드) | `https://www.figma.com/design/XzKoyOLnEceU5qyMQkOD9j/대시보드-개선` |

---

## ✅ 파일 상태

```
src/
├── types/dashboard.ts              ✅ 20차 — FeedFilter 'TASK' 추가
├── components/dashboard/
│   ├── FeedWidget.tsx              ✅ 62차 — NORMAL dueAt 동적 계산 (_normalOffsetMin 파라미터 추가)
│   ├── FeedCard.tsx                ✅ 62차 — 배지 flexWrap:'wrap' 복원 (중첩 버그 수정)
│   ├── IssueCard.tsx               ✅ 62차 — 배지 flexWrap:'wrap'+overflow:'visible' 통일 (FeedCard 정책)
│   ├── IssueWidget.tsx             ✅ 19차 — Phase 3 카드 미완
│   ├── ClaimWidget.tsx             ✅ 19차 — Phase 3 카드 미완
│   └── KpiCards.tsx                ✅ 62차 — 웹 2열 2×2 그리드, desktopCols prop 추가, applyTodayDates NORMAL 분기
├── app/(dashboard)/home/page.tsx   ✅ 62차 — KpiCards에 desktopCols prop 전달
└── mocks/
    └── feed.json                   ✅ 62차 — _dueAt_role legend NORMAL 항목 갱신
docs/
└── POLICY.md                       ✅ 62차 — §12-5 wrap 정책 갱신 / §14-4 BP 배치 / §15-1·3·4 확정 수치 / §15-5 mock dueAt 동적 계산
```

> KpiBoard.tsx — 32차 삭제 완료

---

## ⚠️ 미결 이슈

| 구분 | 이슈 | 우선순위 |
|---|---|---|
| FE | SVG 3 알림박스 1줄 ✅ 확인 완료 (29차) | — |
| FE | 카드 좌측 패딩 수정 ✅ (31차 완료) | — |
| FE | mock IN_PROGRESS+지연/임박 케이스 추가 ✅ (31차 완료) | — |
| FE | POLICY.md 27차 버튼 정책 동기화 ✅ (31차 완료) | — |
| FE | KpiBoard.tsx 삭제 ✅ (32차 완료) | — |
| FE | FeedCard 버그 A — `>` 버튼 색상 오류 수정 ✅ (33차 완료) | — |
| FE | ~~**이슈 #2: 메모 취소 버튼 잔존**~~ ✅ 54차 — Cmd+Shift+R 캐시 정리로 소멸 확인 | — |
| FE | ~~**이슈 #3: 완료 탭 feedbackText 박스 미노출**~~ ✅ 54차 — POLICY.md §12-13 '업무관리 탭 한정' 정책 확인, 정상 동작 | — |
| FE | ~~**버그: 업무관리 탭 ASSIGNED/BEFORE_START 긴급 변경 버튼 누락**~~ ✅ 55차 완료 | — |
| FE | ~~**버그: 취소/보류 feedbackText 번 알림박스+회색박스 중복 노출**~~ ✅ 56차 완료 — alertText isCancelled 분기 제거 | — |
| FE | **FeedCard 배지 잠림 버그 (61차 신규)** — overflow:visible로 수정했으나 토계상 35개 scrollWidth 초과 감지. 실제 시각적 잠림 여부 브라우저 직접 확인 필요. 원인: 배지행 컨테이너 너비 부족(좌우패딩 부족) 가능성 | 🔴 높음 |
| PM | ~~**POLICY.md §15 갱신**~~ ✅ 62차 완료 (17건/8건/3건 수치 반영) — §15-1(업무현황)·§15-3(미해결이슈)·§15-4(미확인클레임) 세부 직수 필요. §15-2는 61차 개정 완료 | 🟡 중간 |
| BE | **B23: completedAt 필드** — issues·claims COMPLETED 건에 실서비스 BE 제공 필요. 현재 `_TODAY_T..` 프로토타입 플레이스홀더 사용 중 | 🔴 높음 |
| FE | **FeedCard 버그 B — 완료 카드 feedbackText 박스 디자인 SVG 검수** | 🟡 중간 |
| FE | **FeedCard 버그 C — UI 깨짐 재현 케이스 확인** | 🟡 중간 |
| FE | ~~**탭 필터별 카드 노출 기준 검수**~~ ✅ 57차 완료 — 전체 탭 검수 완료 | — |
| FE | ~~**SVG 4 정의**~~ ✅ 45차 — 디자인 파일 검토 완료, 되돌리기=디자인 실수, 버튼=후속일감생성 확정 | — |
| FE | ~~**FeedCard.tsx 렌더링 마무리** — alertText 변수·whiteSpace·버튼색상 조건 수정~~ ✅ (46차 완료) | — |
| FE | ~~**POLICY.md §12-7 알림박스 우선순위 섹션** 추가~~ ✅ (46차 완료) | — |
| FE | **모바일 탭 카운트 하드코딩(7/2/1)** — Phase 3 완료 시 실제 카운트로 교체 필요 | 🟡 중간 |
| FE | **`page.tsx` 반응형 탭 전환 조건 미수정** — `desktopCols !== 2` 시 탭 레이아웃 분기 누락 | 🔴 높음 |
| FE | ~~**`FeedCard.tsx` `maxWidth: 600` 하드코딩**~~ ✅ 37차 제거 완료 | — |
| FE | **공간번호 검색 기능** — 도입 시 Empty UI 재사용 (POLICY § 6-7) | 🔴 높음 |
| FE | IssueWidget Phase 3 카드 구현 | 🔴 높음 |
| FE | ClaimWidget Phase 3 카드 구현 | 🔴 높음 |
| Design | P4: REPORTED/UNASSIGNED 긴급 변경 팝업 문구 확정 | 🔴 높음 |
| PM/Design | ✅ **웹 BP 대안 2 확정 (41차)**: MOBILE_BP=960, WEB_2COL_MIN_CHILDREN=848, Sub 자동닫힘 정책 확정 | — |
| FE | ✅ **대안 2 코드 구현 (42차)**: layout.tsx + page.tsx MOBILE_BP=960, Sub 자동닫힘 로직 구현 완료 | — |
| PM | **vw 1,062~1,220구간 UX 확인**: 현재 MOBILE_BP=1220으로 해당 구간에서 MobileHeader 노출 — 의돈된 UX인지 확인 필요 | 🔴 |
| PM/Design | **웹 3열 구간 존치 여부**: Sub 열림시 vw≥1,652px얼리야 3열 진입 — 현실적으로 사용 빈도 낙은 구간. 유지 여부 확인 필요 | 🿡 |
| PM | Q3: urgentCancel 팝업 확정 텍스트 | 🔴 높음 |
| PM | Q5: 후속 일감 생성 링크 동작 정책 | 🔴 높음 |
| PM | ✅ **Q6 확정 (50차)**: UNASSIGNED(미배정) 포함 배정 전 전 상태(REPORTED·UNASSIGNED)에서 긴급 변경 버튼 노출 — 이미 생성된 티켓에 긴급 여부 지정 기능 | — |
| BE | B1: urgentChange API 엔드포인트 | 🔴 높음 |
| BE | B2: forceComplete API 엔드포인트 | 🔴 높음 |
| BE | B3: 키퍼 수락 상태 구분 필드 | 🔴 높음 |
| BE | B4: cancellationReason 전용 필드 여부 | 🔴 높음 |
| BE | B6: keeperName / keeperPhone 제공 여부 | 🔴 높음 |
| BE | B7: 처리 후 앱 내 카드 노출/삭제 이벤트 구조 | 🔴 높음 |
| BE | B8~B11: unassign/start/cancelStart/cancelTicket API 엔드포인트 | 🔴 높음 |
| BE | B12: 신규 배지용 isCreatedToday 필드 | 🔴 높음 |
| BE | B13: NEW 배지 사용자 확인 처리 API | 🔴 높음 |
| BE | **B14: BE 알럿 문구 필드명** — alertMessages 실제 필드명 확정 필요 (현재 mock 임시 구조) | 🔴 높음 |
| BE | **B15: 운영자 입력 문구 필드명** — alertMessages 동일 배열 내 OPERATOR source 필드 확정 | 🔴 높음 |
| BE | ~~**B16: `completedAt` 필드**~~ ✅ 49차 확정 — `dueAt < 로케일 현재시각` FE 판단 방식으로 확정 | — |
| BE | **B17: 메모 저장 API** — 엔드포인트, HTTP method, payload, 응답 구조 미정 (50차 신규) | 🔴 높음 |
| BE | **B18: 이미지 업로드 API** — 파일 크기 제한, 허용 포맷, presigned URL 여부 미정 (50차 신규) | 🔴 높음 |
| BE | **B19: 배정하기 분기 필드** — 예약 가능/불가 구분 필드명·타입 확정 필요 (50차 신규) | 🔴 높음 |
| BE | **B20: 배정 해제 API** — `unassign` 엔드포인트·HTTP method + 해제 가능여부 검증 로직 포함 여부 + 실패 응답 구조(에러코드/메시지) 미확정 (51차 신규) | 🔴 높음 |
| BE | **B21: `assignedAt` 필드** — ASSIGNED 카드 헤더 시간 표시용. 배정 완료 시각 필드명·타입 확정 필요. 미확정 시 `scheduledAt` 임시 사용 (51차 신규) | 🔴 높음 |
| BE | **B22: `startedAt` 필드** — IN_PROGRESS 카드 헤더 시간 표시용. 수행 시작 시각 필드명·타입 확정 필요. 미확정 시 `scheduledAt` 임시 사용 (52차 신규) | 🔴 높음 |
| PM | **Q-A: 신규 배지 정의** — `UNASSIGNED` 상태값 자체 vs 오늘 생성(isCreatedToday) 중 단일 기준 확정 필요 | 🔴 높음 |
| PM | **Q-B: 배정하기 분기 BE 필드** — 예약 가능/불가 일감 구분 필드 B19와 연비 | 🔴 높음 |
| PM | **Q-C: 업무 취소 팝업 문구 확정** — FE 임시 반영됨 (⚠️ Q-C 임시): title=`일감을 취소하시겠습니까? (⚠️ Q-C 임시)` / contents=`취소된 일감은 복구할 수 없으며 어드민에서 삭제됩니다.` — PM 최종 확정 대기 | 🟡 중간 |
| PM/BE | **Q-D: 모달-대시보드 동기화 범위·방식** — 모달 CRUD 후 갱신 데이터 범위 + WebSocket vs API 재호출 여부 (B7 연계) | 🔴 높음 |

---

## 🤝 Claude Code 역할 분리

**작업 가능:** `src/components/dashboard/` 새 파일 및 FeedWidget·FeedCard·IssueWidget·ClaimWidget 수정

**절대 금지:** `docs/POLICY.md`, `src/stores/authStore.ts`, `src/utils/`, `DashboardHeader.tsx`, `RoomGroupSelector.tsx`, `RoomGroupBottomSheet.tsx`, `KpiCards.tsx`, `HANDOVER.md`
