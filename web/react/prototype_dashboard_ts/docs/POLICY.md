# 📋 prototype_dashboard_ts — 서비스 정책 문서
> 작성일: 2026-03-19 | 최종 업데이트: 2026-03-31 (71차) | 이 문서는 각 세션에서 확정된 정책의 단일 참고 소스입니다.
> 코드 주석과 병행 관리 — 정책 변경 시 이 파일과 해당 파일 주석을 함께 수정할 것.

---

## 한눈에 보는 목차

> 섹션 번호를 Cmd+F(Mac) / Ctrl+F(Win)로 검색하면 빠르게 이동할 수 있습니다.

| 섹션 | 내용 | 주요 참조 대상 |
|---|---|---|
| §1~2 | 서비스 구조 개요 / RBAC 역할 체계 | BE 연동 시 |
| §3 | 반응형 레이아웃 정책 (BP·그리드·Sub 자동닫힘) | FE / PM |
| §4~5 | 위젯 보이기 정책 / 전화 로채 | FE / 디자인 |
| §6 | Empty UI 정책 | FE / 디자인 |
| §7~11 | 필터 탭 / 우선순위 / 일감 / 코어 로그인 | FE / BE |
| §12 | **피드 카드 액션 정책** (핵심 — Claude Code 필독) | FE / 디자인 / PM |
| §13~14 | 위젯별 컨텐츠 정책 / KPI 집계 정책 | FE / PM |
| §15 | KPI 확정 수치 (mock 기준) | PM / QA |
| §18 | 65·66차 확정 정책 (배포·배지·ConfirmModal·탭카운트·버그수정) | FE / PM |
| §19 | 67·68차 확정 정책 (상태값 전면 교체 — TicketStatus/IssueStatus/ClaimStatus) | FE / BE |

> **Claude Code 개발자 필독**: §12 섹션(피드 카드 액션 정책)을 반드시 먼저 확인 후 구현을 시작할 것.
> 미결 BE 항목(B1~B23)은 BE 응답 대기 중이며, Claude Code가 임의로 구현하지 않습니다.

---

## 1. 서비스 구조 개요

### 1-1. 공간 계층 구조
```
워크스페이스 (사업자/운영 업체 단위, 예: 그레이 테스트 1)
  └─ 지점 그룹 / 브랜드 (운영 브랜드 단위, 예: 그레이 호텔, 그레이 모텔)  ← 신규
       └─ 지점 (공간 그룹 — 하나의 물리적 운영 단위, 예: 강남점, 부산점)
            └─ 공간 타입 (스탠다드룸, 트윈 등)
                 └─ 공간 (객실, 로비 등 — 일감 대상 물리적 장소)
                      └─ 구역 (세부 공간 — 침실, 욕실, 거실 등)
```

**워크스페이스 역할**: 실제 지점을 관리하는 업체 단위. 지점 그룹(브랜드)과 하위 지점을 포함.

**지점 그룹(브랜드) 계층 — mock 데이터 기준**
```
그레이 테스트 1 (workspaceId: WORK01...X2)
  ├─ 그레이 호텔 (brandId: BRAND01...X1)
  │    ├─ 강남점  (roomGroupId: RG01...X1)
  │    ├─ 역삼점  (roomGroupId: RG01...X2)
  │    └─ 홍대점  (roomGroupId: RG01...X3)
  └─ 그레이 모텔 (brandId: BRAND01...X2)
       ├─ 부산점  (roomGroupId: RG01...X4)
       ├─ 강릉점  (roomGroupId: RG01...X5)
       └─ 안양점  (roomGroupId: RG01...X6)
```

> **[BE 연동 가이드]** 지점 그룹(RoomBrand) 계층은 현재 mock 전용.
> 실 API 확인 후 `fetchRoomBrands()` 함수만 교체하면 전체 연동 완료.

### 1-2. RBAC 역할 체계
| 키 | 명칭 | 접근 범위 |
|---|---|---|
| `HEADQUARTER` | 열한시 계정 | 모든 워크스페이스 무제한 |
| `SUDO` | 소유주 | 본인 소유 워크스페이스 전체 |
| `ADMIN` | 총괄 관리자 | 배정된 워크스페이스 전체 |
| `MANAGER` | 관리자 | 배정된 공간 그룹(지점)만 |
| `NONE` | 승인 대기 | 접근 불가 (로그인 차단) |

**핵심:** ADMIN/MANAGER는 서버에서 접근 가능한 지점만 `roomGroups`에 담아 내려줌.
프론트에서 별도 권한 분기 없이 `authStore.roomGroups`를 그대로 렌더링하면 자동으로 범위가 제한됨.

### 1-3. 지점 접근 권한 유형 (3가지)
```
유형 1. 워크스페이스 전체 접근
  → 모든 브랜드 + 모든 지점 노출 (HEADQUARTER / SUDO / ADMIN)

유형 2. 브랜드(지점 그룹) 하위 전체 접근
  → 특정 브랜드 + 소속 지점 전체 노출 (일부 ADMIN / MANAGER)

유형 3. 브랜드 하위 일부 접근
  → 특정 브랜드 헤더 + 서버가 허용한 지점만 노출 (MANAGER)
```
프론트 구현 원칙: 서버가 내려준 `roomBrands` + `roomGroups` 목록을 그대로 렌더링.
권한 분기 로직은 서버 책임, 프론트는 수신된 데이터만 표시.

### 1-4. 지점 접근 권한과 메모 연계 정책
> ⚠️ Phase 4 메모 구현 시 반드시 참고

- **메모 작성 권한**: 해당 지점에 접근 인가된 사용자만 해당 지점 일감에 메모 작성 가능
- **메모 열람 권한**: 동일 지점 접근 인가를 가진 모든 사용자가 해당 지점 메모 열람 가능
- **메모 이력 관리**: 같은 일감에 대한 서로 다른 사용자의 메모는 **저장 시각 기준** 시간순 이력 관리
  - 필수 보존 정보: 작성자(staffId + name) + 저장 시각(timestamp)
  - 수정 시에도 최초 작성 시각 보존, 수정 시각 별도 기록
- **메모 구현 시 추가 확인 항목** (Phase 4 진입 시 논의):
  - 메모 수정 권한 범위 (본인만 vs 상위 권한 포함)
  - 메모 삭제 가능 여부
  - 확인 처리 트리거 (열람 자동 vs 명시적 클릭)

---

## 2. UX Writing 정책

### 2-1. 서비스 용어집 기준 (개선 용어 적용)
> 출처: https://11oclock.atlassian.net/wiki/spaces/KM/pages/178552862

| 영역 | 기존 용어 | **개선 용어** | 적용 위치 |
|---|---|---|---|
| 공간 | 공간 그룹 | **지점** | 탭 label, 버튼명, 패널 헤더 전체 |
| 공간 | 세부 공간 | **구역** | 일감 상세 표시 |
| 일감 상태 | 접수 | **보고됨** | 피드 상태 배지 |
| 일감 상태 | 대기 | **미배정** | 피드 상태 배지 |
| 일감 상태 | 배정 | **배정됨** | 피드 상태 배지 |
| 일감 상태 | 예약 | **수행전** | 피드 상태 배지 |
| 일감 상태 | 수행 | **수행중** | 피드 상태 배지 |
| 일감 | 업무 | **일감** | 모든 UI 텍스트 |
| 일감 | 업무 도안 | **일감 결과표** | 설정 메뉴 |
| 일감 | 할일 | **체크리스트** | 일감 상세 |
| 일감 | 긴급 | **우선 수행 요청** | KPI 카드, 피드 배지 |
| 시간 | 예약 마감 시간 | **완료 기한** | 피드 카드 시간 표시 |
| 메뉴 | 공간 그룹 관리 | **지점 관리** | SubSidebar 메뉴명 |
| 메뉴 | 실시간 | **관제** | GNB tooltip, SubSidebar |

### 2-2. 코드 내 식별자 vs UI 표시 원칙
- **코드 변수명, API 파라미터**: 기존 유지 (`roomGroupId`, `roomGroupName`, `BEFORE_START` 등)
- **UI 텍스트 (label, placeholder, 버튼명)**: 반드시 개선 용어 사용

### 2-3. 현재 적용된 개선 vs 미적용 항목
| 위치 | 항목 | 상태 |
|---|---|---|
| `DashboardHeader` 액션 버튼 | "공간 그룹 선택" → "지점 선택" | ✅ 적용 |
| `MobileHeader` 드로어 | "공간 그룹 선택" → "지점 선택" | ✅ 적용 |
| 지점 선택 패널 헤더 | "공간 선택" → "지점 선택" | ✅ 적용 |
| 지점 선택 검색 placeholder | "공간 그룹 검색" → "지점 검색" | ✅ 적용 |
| 피드 컴포넌트 상태 배지 | 보고됨/미배정 등 | Phase 3에서 적용 |
| KPI 카드 | "업무 현황" → "일감 현황" | Phase 2에서 적용 필요 |
| 메모 남기기 | "완료된 메모 숨기기" → "확인된 메모 숨기기" | 메모 구현 시 적용 |

---

## 3. 반응형 정책

### 3-1. 핵심 수치 (확정)
| 항목 | 값 | 근거 |
|---|---|---|
| 디자인 기준 해상도 | 1,920px | 피그마 원본 |
| 모바일 최소 가로 | 375px | 피드 컴포넌트 1개 full-width |
| 피드 컴포넌트 단위 너비 | **327px** | 375 − padding(24×2) |
| 콘텐츠 좌우 패딩 (데스크탑) | 24px (`p-6`) | `layout.tsx` |
| 콘텐츠 좌우 패딩 (모바일) | 16px (`p-4`) | 피그마 모바일 스펙 |
| 컴포넌트 간 gap | 16px (`gap-4`) | `home/page.tsx` |
| **모바일 전환 기준 (MOBILE_BP)** | **960px** | 웹 위젯(416px)×2 + gap(16) + GNB(64) + PAD(48) = 960 — **사이드바는 BP 기준에 포함하지 않음** (41차 확정) |
| **웹 2열 최소 칠드런 (WEB_2COL_MIN_CHILDREN)** | **848px** | 웹 위젯(416px)×2 + gap(16) = 848 — Sub 열릴 때 칠드런<848이면 Sub 자동 닫힘 (대안 2) |
| **1열+탭 전환 기준 (SINGLE_COL_BP)** | **717px** | 모바일 위젯(327px)×2 + gap(16) + pad(48) = 718 ≈ 717 — 모바일 2열 최소 vw |
| **웹 1열(3개) 기준 (MIN_1COL_CHILDREN)** | **1,280px** | 칠드런 기준 — 38차 확정 |
| **웹·모바일 2열 기준 (MIN_2COL_CHILDREN)** | **685px** | 칠드런 기준 — SINGLE_COL_BP(717) - PAD_MOBILE(32) = 685 |
| **웹 탭 없음** | 칠드런 상관없이 웹은 항상 그리드 | 38차 확정 — 웹(isMobile=false)에는 탭 없음 |
| **COMP_MIN_W** | **416px** | 32차 SVG 원본 역산 (1280-32)÷3 |
| **FeedWidget paddingRight** | **24px** (모바일 16px) | 33차 SVG 원본 실측 |
| **필터탭 gap** | **8px** | 33차 컨테이너 339px 기준 실측 |
| **필터탭 비활성 paddingBlock** | **4px** | 33차 터치 타겟 32px 확보 |
| **필터탭 카운트 상한** | **99+** | 33차 POLICY §12-5 확정 |

> ⚠️ **좌측 모두 실측 기반 확정값**. 코드 수정 시 임의로 바꾸지 말 것. 바꾸려면 해당 차수와 근거를 명시.

### 3-7. 탭 레이아웃 전환 정책 (40차 확정)

> **탭 전환 조건** — 두 가지 중 하나 충족 시 탭으로 전환:
> 1. `isSingleColumn` — vw ≤ 717px (단독으로 탭 보장)
> 2. `isMobile=true && desktopCols===1` — 모바일 상태(vw≤960px)에서 칠드런 < 685px
>
> **핵심: 웹(isMobile=false)에는 절대 탭 없음.**
> 웹 구간에서 칠드런이 얼마나 좌욕아도(< 1,020px)도 그리드 2열 유지.
> `page.tsx` 탭 전환 코드: `isSingleColumn || (isMobile && desktopCols === 1)`

#### 세그먼트 탭 디자인 스펙 (SVG 원본 기준)
| 항목 | 활성 탭 | 비활성 탭 |
|---|---|---|
| 배경 | `#212121` | `white` |
| 텍스트 색 | `white` | `#757575` |
| 텍스트 크기 | 12px, weight 500 | 12px, weight 500 |
| 카운트 배지 배경 | `white` | `#F5F5F5` |
| 카운트 배지 텍스트 | `rgba(0,0,0,0.87)` | `rgba(0,0,0,0.87)` |
| 탭 전체 높이 | 40px | 40px |
| 테두리 | 없음 | `#E0E0E0` 상/하/우 1px |
| 좌측 첫 탭 | borderRadius 8px (좌측) | 동일 |
| 우측 끝 탭 | borderRadius 8px (우측) | 동일 |

#### 탭 항목 (3종, 36차 확정)
- **변경사항 피드 / 처리필요 / 클레임** (3개 탭 균등 배분)
- FeedWidget은 더 이상 탭 위 상단 고정 노출하지 않음 → `feed` 탭 콘텐츠로 통합
- 탭 전환 state: `singleColTab: 'feed' | 'issue' | 'claim'`
- 기본 선택 탭: `feed`

#### ⚙️ FE 주의사항
- 탭 카운트: 각 위젯 ALL 필터 기준 총 카드 수 (65차 실시간화 완료 — §18-4 참고)
- 탭 전환 조건: `isSingleColumn || (isMobile && desktopCols===1)`
- **웹(isMobile=false)에는 절대 탭 없음** — 코드 수정 시 반드시 확인

#### 📋 PM
- 탭 순서: 변경사항 피드 → 처리필요 → 클레임

---

### 3-8. 위젯 배치 정책 (38차 확정)

> **칠드런** = 그리드 컨테이너 너비 (vw − GNB − Sub − PAD)
> 웹: `vw - GNB(64) - Sub(260 or 0) - PAD_DESKTOP(48)` / 모바일: `vw - PAD_MOBILE(32)`

#### 열 수 결정 기준 (40차 확정)
| 구간 | 조건 | 열 수/레이아웃 |
|---|---|---|
| 웹 3열 (나란히) | isMobile=false + 칠드런 ≥ 1,280px | **독립 flex 3컬럼** |
| 웹 2열 | isMobile=false + 칠드런 < 1,280px | **독립 flex 2컬럼 (좌:1번→3번 / 우:2번→4번)** |
| 모바일 2열 | isMobile=true + 칠드런 ≥ 685px (vw 718~960px) | **독립 flex 2컬럼** |
| 모바일 1열+탭 | isMobile=true + (칠드런 < 685px 또는 vw ≤ 717px) | **세그먼트 탭 3종** |

- `alignItems: start` 유지 — 위젯 높이 달라도 상단 정렬
- 최대 카드 노출 수: Feed=4개, Issue=3개, Claim=3개 (§ 6-3)
- 탭 구간: 최대 카드 수 제한 없이 전체 노출
- **웹에는 절대 탭 없음** — 칠드런 얼마에 관계없이 그리드 유지

---

### 3-2. Breakpoint 구간 (40차 확정)

> **BP 도출 원칙**: 위젯 1개 콘텐츠가 깨지지 않는 최소 너비를 기준으로 계산
> - 웹 위젯 최소: **416px** (필터탭 1행 유지, 카드 상태값~업무상세 1행 보장)
> - 모바일 위젯 최소: **327px** (375px - 패딩48 = 327, 아이폰SE 기준 줄바꿈 없음)

| 구간 | vw 범위 | 조건 | 레이아웃 |
|---|---|---|---|
| A — 웹 3열 | > 960px + 칠드런≥1,280 | isMobile=false + 칠드런≥1,280px | TopBar+GNB+Sub + **독립 flex 3컬럼** |
| B — 웹 2열 | > 960px + 칠드런<1,280 | isMobile=false + 칠드런<1,280px | TopBar+GNB+Sub + **독립 flex 2컬럼** |
| C — 모바일 2열 | 718~960px | isMobile=true + 칠드런≥685px | MobileHeader + **독립 flex 2컬럼** |
| D — 모바일 1열+탭 | 375~717px | isMobile=true + (칠드런<685 또는 vw≤717) | MobileHeader + **세그먼트 탭 3종** |
| — 미대응 | < 375px | — | 레이아웃 잘림 |

> 웹에는 탭 없음. 탭은 D 구간(isMobile=true)에서만 발동.

> ⚠️ **BP 수정 시 반드시 연관 맥락 전체 검토**:
> SINGLE_COL_BP ↔ MIN_2COL_CHILDREN ↔ MOBILE_BP ↔ 위젯 1개 최소 너비(웹/모바일)는 서로 연동된 값.
> 하나를 바꾸면 나머지 전체를 재계산해야 함.

### 3-3. 모바일 모드 (≤ 960px) 구조
```
┌─────────────────────────────────┐
│ MobileHeader                    │ ← 흰색 56px
│  [대시보드]          [≡ 햄버거] │
├─────────────────────────────────┤
│ MobileHeader 탭 영역            │ ← 지점 탭 (paddingLeft 16px)
│  전체 | 강남점 | 역삼점 ...     │
├─────────────────────────────────┤
│ 콘텐츠 (padding 16px)           │
└─────────────────────────────────┘
```

**햄버거 클릭 시 드로어 (우측 슬라이드, width 280px):**
4개 액션 버튼을 리스트 형태로 표시 — 미확인 건 찾기 / 지점 선택 / 메모 남기기 / 위젯 설정

### 3-5. 반응형 정책 변경 히스토리

| 차수 | 변경 내용 | 근거 |
|---|---|---|
| 40차 | `MOBILE_BP` 1,061 → 1,220 | Sub 열린 상태 포함해 vw 기준으로 위젯 416px 보장 |
| 41차 | `MOBILE_BP` 1,220 → **960** | 사이드바는 BP 기준에 포함하지 않음 — 칠드런만 기준 (960 = 416×2+16+64+48) |
| 41차 | `WEB_2COL_MIN_CHILDREN = 848` 신규 추가 | Sub 열릴 때 칠드런<848이면 Sub 자동 닫힘(대안 2) |
| 41차 | `<main>` DOM 실측 방식 확정 | sidebarOpen Context 타이밍 문제 해소 — DOM에서 직접 실측 |

### 3-4. 반응형 감지 방식
- `layout.tsx`: `ResizeObserver` → `isMobile` state → TopBar/GNB/SubSidebar vs MobileHeader 스위칭
- `home/page.tsx`: `<main>` DOM ResizeObserver로 칠드런 실측 — sidebarOpen 상태 무관, 실제 너비 즉시 반영
- 모바일 전환 시 `sidebarOpen` 강제 false, 데스크탑 복귀 시 이전 상태 복원 (`lastDesktopSidebarRef`)
- **웹 구간 Sub 자동 닫힘 (41차 대안 2 확정)**: Sub 열릴 때 칠드런 < 848(WEB_2COL_MIN_CHILDREN)이면 Sub 자동 닫힘, 사용자 의도(열림) 기억 후 칠드런 ≥ 848 회복 시 자동 복원

---

## 4. 레이아웃 구조 (확정)

### 4-1. 데스크탑 AppShell
```
┌─────────────────────────────────────────────────┐
│               TopBar (검정, 64px)                │ ← 계정 레이어
├──────┬──────────┬──────────────────────────────┤
│ GNB  │   Sub    │  DashboardHeader             │
│ 64px │ Sidebar  │  (타이틀 + 탭 + 액션버튼)    │
│      │  260px   │──────────────────────────────│
│      │          │  콘텐츠 영역 (p-6)            │
│      │          │  Phase 2: KPI 카드            │
│      │          │  Phase 3: 필터 레이아웃 3종   │
└──────┴──────────┴──────────────────────────────┘
```

### 4-2. DashboardHeader 스펙 (피그마 기준 확정)
- **컨테이너**: paddingTop 24, paddingLeft/Right 24, gap 24 (타이틀↔탭 간격)
- **타이틀**: fontSize 24, fontWeight 700, lineHeight 32.02px, letterSpacing 0.20px
- **타이틀 행 height**: 36px
- **탭 버튼**: paddingTop/Bottom 9, paddingLeft/Right 16
- **탭 텍스트**: fontSize 14, fontWeight 500, lineHeight 24px, letterSpacing 0.20px
- **탭 활성**: color `#1976D2` (피그마 --primary-main), 하단 2px solid
- **탭 비활성**: color `rgba(0,0,0,0.60)`
- **탭 구분선**: height 1px, background `rgba(0,0,0,0.12)`

### 4-3. MobileHeader 스펙 (피그마 기준 확정)
- **높이**: 56px
- **배경**: #FFFFFF
- **타이틀**: fontSize 20, fontWeight 700, lineHeight 32px, letterSpacing 0.20px, color: black
- **padding**: left 16, right 16
- **햄버거 버튼**: padding 5px, borderRadius 100px
- **탭 영역**: height 46px, position relative, 탭 left 16 top 4 (absolute)
- **탭 letterSpacing**: 0.40px (모바일 기준)

---

## 5. 탑 뷰 액션 버튼 4개 정책

> **구현 일정 (확정)**
> | 기능 | 구현 시점 |
> |---|---|
> | **지점 선택** | ✅ 구현 완료 (12차) |
> | 미확인 건 찾기 | Phase 3 (피드 레이아웃) 완료 후 제안 |
> | 위젯 설정 | Phase 3 완료 + PM 저장 위치 확정 후 제안 |
> | 메모 남기기 | Phase 3 완료 + Phase 4(CRUD) 진입 시점에 제안 |

### 5-1. 미확인 건 찾기
**기능 정의 (65차 PM 확정):** 전체 위젯 중 NEW 배지가 붙은 카드만 필터링해서 노출하는 필터 기능.

- **동작**: 토글 방식 (on → NEW 배지 카드만 / off → 전체 카드)
- **현재 상태**: 미개발 — Phase 3 개발 시 진행
- **아이콘**: SearchFilled (MUI)
- **모바일**: 햄버거 드로어 내 리스트 항목

**⏸ 구현 보류 — Phase 3 피드 레이아웃 완료 후 제안 예정**

### 5-2. 지점 선택 (원본명: 공간 그룹 선택)
**✅ 구현 완료 (2026-03-23, 12차)**

#### 드롭다운/바텀시트 계층 구조
```
[지점 그룹 헤더]  그레이 호텔 (3)
  ☑ 강남점
  ☐ 역삼점
  ☐ 홍대점
[지점 그룹 헤더]  그레이 모텔 (3)
  ☐ 부산점
  ...
```

#### 선택 반영 트리거 (확정)
| 트리거 | 동작 |
|---|---|
| 체크박스 선택 후 **1.5초 디바운스** | selectedRoomGroupIds 자동 반영, 드롭다운 유지 (웹) |
| 드롭다운 **외부 클릭** | 즉시 반영 후 드롭다운 닫힘 (웹) |
| **적용** 버튼 클릭 | pendingIds → selectedRoomGroupIds 반영 + 닫기 (모바일) |
| **취소** / X / dimmer 클릭 | 변경 없이 닫기 (모바일) |

#### 검색 인풋박스 동작 (확정)
| 조건 | 동작 |
|---|---|
| 입력 후 **1초 디바운스** | 결과 필터링 적용 |
| **지점 그룹명** 검색 | 해당 그룹 헤더 + 소속 지점 전체 노출 |
| **지점명** 검색 | 매칭 지점만 노출, 그룹 내 결과 없으면 그룹 헤더 숨김 |
| 결과 **없음** | "검색 결과가 없습니다" 메시지 |
| 검색어 **전체 삭제** | 전체 목록 복원 |
| 입력 가능 문자 | 한글(자모 초성 포함)/영문/숫자/특수문자 |
| 최대 입력 | **10자** |

#### Top Bar 탭 정책 (확정)
| 상태 | 역할 |
|---|---|
| `selectedRoomGroupIds` | 드롭다운/바텀시트의 **필터** — 어떤 지점들을 볼지 범위 결정 |
| `activeTabGroupId` | Top Bar 탭의 **단일 전환** — 현재 보는 단위(전체 vs 특정 지점) 결정 |

탭 목록 렌더링 규칙:
| 지점 선택 상태 | 탭 표시 |
|---|---|
| `selectedRoomGroupIds = []` (디폴트) | 인가받은 전체 지점 탭 표시 |
| `selectedRoomGroupIds = [A, B]` | 선택된 지점만 표시 (`전체 \| A \| B`) |

- **"전체" 탭은 항상 첫 번째, 제거 불가**
- 지점 선택 변경 시 `activeTabGroupId` 자동 `null` 리셋 (authStore에서 처리)

### 5-3. 메모 남기기
**⏸ 구현 보류 — 계정 인가 관련 세부 정책 확정 후 개발 (Phase 3+4 완료 시점)**

### 5-4. 위젯 설정
**⏸ 구현 보류 — Phase 3 완료 + PM 저장 위치 확정 후 제안 예정**

---

## 6. 필터 레이아웃 높이 정책 (19차 확정)

> Claude Code가 필터 레이아웃 3종(FeedWidget / IssueWidget / ClaimWidget) 구현 시
> 반드시 이 섹션을 기준으로 삼을 것.

### 6-1. 구성 요소 정의
```
필터 레이아웃
├─ 외곽 (컨테이너)
├─ 내부 컴포넌트 (헤더 영역: 타이틀, 필터 탭 등)
└─ 카드 리스트 (실제 일감 카드들)
     └─ 카드 (개별 일감 단위 — 높이 가변)
```

### 6-2. 카드 높이 가변 요인
각 카드의 높이는 다음 요인에 따라 다름. **고정 픽셀 기준 maxHeight 사용 금지.**
- 이미지 그리드 유무 (없음 / 1장 170px / 2장 100px / 3장 240px)
- 알림 박스(feedbackText) 유무
- 메모 영역 유무 (ticketStatus별 분기)
- 배지 수에 따른 헤더 줄바꿈

### 6-3. 최대 노출 카드 수 (웹 기준)
| 레이아웃 | 최대 노출 카드 수 |
|---|---|
| 변경사항 피드 (FeedWidget) | **4개** |
| 처리 필요 (IssueWidget) | **3개** |
| 클레임 (ClaimWidget) | **3개** |

### 6-4. 외곽(컨테이너) 높이 동작 규칙
| 상황 | 외곽 높이 | 카드 리스트 동작 |
|---|---|---|
| 카드 수 ≤ 최대 노출 수 | **자연 높이** — 마지막 카드 하단 + 패딩만큼만 | overflowY: visible (스크롤 없음) |
| 카드 수 > 최대 노출 수 | **고정** — 첫 n개 카드 실제 높이 합산으로 결정 | overflowY: auto (내부 스크롤) |
| 모바일 | 높이 제한 없음 | 제한 없음 |

**핵심**: 외곽 높이는 첫 n개 카드의 **실제 렌더 높이**로 결정됨.
카드가 가변 높이이므로 고정 픽셀 값이 아닌 DOM 측정(ResizeObserver)으로 산출.

### 6-5. 구현 방식 (확정)
```
1. 카드 전체를 렌더 (opacity: 0으로 숨김)
2. ResizeObserver로 컨테이너 + 각 카드 자식 감시
3. 카드 수 > MAX_VISIBLE_CARDS 이면:
   - 첫 n개 카드 getBoundingClientRect().height 합산
   - gap * (n-1) + 상하 패딩(16+16) 추가
   - 산출값을 maxHeight로 적용
4. maxHeight 확정 후 opacity: 1 전환 (깜빡임 방지)
5. 이미지 로딩 등 높이 변화 발생 시 자동 재측정
```

### 6-6. 페이지 스크롤 정책
- `home/page.tsx` 콘텐츠 래퍼: `overflowY: auto`, `flex: 1`
- 위젯 3개의 합산 높이가 뷰포트를 초과할 경우 **페이지 레벨 스크롤** 발생
- **두 단계 스크롤 구조**:
  1. 페이지 스크롤 — 위젯 간 이동
  2. 위젯 내 스크롤 — 카드 초과분 접근

---

## 6-7. 필터 레이아웃 — 카드 없음(Empty) 상태 정책 (34차 확정)

> **모든 세션 불변. FE·디자인·PM·BE 역할 모두 이 섹션을 숙지할 것.**

### 적용 대상
- 변경사항 피드 (FeedWidget) / 처리 필요 (IssueWidget) / 클레임 (ClaimWidget) — 3종 공통
- 특히 **변경사항 피드의 공간번호 검색 기능** (예: `201호`) 도입 예정 시,
  검색 조건에 해당하는 카드가 없는 경우에 이 정책을 사용한다.

### Empty 상태 UI 규칙

| 항목 | 규칙 |
|---|---|
| 안내 문구 | `"조회된 일감이 없습니다."` |
| 문구 위치 | 카드 영역 수직/수평 중앙 |
| 문구 스타일 | fontSize 14, color `rgba(0,0,0,0.38)` |
| 하단 여백 | 브라우저(뷰포트) 하단 기준 **40px 마진** — 위젯이 뷰포트 하단까지 늘어나지 않도록 |
| 배경 | 흰색 유지 (위젯 외곽 배경과 동일) |

### 반응형 카드 영역 상/하단 마진

| 열 수 | 카드 영역 상/하단 마진 |
|---|---|
| 3열 (desktopCols = 3) | 상·하 각 **200px** |
| 2열 (desktopCols = 2) | 상·하 각 **200px** |
| 1열 / 모바일 | 상·하 각 **40px** |

### 위젯 높이 동작 (카드 없음 시)
- 카드 없음 상태에서도 위젯 외곽은 `alignItems: start` 그리드 기준 **자연 높이**로 수축
- 뷰포트 하단 40px 마진은 위젯 내부 paddingBottom이 아닌,
  **page.tsx 콘텐츠 래퍼의 paddingBottom(40px)** 으로 이미 보장됨 (데스크탑 기준)
- 별도 min-height 고정 금지 — 위젯 높이는 항상 콘텐츠 기준

### 역할별 체크리스트

#### 🎨 디자인
- [ ] Empty 상태 전용 디자인 미확정 → 현행 정책(문구 중앙 배치)으로 임시 운영
- [ ] 추후 Empty 일러스트/아이콘 추가 시 이 섹션 업데이트 필요

#### ⚙️ FE
- [x] `filteredTickets.length === 0` 분기로 Empty UI 렌더
- [x] 열 수(`desktopCols`) prop을 위젯에 전달하여 마진 분기
- [ ] 공간번호 검색 기능 도입 시 동일 Empty UI 재사용

#### 📋 PM
- **공간번호 검색 연계**: 변경사항 피드에 공간번호(예: `201호`) 검색 필터 도입 예정.
  검색 결과 없음 = 이 Empty 정책 그대로 사용. 별도 Empty 문구 불필요.
- 검색 기능 도입 시점, UX 확정 후 이 섹션에 반영할 것.

#### 🔴 BE
- 공간번호 검색 API 파라미터 예상: `roomName` 또는 `roomKeyword` (쿼리 필터)
  ```
  GET /page-dashboard/v1/ticket-reports?roomKeyword=201호&...
  ```
- 검색 결과 없음 시 BE는 `content: []` + `totalElements: 0` 반환 — FE Empty 처리 자동 적용
- 실제 파라미터명/형식은 BE 확정 후 이 문서에 기재할 것

---

## 7. 개발 순서 (확정)

```
Phase 1  웹 프레임                              ← ✅ 완료
Phase 2  집계 컴포넌트 (KPI 카드)               ← ✅ 완료 (18차)
         └─ KPI 카드 4종 피그마 기준 구현
         └─ 지점 필터 버그 수정
Phase 3  필터 레이아웃 1·2·3                    ← 🟡 진행 중 (23차)
         └─ 높이 정책 확정 (§ 6 참고)
         └─ FeedWidget 높이 정책 구현 완료
         └─ IssueWidget / ClaimWidget 높이 정책 구현 완료 (Phase 3 카드 구현 예정)
         └─ FeedCard 정책 미적용 항목 (UX Writing, 상태 배지) 잔여
Phase 4  CRUD (사진·텍스트)

[Phase 3 완료 후 제안]
         └─ 미확인 건 찾기
         └─ 위젯 설정 (PM 저장 위치 확정 병행)
[Phase 3+4 완료 후 제안]
         └─ 메모 남기기
```

---

## 8. 미결 이슈 목록

| 구분 | 이슈 | 우선순위 |
|---|---|---|
| FE | FeedCard UX Writing·상태 배지 정책 미적용 | 🔴 높음 |
| FE | IssueWidget Phase 3 카드 구현 | 🔴 높음 |
| FE | ClaimWidget Phase 3 카드 구현 | 🔴 높음 |
| FE | KpiBoard.tsx 삭제 (KpiCards.tsx로 완전 교체) | 🟡 중간 |
| FE | FE-R5: KpiCards any 타입 → IssueReport[]/ClaimReport[] 교체 | 🟡 중간 |
| FE | FE-R6: applyTodayDueAt 중복 구현 → 공통 유틸 분리 | 🟡 중간 |
| FE | FE-R7: desktopCols 반응형 탭 전환 분기 누락 | 🟡 중간 |
| BE | TicketStatus 8단계 확장 — BE와 최종 협의 필요 | 🔴 높음 |
| BE | keeperName / keeperPhone 프로토타입 확장 필드 — BE 제공 여부 확인 | 🔴 높음 |
| BE | photoUrls → PhotoSource[] 전환 — BE 연동 시 처리 | 🟡 중간 |
| BE | IssueReport.issueStatus 대시보드 전용 확장 — BE 이슈 목록 API 확인 | 🔴 높음 |
| BE | ClaimReport — BE DTO 클레임 전용 모델 없음, API 경로 확인 필요 | 🔴 높음 |
| BE | RoomBrand API 실제 존재 여부 및 경로 확인 | 중간 |
| BE | roomGroupIds 복수 선택 파라미터 형식 | 높음 |
| BE | WebSocket 이벤트 타입/payload 미정 | 중간 |
| BE | 공지 API `GET /shared/v1/notices` 경로 확인 | 중간 |
| BE | **[긴급변경] 긴급 변경 API — 엔드포인트, HTTP method, payload 확인** | 🔴 높음 |
| BE | **[강제완료] 강제완료 처리 API — 엔드포인트, HTTP method, payload 확인** | 🔴 높음 |
| BE | **[긴급변경] 키퍼 수락 상태 구분 필드 — TicketStatus 확장 또는 별도 필드 여부** | 🔴 높음 |
| BE | **[긴급/완료] 처리 후 앱 내 카드 노출/삭제 — BE 응답 이벤트 구조 확인** | 🔴 높음 |
| BE | alertMessages 필드명 확정 (B14·B15) | 🔴 높음 |
| PM | 위젯 설정 저장 위치 (서버 vs 로컬) | 높음 |
| PM | 미확인 건 확인 트리거 (열람 vs 클릭) | 높음 |
| PM | 세그먼트 탭 카운트 기준 — ALL vs 미처리만 (현재 ALL) | 🟡 중간 |
| FE | Pretendard 폰트 CDN vs 로컬 | 낮음 |
| Design | GNBSidebar 아이콘 gap/구분선 최종 확인 | 중간 |
| UX | #1976D2 vs #2962FF 색상 토큰 통일 | 중간 |

---

## 9. BE DTO 매핑 (Butler Keeper Data Models v1.7.0+77)

> **출처**: Butler Keeper - Data Models Documentation (작성자: 에이든, 2025-11-21)
> **용도**: Claude Code가 BE 연동 시 프로토타입 타입과 BE 실제 키를 대조하는 기준
> **파일**: `src/types/dashboard.ts` 주석에도 동일 내용 병기됨

### 9-1. TicketStatus 코드 키 (68차 교체 완료 — 코드 = BE 원본)

> **68챂 클드 코드는 BE 원본 키로 완전 대체되었습니다.** 어다터는 `프로토타입↔BE` 음포매핑이 필요하지 않습니다.
> 구 키 매핑 정보는 `docs/STATUS_POLICY.md §12-2` 보관 참조.

| 코드 키 (to-be, 현재 코드) | 한글 | 비고 |
|---|---|---|
| `REPORTED` | 보고됨 | 구: REPORTED 유지 |
| `PENDING` | 미배정 | 구: UNASSIGNED |
| `ASSIGNED` | 배정됨 | 유지 |
| `RESERVED` | 수행전 | 구: BEFORE_START |
| `STARTED` | 수행중 | 구: IN_PROGRESS |
| `HOLD` | 보류 | 구: ON_HOLD |
| `RESOLVED` | 완료 | 구: COMPLETED |
| `CANCELED` | 취소 | 구: CANCELLED (철자 D 1개로 동일) |

**BE 연동 시 참고:** 코드는 BE 원본 키와 일치하며, 필드명 매핑은 §9-2 참조.

### 9-2. TicketReport 필드 매핑 (BE: TicketThumbnail)

| 프로토타입 필드 | BE JSON 키 | 비고 |
|---|---|---|
| `ticketId` | `id` | |
| `ticketStatus` | `status` | TicketStatus enum |
| `taskType` | `taskGroupName` | 작업 그룹명 |
| `roomGroupId` | `roomGroupId` | ✅ 동일 |
| `roomGroupName` | `roomGroupName` | ✅ 동일 |
| `roomName` | `roomName` | BE: `roomFullName` 조합 가능 (동/층/호) |
| `keeperName` | (없음) | 프로토타입 확장 — BE 연동 시 별도 확인 |
| `keeperPhone` | (없음) | 프로토타입 확장 — 전화 아이콘용 |
| `scheduledAt` | `executableStartAt.epochMillis` | ISO8601 변환 필요 |
| `dueAt` | `executableEndAt` or `maxExpectedStartAt` | BE 확인 필요 |
| `photoUrls` | `ImageSource[].thumbnailUrl` | **BE 연동 시 `PhotoSource[]`로 교체** |
| `feedbackText` | `description` | 공간 유의 사항 |
| `isNew` | (없음) | 프로토타입 확장 — 미확인 여부 |
| `isUrgent` | (없음) | 프로토타입 확장 — dueAt 30분 이내 판정 |

### 9-3. PhotoSource (BE: ImageSource)

BE 실제 구조 (`lib/photo/models/image_source.dart`):
```ts
interface PhotoSource {
  id: string;
  url: string;          // 원본 이미지
  thumbnailUrl: string; // 압축 썸네일
}
```

현재 mock은 `photoUrls: string[]` 사용. **BE 연동 시 `photoSources: PhotoSource[]`로 교체.**
`PhotoSource` 타입은 `src/types/dashboard.ts`에 정의됨.

### 9-4. IssueReport 필드 매핑 (BE: Report)

| 프로토타입 필드 | BE JSON 키 | 비고 |
|---|---|---|
| `issueId` | `id` | |
| `issueType` | `type` | BE: TicketReportType |
| `issueStatus` | (없음) | 대시보드 확장 — BE Report에 status 없음 |
| `description` | `description` | ✅ 동일 |
| `photoUrls` | `photos[].thumbnailUrl` | BE: Photo[] → thumbnailUrl 추출 |
| `roomGroupId/Name/roomName` | (없음) | TicketThumbnail에서 조인 필요 |
| `reporterName` | (없음) | keeper 정보 조인 필요 |

> ⚠️ BE `Report` 모델은 특이사항(단건) 기준. 대시보드 이슈 목록 전용 API는 별도 확인 필요.

### 9-5. ClaimReport

BE DTO에 클레임 전용 모델 없음. `Report`의 특정 subtype이 해당할 수 있음.
BE 연동 시 클레임 전용 API 경로 및 응답 구조 별도 확인 필요.

### 9-6. BE 연동 전환 체크리스트 (Claude Code 참고)

| 항목 | 현재 (mock) | BE 연동 시 |
|---|---|---|
| `photoUrls: string[]` | mock URL 문자열 | `photoSources: PhotoSource[]` 교체 |
| `TicketStatus` | 8단계 (확장) | BE 6단계 매핑 테이블 (§ 9-1) 참고 |
| `keeperName/Phone` | 프로토타입 확장 | BE에서 별도 제공 여부 확인 |
| `isNew` | mock 하드코딩 | 미확인 트리거 정책 확정 후 연동 |
| `IssueReport.issueStatus` | 4단계 확장 | BE 이슈 목록 API 응답 구조 확인 |
| `ClaimReport` 전체 | 프로토타입 자체 설계 | BE 클레임 전용 API 경로 확인 |

---

## 10. 색상 토큰

| 토큰 | 값 | 출처 |
|---|---|---|
| `--primary-main` | `#1976D2` | 피그마 (탭 활성, 액션 등) |
| `--text-primary` | `rgba(0,0,0,0.87)` | 피그마 |
| `--text-secondary` | `rgba(0,0,0,0.60)` | 피그마 |
| `--divider` | `rgba(0,0,0,0.12)` | 피그마 |
| GNB 배경 | `#212121` | 피그마/운영 서비스 |
| TopBar 배경 | `#000000` | 운영 서비스 |
| 콘텐츠 배경 | `#F5F5F5` | 운영 서비스 |
| 활성 아이콘 배경 | `#2962FF` | GNBSidebar 활성 상태 |

> **⚠️ 주의**: `#1976D2` (피그마 원본)와 `#2962FF` (운영 서비스)가 다름.
> 탭/버튼 primary는 `#1976D2` 사용. GNB 활성 상태는 `#2962FF` 유지.

---

## 11. 프로젝트 기본 정보

| 항목 | 값 |
|---|---|
| 로컬 경로 | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts` |
| 포트 | 9004 |
| API Base | `https://indicator.11h.kr` |
| 피그마 (메인) | `https://www.figma.com/design/r8cvycY0ct22PNSPMjsyEg/-WEB-Indicator-v2.0-Design-Prep` |
| 피그마 (대시보드) | `https://www.figma.com/design/XzKoyOLnEceU5qyMQkOD9j/대시보드-개선` |
| 테스트 페이지 | `https://v0-card-style-test.vercel.app/test_.html` |
| 용어집 | `https://11oclock.atlassian.net/wiki/spaces/KM/pages/178552862` |

---

## 12. 피드 카드 액션 버튼 공통 정책 (22~23차 확정 — 🔴 최우선 참고)

> **이 섹션은 서비스 전체에 적용되는 핵심 운영 정책입니다.**
> 모든 Claude Code 개발자는 피드 카드 관련 구현 전 이 섹션을 반드시 읽을 것.

---

### 12-1. 버튼 전체 정책 (27차 최종 확정)

| 버튼 키 | 한글명 | 대상 상태 | 스타일 | 팝업 title | contents | 확인 후 동작 |
|---|---|---|---|---|---|---|
| urgentChange | 긴급 변경 | REPORTED·UNASSIGNED(특수) / ASSIGNED·BEFORE_START(일반) — **UNASSIGNED 포함 확정 (50차)** | error-outlined | 배정하면 긴급업무로 생성돼요 (특수) / 선택하신 일감을 긴급 처리 건으로 변경하시겠습니까? (일반) | 없음 | urgentCancel 버튼으로 교체 |
| urgentCancel | 긴급 취소 | isUrgent=true 상태 | error-contained #D32F2F | 선택하신 일감의 긴급 처리를 취소하시겠습니까? (**⚠️ Q3 임시**) | 없음 | urgentChange 버튼으로 복귀 |
| unassign | 배정 해제 | ASSIGNED | error-outlined | 키퍼 매칭을 해제하시겠습니까? | 없음 | BE 검증 후 성공 시 UNASSIGNED로 롤백 / 실패 시 토스트 `배정이 해제되지 않았습니다. 다시 시도해 주세요.` |
| start | 시작하기 | ASSIGNED·BEFORE_START | primary-contained | 선택하신 일감을 시작 처리하시겠습니까? | 없음 | IN_PROGRESS로 전환 |
| cancelStart | 시작 취소 | IN_PROGRESS | error-outlined | 선택하신 일감의 시작을 취소하시겠습니까? | 취소 시 배정됨 상태로 되돌아갑니다. | ASSIGNED로 롤백 |
| forceComplete | 완료 | 지연/임박 전 상태 | primary-contained | 선택하신 일감을 완료 처리하시겠습니까? | 완료 처리된 일감은 복구할 수 없습니다. | COMPLETED로 전환 |
| createFollowUp | 후속 일감 생성 | COMPLETED | **error-contained** (#D32F2F) | 없음(링크) | — | 후속 일감 생성 페이지 연결 (**⚠️ Q5 미확정**) — 58차 SVG 8·9 실측 기준 수정 (neutral-outlined은 SVG 없이 임시 결정했던 값) |
| assign | 배정 하기 | REPORTED·UNASSIGNED | primary-contained | (팝업 없음) | — | 배정 처리 |
| cancelTicket | 일감 취소 | REPORTED·UNASSIGNED | error-outlined | 일감을 취소하시겠습니까? | 취소된 일감은 복구할 수 없으며 어드민에서 삭제됩니다. | 일감 취소(삭제) 처리 |

---

### 12-2. [긴급 변경] 버튼 — `urgentChange`

#### 기능 정의
운영자가 해당 일감을 **우선 수행 요청(긴급) 건으로 변경**하는 액션.
앱(키퍼 앱) 내 긴급 건 노출 처리는 BE가 담당. FE는 API 호출만 하면 됨.

#### 권한
- **운영자 CRUD 권한**을 가진 사용자면 처리 가능 (ADMIN / MANAGER 모두 해당)
- 권한 검증은 BE 담당. FE는 버튼 노출 조건(ticketStatus)만 제어.

#### 긴급 변경 가능 조건 (26차 업데이트 / 50차 UNASSIGNED 확정)
- **`REPORTED(보고됨)` · `UNASSIGNED(미배정)`**: 특수 케이스 — 이미 생성된 티켓에 긴급 여부를 지정하여 키퍼에게 우선 노출. **배정 전 전 상태에서 노출 확정 (50차)**
- **`ASSIGNED(배정됨)` · `BEFORE_START(수행전)`**: 일반 케이스 — 키퍼가 배정된 이후이지만 아직 수행 전
- **`IN_PROGRESS(수행중)` 이상**: 미노출 — 이미 수행 중이면 긴급 변경의 의미 없음
  - **IN_PROGRESS 상태에서는 `urgentChange` 버튼 미노출** (SVG 3 기준 확정)
- 키퍼 수락 후에는 `urgentCancel`(우선 수행 취소) 버튼 **미노출**

> **적용 범위**: 지연/임박 탭 및 업무관리 탭 모두 동일 — IN_PROGRESS에서는 urgentChange 불가
> **노출 상태 전체**: `REPORTED` · `UNASSIGNED` · `ASSIGNED` · `BEFORE_START` (IN_PROGRESS 미만 전체)

> **📌 BE 개발자 참고**
> 키퍼 수락 상태를 구분하는 필드(TicketStatus 확장 또는 별도 boolean 필드)가 필요합니다.
> FE는 해당 필드 값을 기준으로 `urgentCancel` 버튼 노출 여부를 결정합니다.
> 필드명/구조는 BE가 결정 후 FE에 공유해주세요.

#### UX 상태 전이 플로우 (SVG 1 → SVG 2 순서)
```
[SVG 1 상태] urgentChange 버튼 노출 (outlined 스타일)
    ↓ 버튼 클릭
[팝업] "선택하신 일감을 긴급 처리 건으로 변경하시겠습니까?"
    ↓ 확인
[SVG 2 상태] urgentCancel 버튼으로 교체 (contained #D32F2F 스타일)
```
> SVG 1과 SVG 2는 서로 다른 카드가 아니라, **같은 카드의 before/after 상태**입니다.
> urgentChange(outlined) → urgentCancel(contained) 버튼 스타일 차이는 UX 의도적 구분입니다.

#### 프로토타입 동작 (확정)
1. 버튼 클릭 → 확인 팝업 호출
2. **확인** 선택 → 긴급 변경 BE API 호출 → 성공 시 카드 버튼 `urgentCancel`로 교체
3. **취소** 선택 → 팝업만 종료

#### 버튼 스타일 (확정 — SVG 1·2 기준)
| 버튼 | 스타일 | 근거 |
|---|---|---|
| urgentChange | error-outlined | SVG 1 — 긴급 변경 전 상태 |
| urgentCancel | error-contained (#D32F2F) | SVG 2 — 긴급 변경 확인 후 결과 상태 |

#### 확인 팝업 스펙
| 항목 | 내용 |
|---|---|
| title | 선택하신 일감을 긴급 처리 건으로 변경하시겠습니까? |
| contents | (없음) |
| 버튼 | **확인** (primary) / **취소** (secondary) |

> **📌 BE 개발자 참고 — 긴급 변경 API**
> 프로토타입에서 호출할 API가 필요합니다. 아래 형태를 예상하나 실제 엔드포인트는 BE 확인 후 연동:
> ```
> PATCH /api/v1/tickets/{ticketId}/urgent
> Body: { urgent: true }
> ```
> 성공 응답으로 갱신된 TicketReport 또는 최소한 변경된 status 필드를 반환해주세요.
> FE는 응답 기준으로 카드 상태를 업데이트합니다.

---

### 12-3. [완료 처리] 버튼 — `complete`

#### 기능 정의 및 성격 구분

> **배경 (중요)**: 카드의 `완료` 버튼은 사실상 **강제완료**의 성격입니다.
> 수행 전(BEFORE_START) 또는 수행 중(IN_PROGRESS) 상태에서 운영자가 키퍼와 충분히
> 협의하기 어렵다고 판단한 경우, 일감을 강제 종료시키는 개념입니다.
>
> **특히 중요한 정산 관련 배경:**
> 키퍼는 일감 건 단위로 정산을 받습니다. 키퍼가 실제로 업무를 완료했음에도
> 종료 처리를 하지 못한 경우 정산이 애매해질 수 있습니다.
> 이 상황의 강제완료 처리는 **전적으로 운영자의 판단**에 따릅니다.
> 시스템은 팝업 경고를 통해 신중한 결정을 유도하며, 이후 책임은 운영자에게 있습니다.

| 구분 | 설명 |
|---|---|
| **카드 `완료` 버튼** | 강제완료 — 수행 전/중 상태에서 운영자가 일감을 강제 종료 |
| **일반 완료 흐름** | 키퍼가 정상 수행 후 앱에서 완료 처리하는 일반적인 종료 과정 |

#### 완료 처리 최강 디폴트 정책 (서비스 전체 적용 — 절대 변경 불가)
> **완료된 일감(업무)은 수정·변경·삭제·되돌리기가 원천적으로 불가합니다.**

- COMPLETED 상태 카드에는 편집 관련 액션 버튼 **일체 미노출**
- `revert`(되돌리기) 버튼은 **존재하지 않습니다** — FeedCard.tsx에서 제거됨
- 완료 카드는 feedbackText 표시 전용 (읽기 전용)
- 완료 건 삭제(앱 내 카드 제거)는 BE 응답 처리 영역 (§ 12-4 참고)

#### 프로토타입 동작 (확정)
1. 버튼 클릭 → 확인 팝업 호출
2. **확인** 선택 → 강제완료 BE API 호출 → 성공 시 COMPLETED 카드 형태로 전환
3. **취소** 선택 → 팝업만 종료

#### 확인 팝업 스펙
| 항목 | 내용 |
|---|---|
| title | 선택하신 일감을 완료 처리하시겠습니까? |
| contents | 완료 처리된 일감은 복구할 수 없습니다. |
| 버튼 | **확인** (primary) / **취소** (secondary) |

> **📌 BE 개발자 참고 — 강제완료 처리 API**
> 프로토타입에서 호출할 API가 필요합니다. 아래 형태를 예상하나 실제 엔드포인트는 BE 확인 후 연동:
> ```
> PATCH /api/v1/tickets/{ticketId}/complete
> Body: { forceComplete: true }
> ```
> 성공 응답으로 갱신된 TicketReport 전체(또는 status: "COMPLETED" 포함 최소 필드)를 반환해주세요.
> FE는 응답 기준으로 카드를 COMPLETED 형태로 전환합니다.

---

### 12-4. 앱 내 카드 노출/삭제 정책 (BE 처리 영역)

> **이 항목은 BE 개발 영역입니다.** FE(프로토타입)는 API 호출만 담당하며,
> 긴급 건 앱 노출과 완료 처리 후 카드 삭제는 BE API 응답 및 이벤트 처리가 기준입니다.

| 액션 | FE 역할 | BE 역할 |
|---|---|---|
| 긴급 변경 | API 호출 + 버튼 교체 (`urgentChange` → `urgentCancel`) | 키퍼 앱 내 긴급 건 노출 처리 |
| 강제완료 | API 호출 + COMPLETED 카드로 전환 | 완료 처리 후 일감 카드 삭제/아카이브 처리 |

> **📌 BE 개발자 참고 — Q-D (모달-대시보드 동기화 / B7 연계)**
>
> 아래 항목은 **전부 BE 구현 영역**입니다. FE는 API 호출 및 성공 응답 기준으로만 상태를 갱신합니다.
>
> **① 긴급 변경 후 키퍼 앱 노출**
> - 긴급 변경 API 성공 후 키퍼 앱에 긴급 건을 노출하는 방식(Push / WebSocket 등) BE 결정
>
> **② 완료 처리 후 카드 제거 타이밍**
> - 강제완료 API 성공 후 피드에서 카드가 제거되는 타이밍(즉시 vs 배치) BE 결정
>
> **③ 업무상세 모달 CRUD → 대시보드 동기화**
> - 모달에서 CRUD 발생 시 대시보드 갱신 방식(WebSocket 실시간 vs 모달 닫기 시 API 재호출) BE 결정
> - 갱신 대상 데이터 범위(카드 상태값 / 메모 / 이미지 등) BE 정의 후 FE에 공유
>
> **FE 대기 사항**: 위 구조 확정 후 FE 연동 작업 진행 예정

---

### 12-5. 상태배지 줄바꿈 정책 (62차 갱신 — 59차 nowrap → 62차 wrap 원정책 복원)

> **배지는 절대 줄바꿈이 없어야 합니다.** 컨테이너 너비가 춥아지는 환경에서도 배지는 단일 행을 유지해야 합니다.

| 항목 | 값 | 이유 |
|---|---|---|
| 상태배지 영역 `flexWrap` | **`wrap`** | 두 줄 허용 — 62차 원정책 복원 (61차 nowrap+visible 조합에서 우측 영역 침범 버그 발생 → wrap 복원) |
| 상태배지 영역 `overflow` | **`visible`** | 줄바꿈 허용 시 제한 없음 |
| 배지 `whiteSpace` | **`nowrap`** | 배지 개별 내부 텍스트 줄바꿈 방지 (컴테이너는 wrap, 배지 내부는 nowrap 유지) |
| 배지 `flexShrink` | **`0`** | 배지 너비 유지 |

> **노출 순서**: NEW 배지 → 상태 배지 → 업무형태 배지 순서. 컨테이너가 춥아지면 업무형태 배지가 잠슬 수 있으나, 이는 의도된 동작입니다.
> **FE 주의사항** (65차 통일): `FeedCard.tsx` / `IssueCard.tsx` / `ClaimCard.tsx` 상태배지 컨테이너 모두 `flexWrap: 'wrap'` + `overflow: 'visible'` 적용. 배지 개별에는 `whiteSpace: 'nowrap'` + `flexShrink: 0` 유지. `nowrap`으로 되돌리면 우측 시간 영역 침범 버그 재발.

---

### 12-5-b. 변경사항 피드 필터 탭 UX 정책 (33차 확정)

#### 카운트 표기
| 조건 | 표기 |
|---|---|
| count ≤ 99 | 숫자 그대로 표기 |
| count > 99 | `99+` 로 고정 표기 |

> 3자리 이상 숫자는 탭 너비를 예측할 수 없어 레이아웃 깨짐 유발 → `99+` 상한 처리.
> 코드: `const displayCount = count > 99 ? '99+' : count;`
> 활성 탭 카운트 배지(`<span>`)는 `width: 20` 대신 `minWidth: 20` 적용 — `99+` 시 자동 확장.

#### 필터 탭 행 레이아웃
| 항목 | 값 |
|---|---|
| `flexWrap` | `wrap` — 넘치면 2줄 허용 |
| `gap` | `8px` |
| 비활성 탭 `paddingBlock` | `4px` (터치 타겟 32px 확보) |
| 비활성 탭 `flexShrink` | `0` (탭 텍스트 잘림 방지) |

> **1줄 기준 해상도**: 컨테이너 너비 ≥ 약 340px (2자리 카운트 기준)
> **2줄 허용 해상도**: 컨테이너 너비 < 340px (375px 아이폰 SE 등)
> → `flexWrap: wrap` 이므로 넘치는 탭은 자연스럽게 다음 줄로 내려감.
> → `nowrap` + `overflowX: auto` 스크롤 방식은 탭 잘림이 사용자에게 노출되지 않아 UX상 부적합하여 제외.

---

### 12-6. FeedCard.tsx 구현 가이드 (Claude Code용)

> 피드 카드 구현 시 이 섹션을 코드 작성 기준으로 사용하세요.

```
urgentChange 버튼:
  - 노출 조건 (지연/임박 탭): REPORTED·UNASSIGNED·ASSIGNED·BEFORE_START (IN_PROGRESS 미포함)
    → IN_PROGRESS 지연/임박 탭: urgentChange 미노출 (26차 확정 유지 — 수행중이므로 긴급 변경 의미 없음)
  - 노출 조건 (업무관리 탭): ASSIGNED·BEFORE_START + IN_PROGRESS 모두 포함 (51차 확정)
    → 업무관리 탭 IN_PROGRESS urgentChange 노출 — 수행 중인 키퍼에게 뒤늦게 긴급 여부 전달 가능
  - REPORTED·UNASSIGNED (업무관리 탭): urgentChange 미노출 — 배정하기 버튼과 연동하여 처리 (27차 확정)
    → 이 상태에서는 '배정 하기' 클릭 시 긴급 여부 지정 — 별도 urgentChange 버튼 없음
    → 단, 긴급 변경 API는 REPORTED/UNASSIGNED에도 적용 가능 (POLICY §12-1·§12-2, 50차 확정)
  - 클릭 시: ConfirmModal 호출 → 확인 → urgentChange API → urgentCancel 버튼으로 교체

urgentCancel 버튼:
  - 노출 조건: 긴급 변경 후, 키퍼 수락 전까지만 노출
  - 키퍼 수락 후: 미노출 (BE 수락 상태 필드 기준)

complete / forceComplete 버튼:
  - 레이블: 업무관리 탭 → `완료 하기` / 지연/임박 탭 → `완료` (51차 탭별 분기 확정)
  - 노출 조건: BEFORE_START / IN_PROGRESS 상태 (수행 전/중)
  - 클릭 시: ConfirmModal 호출 → 확인 → forceComplete API → COMPLETED 카드로 전환

revert(되돌리기) 버튼:
  - ❌ 존재하지 않음. 구현하지 말 것.
  - 완료된 일감은 원천적으로 복구 불가 (서비스 최강 디폴트 정책)

COMPLETED 카드 (51차 업데이트):
  - 액션 버튼: `후속 일감 생성`(**error-contained** #D32F2F) 단독 노출 (58차 SVG 8·9 실측 기준 수정)
  - revert(되돌리기) 버튼: 없음, 텍스트/이미지 수정 불가
  - 메모 없음 (Type A, SVG 8): inputbox 미노출, 후속 일감 생성 버튼만 우측 정렬
  - 메모 있음 (Type B, SVG 9): 읽기 전용 박스 + 후속 일감 생성 버튼 우측 정렬
    · 읽기 전용 박스: 테두리 없음 / bg white / padding **12px 균일** / 자연 높이 — 58차 SVG 9 실측 (이전 20/16px은 임시)
    · 테두리 없음 = 입력 가능 textarea(outline 있음)와 시각적으로 구분 → '수정 불가' 표현
    · 업무관리 탭에서만 노출 (activeFilter === 'TASK' && isCompleted && feedbackText)
```

---

### 12-7. 알림박스 우선순위 정책 (45차 확정 — SVG 1~4 전체 적용)

알림박스 노출 우선순위:

| 순위 | 조건 | 내용 | 예시 |
|---|---|---|---|
| 1위 | `alertMessages` 배열 있고 비어있지 않음 | `registeredAt` 기준 최신 1건 노출 | "고객 요청으로 오더가 취소되었습니다." |
| 2위 | `alertMessages` 없거나 빈 배열 | `dueAt` 기반 마감시간 안내 | "마감시간(15:00)이 10분 남았습니다." |

`source` 구분:
- `SYSTEM`: BE 자동 생성 알럿 (취소·상태변경 등)
- `OPERATOR`: 웹 운영 서비스에서 운영자가 직접 입력

1위 동등 처리: 동일 배열 내 `registeredAt` 최신 1건만 노출 (동시 2건 표시 없음)

> **📌 BE 개발자 참고**
> 미결 **B14**(BE 알럿 필드명)·**B15**(운영자 문구 필드명) — mock 임시 구조 사용 중, 실서비스 전 필드명 확정 필요.

---

### 12-10. 앱-웹 상태값 대응 및 배정하기 버튼 분기 정책 (50차 확정)

#### 앱-웹 상태값 대응 관계

| 앱 상태 | 웹 상태값(키) | 한글명 | 전환 트리거 |
|---|---|---|---|
| 잡기 | `UNASSIGNED` | 미배정 | 어드민에서 일감 생성 시 |
| 예약 | `ASSIGNED` | 배정됨 | 키퍼가 앱에서 잡기 선택 OR 운영자가 웹에서 배정 |
| 수행 | `BEFORE_START` | 수행전 | 배정 후 시작 전 대기 |
| 수행(시작) | `IN_PROGRESS` | 수행중 | 키퍼가 앱에서 시작하기 OR 웹에서 시작하기 버튼 |
| 완료 | `COMPLETED` | 완료 | 키퍼가 앱에서 완료하기 OR 웹에서 완료하기 버튼 |

> **⚠️ 과도기 안내**: 앱의 "예약" 기능(키퍼가 직접 잡기)이 현재 폐지 중.
> `UNASSIGNED → ASSIGNED` 전환 방식이 변경되는 중이나, 웹 상태값 자체는 동일하게 유지.

#### UNASSIGNED(미배정) 카드 — 생성 맥락

- 업무 생성 = 키퍼 어드민에서 **공간정보(지점·동·층·동호수) + 업무형태 + 일정**을 매핑하여 생성
- 생성 시점에 카드 상태값은 `UNASSIGNED(미배정)`
- **확정 정보** (BE 전송): 지점명, 층, 동호수, 생성일시, 청소유형(taskType)
- **미확정 정보**: 키퍼 → UI에서 `keeperName` 없을 때 **"미배정"** 고정 텍스트 표시

#### 배정하기(`assign`) 버튼 분기 정책 (50차 핵심 확정)

> **배정하기 버튼은 기능의 분기점입니다.** 예약 가능 여부에 따라 완전히 다른 플로우로 연결됩니다.

| 분기 | 조건 | 동작 |
|---|---|---|
| **예약 가능 일감** | BE 필드 기준 (`isReservable: true` 또는 동등 필드) | 키퍼가 앱에서 직접 잡기 가능한 일감. 기존 정책 플로우 유지 |
| **예약 불가 일감** | BE 필드 기준 (`isReservable: false` 또는 동등 필드) | 운영자가 키퍼를 직접 지정. 키퍼 선택 화면으로 이동 |

**현재 구현 범위 (50차):**
- 배정하기 버튼 클릭 시 키퍼 선택 화면으로 라우팅 가능한 skeleton 구현
- 키퍼 선택 화면 UI는 차후 디자인 SVG 제공 시 구현
- 분기 로직 (예약 가능/불가 판단)은 **⚠️ BE 필드 확정 후 연결** → B19 신규 미결 등록

> **📌 BE 개발자 참고 — B19 (배정하기 분기 필드)**
>
> 배정하기 버튼은 **예약 가능 일감**과 **예약 불가 일감** 두 플로우의 분기점입니다.
>
> **배경**: 기존 앱에서 키퍼가 직접 "잡기"로 예약하는 기능이 폐지되는 과도기입니다.
> 일감 생성 시(키퍼 어드민) 예약 가능 여부가 결정되며, 이 값이 웹 대시보드 배정 플로우를 결정합니다.
>
> **FE가 필요한 것**: 티켓 응답에 예약 가능 여부 필드
> - 예약 가능(`true`) → 키퍼가 앱에서 잡기 가능한 일감, 기존 플로우 유지
> - 예약 불가(`false`) → 운영자가 키퍼 직접 지정, 키퍼 선택 화면으로 이동
>
> **필드명·타입 확정 후 FE에 공유 필요** (예: `isReservable: boolean`, `assignType: 'OPEN' | 'DIRECT'` 등)
> FE는 해당 필드 기준으로 배정하기 버튼 클릭 시 분기 처리합니다.

---

### 12-9. 업무관리 탭 메모 inputbox 정책 (50차 확정 — SVG 5 기준)

> SVG 5~9는 업무관리 탭 카드군입니다. SVG 5는 공통 컴포넌트 기준점.
> SVG 8·9의 버그 B·C 해결 시 SVG 5의 inputbox 스펙을 공통 컴포넌트 관점에서 참고할 것.

#### 노출 조건 (기존 POLICY §12-6 showMemo 조건 유지)
| 조건 | 값 |
|---|---|
| 탭 | 업무관리 탭 (`activeFilter === 'TASK'`) |
| 상태 | `REPORTED` · `UNASSIGNED` · `ASSIGNED` · `BEFORE_START` · `IN_PROGRESS` |

#### inputbox 기본 상태
- 업무관리 탭 진입 시 **기본 열림(활성 입력 상태)** 으로 표시
- 별도 토글 버튼 없음 — 탭 진입 시 항상 inputbox 노출

#### inputbox 레이아웃 스펙 (SVG 5 실측)
| 요소 | 값 |
|---|---|
| 컨테이너 배경 | `var(--grey-100, #F5F5F5)` |
| 컨테이너 padding | `12px` |
| 컨테이너 border-radius | `8px` |
| textarea 높이 | `104px` (4 rows 고정) |
| textarea 스타일 | MUI Outlined variant |
| textarea placeholder | `내용을 작성해주세요.` |
| 이미지 영역 배경 | `white` (별도 분리 영역) |
| 이미지 영역 padding | `8px` |
| 이미지 placeholder | 40px 원형, `#D9D9D9` 배경 |

#### 버튼 정책 (50차 취소 버튼 제거 확정)
| 버튼 | 위치 | 스타일 | 동작 |
|---|---|---|---|
| 사진 추가 | 하단 좌측 | Text (Inherit) | 이미지 업로드 트리거 |
| ~~취소~~ | ~~하단 우측~~ | ~~Text (Inherit)~~ | **제거 확정 (50차)** |
| 저장 | 하단 우측 | Contained — 색상 `#1976D2` (임시, 추후 토큰 수정 예정) | 메모 내용 확정 — **텍스트 OR 이미지 둘 중 하나라도 있으면 active** |

- `저장` 버튼 활성화 조건: `memoText.trim().length > 0 || images.length > 0` (OR 조건)
- 취소 버튼 없음 — 저장 외 inputbox를 닫는 동작은 SVG 추가 제공 후 확정

#### 저장 후 상태
- 저장 완료 시 → **비활성화 처리된 카드**로 전환
- 비활성화 카드 스펙은 추후 디자인 SVG 제공 예정 — 현재 구현 보류
- 저장된 메모를 카드에서 재열람 가능 여부도 해당 SVG 수신 후 확정

#### 이미지 업로드 정책
- 1장 placeholder 스펙: 40px 원형, `#D9D9D9` 배경
- **다수장 입력 가능** (BE 정책에 따라 제한)
- **mock 환경 제한**: 10MB / 5장 상한. **5장 초과 시 토스트 알림** 표시
  - 토스트 문구(FE 임시): `사진은 최대 5장까지 등록할 수 있습니다.`
- 텍스트·이미지 모두 **선택값** — 둘 다 없어도 카드를 이탈 수 있음 (input box를 보여주지만 저장 강제 아님)
- 2장 이상 레이아웃: 디자인 SVG 미제공 → **1장 기준 먼저 구현**, 추후 확장
- 파일 크기 제한 · 허용 포맷 · API 방식 실서비스: **⚠️ B18 신규 미결 등록**

#### BE 미결 이슈
- **B17**: 메모 저장 API — 엔드포인트, payload, 응답 구조 미정
- **B18**: 이미지 업로드 API — 파일 크기 제한, 허용 포맷, presigned URL 여부 미정

---

### 12-8. 완료 카드 알림박스 및 상태배지 정책 (47차 확정)

#### 완료 카드 알림박스

| 조건 | 노출 | 이유 |
|---|---|---|
| `alertMessages` 있고 비어있지 않음 | 최신 1건 노출 | 운영자가 주요 정보를 확인할 수 있어야 함 |
| `alertMessages` 없거나 빈 배열 | 미노출 | 이미 완료된 건에 마감시간 안내는 의미 없음 |

> 초기 설계의 `!delayUrgent` 조건은 제거. COMPLETED 상태에서 `alertMessages`를 별도 확인하여 노출.

#### 완료+지연 배지 중첩 정책

| 상태 | 배지 구성 | 순서 |
|---|---|---|
| COMPLETED + `dueAt < 현재 시각` | `[완료, 일감 마감 지연]` | 완료(주) → 지연(부가 정보) |
| COMPLETED + `dueAt ≥ 현재 시각` | `[완료]` 단독 | 지연 없었던 정상 완료 |

**시나리오 예시:** 16시 마감 → 수행중 → 17시에 키퍼 완료 보고
→ 완료 배지 + 일감 마감 지연 배지 동시 노출

> **지연 판단 (확정):** `dueAt < locale 기준 현재 시각` (epoch ms 비교)으로 FE 판단.

**지연 판단 기준 (47차 확정):**
- 판단 기준: 로케일 시스템 시각 기준 epoch ms (`new Date().getTime()`)
- ISO 문자열(dueAt)이 로케일 현재 시각보다 과거이면 지연으로 판단
- UTC와 로케일 모두 epoch ms 비교로 일관성 보장

#### 완료+지연 케이스 시각 요소 (47차 확정, FE·디자인·PM 루프 결과)

| 요소 | 일반 완료 카드 | 완료+지연 카드 |
|---|---|---|
| 좌측 색상바 | `#9E9E9E` (회색) | `#FF1744` (빨간 유지) |
| 헤더 opacity | 0.4 (미약하게 노출) | 1 (정상 노출) |
| 탭 이동 | 자동 탭 이동 없음 (지연/임박 탭에서 카드 사라짐) | 동일 |

> **탭 이동 정책:** 완료 처리 시 지연/임박 탭에서 카드를 제거, 완료 탭에서 조회 가능.
> 자동 탭 이동(UI)은 이번 범위 외. `filterTickets()`가 `localOverrides` 기준으로 실시간 카드카운터 반영을 통해 FE에서 자동 수행됨.

---

### 12-11. SVG 6 — ASSIGNED(배정됨) 카드 정책 (51차 확정)

> SVG 6 = 업무관리 탭 + ASSIGNED 상태 카드. SVG 5(UNASSIGNED)에서 [배정 하기] 클릭 후 전환된 결과 상태.

#### 카드 구성 요소

| 요소 | 값 | 비고 |
|---|---|---|
| 좌측 색상바 | `#9E9E9E` (회색) | 지연/임박·취소·보류 아닌 경우 회색 |
| 상태 배지 | `배정됨` — bg `#E8F5E9`, color `#1B5E20` | `ASSIGNED` 상태값 매핑 (UI 표시명: 배정됨 — 코드/HANDOVER 배지 표와 동일) |
| 업무형태 배지 | bg `#EEEEEE`, color `#212121` | BE `taskType` 그대로 표시 |
| **헤더 우측 시간** | 배정 완료 시간 (`assignedAt` 계열 필드) | **SVG 5(UNASSIGNED)와 다름** — 배정이 완료된 시각 표시 |
| 키퍼명 | 실제 키퍼 계정 이름 (`keeperName`) | UNASSIGNED와 달리 실명 표시 — `keeperName` 없으면 `"미배정"` |
| 위치 | 지점ㆍ층ㆍ동호수 | SVG 5와 동일 |
| inputbox | SVG 5와 동일 구조 | §12-9 정책 그대로 적용 |

#### 헤더 우측 시간 필드 정책 (51차 신규)

> **SVG 5(UNASSIGNED)** 헤더 시간: 일감 생성 시각 또는 `dueAt` 기반 표시
> **SVG 6(ASSIGNED)** 헤더 시간: **배정 완료 시각** — 키퍼가 배정된 시점

- FE 표시 형식: `YYYY-MM-DD HH:mm`
- 사용 필드: `assignedAt` (또는 BE 제공 동등 필드) — **⚠️ B21 신규 미결**
- `assignedAt` 미확정 시: `scheduledAt` 임시 사용 후 교체

#### 버튼 정책 (SVG 6 확정)

| 위치 | 버튼 | 스타일 | 동작 |
|---|---|---|---|
| 좌측 단독 | 긴급 변경 | error-outlined | §12-2 일반 케이스 플로우 동일 |
| 우측 첫째 | 배정 해제 | error-outlined | 팝업 → BE 검증 → 성공 시 UNASSIGNED 카드로 전환 / 실패 시 토스트 |
| 우측 둘째 | 시작하기 | primary-contained (#1976D2) | §12-1 `start` 정책 동일 |

> **inputbox 취소 버튼**: SVG 6에 `취소` 버튼이 포함된 것처럼 보이나 **50차 정책(§12-9)에서 제거 확정** — SVG 6은 구버전 디자인 파일. 취소 버튼 미구현.

#### 배정 해제(`unassign`) 플로우 (51차 확정)

```
[ASSIGNED 카드] 배정 해제 버튼 클릭
    ↓
[팝업] title: "키퍼 매칭을 해제하시겠습니까?"
       contents: 없음 / 버튼: 확인·취소
    ↓ 확인
[BE 검증 API 호출] — ⚠️ B20: 가능여부 검증 포함 엔드포인트 미확정
    ↓
  성공 → UNASSIGNED 카드로 전환 (keeperName 제거, 상태 배지 → 미배정)
  실패 → 팝업 닫힘 + 토스트: "배정이 해제되지 않았습니다. 다시 시도해 주세요."
```

> **📌 BE 개발자 참고 — B20 (배정 해제 API)**
>
> 배정 해제는 단순 상태 변경이 아니라 **BE에서 해제 가능 여부를 먼저 검증**해야 합니다.
> (예: 키퍼가 이미 업무를 시작했거나 수락 확정된 경우 해제 불가)
>
> FE는 API 응답 기준으로 처리합니다:
> - 성공(`2xx`) → 카드 상태를 UNASSIGNED로 전환
> - 실패(`4xx`/`5xx` 또는 별도 에러코드) → 토스트 메시지 노출
>
> **필요한 것**: 배정 해제 엔드포인트 + 실패 응답 구조(에러코드/메시지)
> ```
> DELETE 또는 PATCH /api/v1/tickets/{ticketId}/assign
> 성공: { status: "UNASSIGNED", ... }
> 실패: { code: "UNASSIGN_FAILED", message: "..." }
> ```
> 실제 엔드포인트·HTTP method·에러 구조는 BE 확정 후 FE에 공유 필요.

---

### 12-12. SVG 7 — IN_PROGRESS(수행중) 업무관리 카드 정책 (51차 확정)

> SVG 7 = 업무관리 탭 + IN_PROGRESS 상태 카드. 키퍼가 수행을 시작한 상태.

#### 카드 구성 요소

| 요소 | 값 | 비고 |
|---|---|---|
| 좌측 색상바 | `#9E9E9E` (회색) | 지연/임박 아님 |
| 상태 배지 | `수행중` — bg `#E0F7FA`, color `#006064` | BE `IN_PROGRESS` 상태값 매핑 |
| **헤더 우측 시간** | 수행 시작 시각 (`startedAt` 계열 필드) | **⚠️ B22 신규 미결** — BE 필드 확정 필요 |
| inputbox | 업무관리 탭 입력 가능 박스 | §12-9 정책 적용 |

#### 헤더 우측 시간 필드 정책 (51차 신규)

- 사용 필드: `startedAt` (또는 BE 제공 동등 필드) — **⚠️ B22 신규 미결**
- FE 표시 형식: `YYYY-MM-DD HH:mm`
- `startedAt` 미확정 시: `scheduledAt` 임시 사용 후 교체

> **⚠️ B22 신규 미결**: `startedAt` 필드 여부 및 필드명 BE 에서 확정 후 FE 에 공유 필요.

#### 버튼 정책 (SVG 7 확정 — 51차)

| 위치 | 버튼 | 스타일 | 동작 |
|---|---|---|---|
| 좌측 단독 | 긴급 변경 | error-outlined | §12-2 페이지 일반 케이스 플로우 동일 |
| 우측 첫째 | 시작 취소 | error-outlined | ASSIGNED 상태로 롤백 |
| 우측 둘째 | 완료 하기 | primary-contained (#1976D2) | 확인 팝업 → COMPLETED 전환 |

> **§12-6과의 차이**: 지연/임박 탭 IN_PROGRESS에서는 urgentChange 미노출 (26차 정책 유지)
> 업무관리 탭 IN_PROGRESS에서만 urgentChange 노출 — 동일 IN_PROGRESS라도 탭 맥락에 따라 다르게 동작.

---

### 12-13. SVG 8·9 — COMPLETED(완료) 업무관리 카드 정책 (51차 확정)

> SVG 8 = 업무관리 탭 + COMPLETED + 메모 없음 (Type A)
> SVG 9 = 업무관리 탭 + COMPLETED + 메모 있음 (Type B)
> 두 케이스 모두 일감은 완료된 상태입니다. 텍스트/이미지 수정 불가.

#### 코어 정책

| 요소 | 핵심 정책 |
|---|---|
| 액션 버튼 | `후속 일감 생성`(**error-contained** #D32F2F) 단독, 우측 정렬 — 58차 SVG 8·9 실측 기준 |
| revert(되돌리기) | 없음 — 정책상 존재하지 않습니다 |
| inputbox(입력 가능) | 미노출 — 완료 상태는 수정 불가 |
| opacity | 0.4 (정상 완료, 지연 없음 케이스) |

#### Type A 특이사항 (SVG 8 — 메모 없음)

- 메모/이미지 보엄 없음 → inputbox 영역 통째 미노출
- 하단: `후속 일감 생성` 버튼만

#### Type B 특이사항 (SVG 9 — 메모 있음)

| 요소 | 값 |
|---|---|
| 읽기 전용 박스 존재여부 | `feedbackText` 있을 때만 노출 |
| 컨테이너 배경 | `#F5F5F5` (grey-100), padding 12px |
| 텍스트 박스 배경 | white |
| **테두리** | **없음** — 키포인트: 입력 가능 textarea의 outline과 구분 → '수정 불가' 시각화 |
| padding | **12px 균일** — 58차 SVG 9 실측 (이전 좌우20/상하16px는 임시값) |
| 높이 | 자연 높이 (fixed height 없음) — 텍스트 양에 따라 자동 확장 |
| 이미지 영역 | 디자인 SVG 미제공 → 현재 미노출, 추후 SVG 제공 시 추가 |
| 노출 탭 | 업무관리 탭에서만 노출 (`activeFilter === 'TASK' && isCompleted && feedbackText`) |

#### 이미지 영역 정책

- 디자인 SVG 미제공 → **현재 완전 숨김**
- SVG 제공 시 채널친 `FeedCard.tsx` 업데이트 예정
- 텍스트만 있는 케이스 먼저 구현, 이미지 나중 추가

#### 노출 범위 정책

- **업무관리 탭에서만 노출** (`activeFilter === 'TASK'`)
- 완료 탭(탭):미노출 — 완료 탭에서는 메모 박스 없이 기본 라우웃만 표시

> **[Q5-pending]**: After confirming policy, connect URL for createFollowUp.

---

### 12-14. ON_HOLD status policy (59th session confirmed)

> **ON_HOLD definition (confirmed)**: A ticket temporarily suspended due to a claim or similar issue during execution. May be resumed later.
>
> **Follow-up handling (TBD — PM to confirm after real environment review)**:
> - Option A: Resume work button directly from ON_HOLD state
> - Option B: Create follow-up ticket (similar to createFollowUp flow)

| Item | Current state |
|---|---|
| Tab | Cancel tab (`CANCELLED_STATUSES = ['CANCELLED', 'ON_HOLD']`) |
| Status badge | `보류` — bg `#FEEBEE`, color `#FF1744` |
| Left color bar | `#FF1744` red |
| Action buttons | None (return `[]`) |
| feedbackText | Shown in grey box as reason |
| BE status | Extended — not in BE yet |

> **Pending items (59th session):**
> 1. **Action button** — none currently. PM to confirm: resume button or follow-up ticket button
> 2. **Tab placement** — ON_HOLD has resume possibility; confirm if cancel tab is appropriate vs task tab
> 3. **BE field** — confirm if BE will provide ON_HOLD status value

> **⚠️ PM Q5 (original)**: 후속 일감 생성 버튼 클릭 시 링크 동작 방식(뀌셸 URL, 모달, 이동 등) 미확정.
> 현행: `console.log('[FeedCard] createFollowUp')` 프로토타입 모지 동작. 정책 확정 후 URL 연결.

---

## 13. Phase 1 개발 전달 정책 (2026-03-27 확정)

> Phase 1 범위: 프레임(인증/인가) + 헤더(지점 관련) + 집계(실시간 관리지표)

### 13-1. 미구현 버튼 inactive 처리 기준

Phase 1 범위에서 기능이 아직 연동되지 않은 버튼은 다음 기준으로 inactive 상태로 표시합니다.

| 항목 | 값 |
|---|---|
| `disabled` | true |
| `opacity` | 0.45 |
| `cursor` | default |
| 클릭 이벤트 | 없음 (onClick 미연결) |

적용 대상:
- TopBar "가이드 보기" — Phase 1 미구현
- DashboardHeader "미확인 건 찾기" — Phase 3 완료 후 제안
- DashboardHeader "메모 남기기" — Phase 3+4 완료 후 제안
- DashboardHeader "위젯 설정" — Phase 3 완료 + PM 저장 위치 확정 후 제안
- MobileHeader 드로어 "미확인 건 찾기", "메모 남기기", "위젯 설정" — 동일

### 13-2. 공지사항 닫기 정책 (프로토타입)

X 버튼 클릭 시 React state에만 저장 → 새로고침/재방문 시 항상 재노출.
실서비스 전환 시 NoticeBanner.tsx의 dismissed state를 localStorage 또는 서버 저장 방식으로 교체.

### 13-3. middleware RBAC 프로토타입 한계

현재 middleware는 쿠키 'token' 유무만 체크. NONE 권한 차단은 클라이언트(layout.tsx)에서 이중 처리.
실서비스 전환 시 middleware.ts 내 주석 처리된 authority 체크 코드 활성화 필요.
(로그인 시 authority 쿠키 별도 저장 또는 JWT claim 방식 선택)

### 13-4. KPI 아이콘 출처

public/images/icons/ 에 kpi.svg에서 추출한 SVG 파일 4개 저장.
KpiCards.tsx는 인라인 SVG 대신 img 태그로 해당 파일을 참조.
아이콘 시각적 정확도 검수는 후순위로 예정.

---

## 14. 위젯 설정 정책 (2026-03-27 확정)

> Phase 1 전달 범위 포함. DashboardHeader "위젯 설정" 버튼 클릭 시 동작.

### 14-1. 위젯 목록 및 기본값

| 위젯 키 | 위젯명 | 기본값 |
|---|---|---|
| `kpi` | 실시간 관리지표 | ON |
| `feed` | 변경사항 피드 | ON |
| `issue` | 처리 필요 | ON |
| `claim` | 클레임 | ON |

### 14-2. 상태 저장 방식 (프로토타입)

React state(`useState`)만 사용. localStorage 미사용.
→ 새로고침/재방문 시 항상 전체 ON 상태로 복귀.
[실서비스 전환 시] localStorage 또는 서버 저장 방식으로 교체.

### 14-3. 레이아웃 변화 규칙

- OFF 위젯은 렌더에서 제거됨 (display:none 아닌 조건부 렌더)
- 제거 후 나머지 위젯이 앞으로 당겨져 채움
  - 세로 방향: 위 위젯 OFF → 아래 위젯이 위로 이동
  - 가로 방향: 앞 위젯 OFF → 뒤 위젯이 앞 위치로 이동
- 기존 BP 규칙(POLICY §3)은 그대로 유지

### 14-4. KPI 카드 개수 및 BP 배치 정책 (62차 PM 확정)

- KPI 카드 4종은 KpiCards 컴포넌트 내부 고정
- KpiCards 전체가 하나의 위젯 단위로 ON/OFF 처리

**BP별 KPI 배치 구조 (62차 확정):**

| BP 구간 | 배치 | 비고 |
|---|---|---|
| 웹 3열 (친드린 ≥1,280px) | 4개 가로 1줄 flex | 현행 유지 |
| 웹 2열 (친드린 685~1,279px) | 2×2 그리드 (1,2 / 3,4) | 62차 신규 |
| 모바일 (모든 해상도) | 2×2 그리드 | 현행 유지 |

- 카드 순서: 1번(업무현황) → 2번(미해결이슈) → 3번(미확인클레임) → 4번(달성률) 동일 순서 유지
- 향후 KPI 카드 5개 이상 시: PM 요청 시 추가 정책 수립

### 14-5. 위젯 설정 UI (프로토타입)

DashboardHeader "위젯 설정" 버튼 클릭 → 드롭다운 패널
- 각 위젯별 토글 스위치 (ON/OFF)
- 패널 외부 클릭 시 닫힘
- 모바일(MobileHeader 드로어) 동일 항목 동일 동작
[실서비스 전환 시] 저장 위치(localStorage/서버) PM 확정 후 교체

### 14-3 보완. 세그먼트 탭 OFF 동작 정책 (60차 확정)

> 모바일 1열+탭 구간(D 구간)에서 위젯이 OFF되면 해당 탭도 함께 제거됩니다.

| 상황 | 동작 |
|---|---|
| feed OFF | 세그먼트 탭에서 '변경사항 피드' 탭 제거, 나머지 탭으로 당겨서 채움 |
| issue OFF | 세그먼트 탭에서 '처리필요' 탭 제거 |
| claim OFF | 세그먼트 탭에서 '클레임' 탭 제거 |
| 현재 선택된 탭이 OFF됨 | `effectiveSingleColTab` 자동 교정 → visibleTabs[0] (첫 번째 visible 탭으로 전환) |
| 모든 탭 OFF | 탭 UI 자체 미노출 (visibleTabs.length === 0) |

**FE 구현 포인트:**
```tsx
const visibleTabs = (['feed', 'issue', 'claim'] as const).filter((k) => widgetVisibility[k]);
const effectiveSingleColTab = visibleTabs.includes(singleColTab) ? singleColTab : (visibleTabs[0] ?? 'feed');
```

### 14-6. KPI 하위 연동 정책 (60차 확정 — WidgetSelector.tsx / KpiCards.tsx)

> KPI 위젯은 상위('실시간 관리지표') + 하위 4종으로 구성됩니다.
> 상위와 하위 사이에 연동 규칙이 있습니다.

| 상황 | 동작 |
|---|---|
| 실시간 관리지표 토글 ON → OFF | 하위 4종(kpiTask·kpiIssue·kpiClaim·kpiRate) 모두 OFF |
| 실시간 관리지표 토글 OFF → ON | 하위 4종 모두 ON |
| 하위 4종 중 하나라도 ON | 실시간 관리지표 ON 유지 |
| 하위 4종 모두 OFF | 실시간 관리지표 자동 OFF |

**FE 구현 포인트 (`applyWidgetToggle` 함수, WidgetSelector.tsx):**
```tsx
export function applyWidgetToggle(prev: WidgetVisibility, key: keyof WidgetVisibility): WidgetVisibility {
  const next = { ...prev, [key]: !prev[key] };
  if (key === 'kpi') {
    // 상위 ON/OFF → 하위 전체 동기화
    KPI_SUB_KEYS.forEach((k) => { next[k] = next.kpi; });
  } else if (KPI_SUB_KEYS.includes(key as typeof KPI_SUB_KEYS[number])) {
    // 하위 변경 → 하나라도 ON이면 상위 ON
    next.kpi = KPI_SUB_KEYS.some((k) => next[k]);
  }
  return next;
}
```

**KpiCards.tsx:** `kpiVisibility` prop을 받아 `visKey`로 ON된 카드만 필터링하여 렌더.

**모바일 WidgetSelector 아코디언:**
- 상위 ON 상태에서만 하위 4종 아코디언 펼침 가능
- 상위 OFF 시 아코디언 자동 축소 (`maxHeight: kpiExpanded && currentVis.kpi ? 400 : 0`)

---

## 15. KPI 숫자 정책 (69차 수정 완료)

> KpiCards.tsx 집계 로직 기준. 코드 수정 시 이 섹션 필수 확인.
> **69차 확정 수치**: 업무현황 17건 / 미해결이슈 6건 / 미확인클레임 3건 / 달성률 15/44건(34%)

### 15-1. 업무 현황 (taskCount)

**69차 확정 수치: 17건** (PENDING 3 + ASSIGNED 5 + RESERVED 4 + STARTED 5)

| 티켓 상태 | 포함 | 이유 |
|---|---|---|
| PENDING | 포함 | 미배정 상태 — 처리 대기 중 |
| ASSIGNED | 포함 | 배정됨 — 수행 예정 |
| RESERVED | 포함 | 수행전 — 시작 대기 중 |
| STARTED | 포함 | 수행중 — 처리 진행 중 |
| REPORTED | 제외 | 보고됨 — issueticket으로 분리됨 |
| HOLD | 제외 | 보류 — 처리필요 위젯 보류 탭으로 분리됨 |
| RESOLVED | 제외 | 완료됨 |
| CANCELED | 제외 | 취소된 건은 업무 대상 아님 |

> **집계 조건 (69차 교체)**: `ticketStatus === 'PENDING' || ticketStatus === 'ASSIGNED' || ticketStatus === 'RESERVED' || ticketStatus === 'STARTED'`
> 이전 조건(`!== RESOLVED && !== CANCELED`)은 REPORTED·HOLD가 포함되는 버그가 있었으므로 명시적 열거 방식으로 교체.

### 15-2. 오늘 업무 달성률 (rate) — 69차 수정

- **분모(total)**: 피드 전체(27건) + 이슈 전체(9건) + 이슈HOLD 별도(2건) + 클레임 전체(6건) = **44건**
- **분자(completed)**: 피드 오늘 RESOLVED+CANCELED(10건) + 이슈 오늘 RESOLVED(3건) + 클레임 오늘 ACCEPTED+DISPUTE_COMPLETED(2건) = **15건**
- **달성률**: 15/44 = **34%**
- 이슈·클레임 완료 기준: `completedAt` 오늘 날짜 해당 건만 분자 포함 (D+1 00:00 리셋)

> **분모 보류 별도 카운트**: 이슈 HOLD 2건은 issueTotal(9건)과 별도로 holdTotal로 추가 집계. 이는 보류 이슈가 달성률 분모에 포함되어야 하지만 issueTotal에 이미 포함된 건과 중복되지 않도록 하기 위함.
>
> **클레임 분자 조건 (69차 교체)**: 이전 `=== 'COMPLETED'`(존재하지 않는 키)는 `=== 'ACCEPTED' || === 'DISPUTE_COMPLETED'`로 교체 완료.
>
> **completedAt 필드 주석**: `completedAt`은 **mock 전용 필드**. BE 연동 시 `resolvedAt`(완료) / `canceledAt`(취소)으로 교체하고 해당 주석을 삭제할 것. (issues.json·claims.json도 동일)

### 15-3. 미해결 이슈 (issueCount)

**69차 확정 수치: 6건** (REPORTED 4건 + HOLD 2건)

- 집계 조건: `issueStatus === 'REPORTED' || issueStatus === 'HOLD'`
- REPORTED(접수됨): 아직 처리되지 않은 이슈
- HOLD(보류): 취소가 아닌 재개 가능한 보류 상태 → 미해결로 집계

### 15-4. 미확인 클레임 (claimCount)

**69차 확정 수치: 3건** (PENDING 3건)

- 집계 조건: `claimStatus === 'PENDING'`
- ACCEPTED·DISPUTED·DISPUTE_COMPLETED는 처리됨으로 간주하여 제외

> **BE 참고:** 실서비스 전환 시 KPI 전용 엔드포인트 필요. 조건은 API 파라미터(`status=PENDING`)로 처리 권장.

### 15-5. mock dueAt 동적 계산 정책 (62차 확정 — 프로토타입 전용)

> FeedWidget.tsx `applyTodayDueAt()` 기준. 실서비스 연동 시 제거 대상.

| `_dueAt_role` | dueAt 계산 | 용도 |
|---|---|---|
| URGENT | NOW + `_urgentOffsetMin`분 | 임박 카드 |
| NORMAL | NOW + `_normalOffsetMin`분 (기본 90분) | 정상 카드 — 항상 미래 시각 보장 |
| PAST | 오늘 날짜 + 원본 시각(이미 지난 시각) | 지연 카드 |
| 없음 | 원본 그대로 | COMPLETED/CANCELLED 등 |

이전 NORMAL은 원본 시각(예: 22:00)을 오늘 날짜로 붙여 검수 시각에 따라 지연으로 잊못 판정되는 문제가 있었다. 이유: mock 원본 값이 고정 시각이었으며 검수 시각에 따라 지연으로 판정될 수 있었다. NOW + offset 방식으로 변경하여 항상 미래 시각이 보장되도록 함.

---

## 16. 클레임·이슈티켓 정의 (61차 확정)

### 16-1. 클레임 정의
클레임은 청소 완료 또는 수행 중 고객 요구로 운영자가 웹에 등록한 고객 불만 건.
클레임은 후속 업무(ticket)와 성격이 유사.
클래임으로 인해 후속 ticket이 오늘 생성된 경우 → 업무 현황 포함.
tickert이 발급되지 않은 클레임 → 업무 현황 미포함.

### 16-2. 이슈티켓 정의
이슈티켓은 ticket의 하위 개념.
비용이 발생하지 않는 일감 유형.
전체 업무 건수(업무 현황 KPI)에 미포함.

### 16-3. 업무 건수 집계 기준 원칙
업무 건수는 **비용이 발생하는 일감**을 기준으로 집계.
- 일반 ticket: 포함
- 클레임 후속 ticket(오늘 생성된 경우): 포함
- 이슈티켓(티켓 하위 개념): 미포함
- ticket이 발급되지 않은 클레임: 미포함

**필요한 것 (BE):** 이슈티켓과 일반 ticket 구분 필드 확정 필요. 클레임 후속 ticket 연결 필드(`claimId` 등) 및 오늘 생성 여부 판단 필드(`createdAt`) 확정 필요.

### 16-4. 혁재 프로토타입 미결 항목

| 미결 | 내용 | 우선순위 |
|---|---|---|
| 이슈티켓 구분 필드 | 일반 ticket과 이슈티켓 타입 분리 필드 | 폭 가 BE |
| 클레임 후속 ticket 연결 필드 | `claimId` 또는 동등 필드 | 포 가 BE |
| 오늘 생성 판단 필드 | `createdAt` 필드명 확정 | 포 가 BE |
| 보류 업무 현황 포함 여부 | 운영팀 확인 필요 | 포 가 운영팀 |

---

## 17. 정책서 작성 메타 정책 (61차 확정)

> **이 섹션은 클로드가 정책서를 작성할 때 반드시 따르는 지침입니다.**
> 사용자가 "정책서 작성해줘" + 이미지만 전달할 때도 이 섹션을 기준으로 작성.

### 17-1. 정책서 작성 원칙

**형식**
- 명사형 짧은 호흡으로 작성. 줄글 금지.
- 표는 가능한 최소화. 항목은 줄바꿈 후 명사형으로 나열.
- 영문 상태값은 한글 등가 표기. 예) REPORTED → 보고됨
- 개발 전용 용어는 사용자가 이해할 수 있는 표현으로 풀어서 기재.

**대상 독자**
- PM·디자이너·FE·BE 모두 읽을 수 있는 비기술적 언어 위주.
- 사용자가 실제로 무엇을 경험하는지 중심으로 설명.

**작성 범위 원칙 — 가장 중요**
이미지는 작성 대상을 지정하는 트리거일 뿐.
이미지에 보이지 않더라도 POLICY.md에 이미 확정된 연관 정책은 반드시 함께 포함.
예) TopBar 이미지 → TopBar 구성 전체 + 인증/인가 + 환경 유지 + 인가 변경 처리까지 포함.
예) 지점 탭 이미지 → 탭 동작 + 공간 그룹 선택 필터 + 위젯 설정 연동 정책까지 포함.

**구조**
```
[기능명]
  ├─ 기본 구성 (디폴트 상태)
  ├─ 선택/사용 시 사용자 경험
  ├─ 예외 정책
  ├─ case. 실제 시나리오 예시
  ├─ (검토필요) / (확인필요) / (향후검토) 미결 사항
  └─ **필요한 것 (주체, 시점):** 미구현 또는 실서비스 전환 시 필요 항목
```

**표기 원칙**
- 원 정책: 실서비스에서의 목표 동작.
- *프로토타입 적용:* 현재 구현 상태 (차이가 있을 때만 구분하여 반영).
- **필요한 것:** 미구현 항목에 볼드체로 주체와 시점을 함께 기재.

**PHASE1_POLICY.md 학습 패턴 (정책서 작성 시 이 파일 형식을 반드시 따를 것)**
- 소제목 아래 바로 상태 설명. 별도 도입 문장 없음.
- 원 정책 / 프로토타입 적용 구분은 차이가 있을 때만. 없으면 생략.
- 수치·문구·조건은 구체적으로 명시. 예) 최대 10자, 1.5초 디바운스, 토스트 문구 원문.
- (확인필요 — 주체) 형식으로 미결 사항 인라인 표기.
- 필요한 것은 (실서비스 전환 시, 주체) 형식으로 통일.
- 루프는 PM 의견 → 디자이너 검토 → FE 검토 → BE 검토 → 이견 시 재루프 순서. 클로드가 4개 역할을 한꺼번에 쓰지 않음.
- **맥락 연결 원칙**: 항목을 나열할 때 각 항목이 왜 이 위치에 있는지 처음 읽는 사람도 이해할 수 있도록 앞뒤 문장을 연결할 것.
  - 목적어 명시: 무엇에 대한 설명인지 대상을 반드시 포함. "한 건으로 집계" 가 아니라 "해당 일감을 한 건으로 집계".
  - 인과관계 명시: 왜 이 규칙이 존재하는지 이유를 함께 기재. "A이므로 B한다" 구조 사용.
  - 잘못된 예) "동일 일감이 두 조건에 동시 해당 시 한 건으로 집계(중복 제거)" — 무엇이 두 조건에 해당하는지, 왜 한 건으로 집계하는지 알 수 없음.
  - 올바른 예) "보고됨·미배정 상태의 일감이 지연/임박 조건에도 동시에 해당할 수 있다. 이 경우 동일 일감을 중복 집계하지 않고 한 건으로 처리한다."

### 17-2. 루프 방식 (다양한 다)

정책서 작성 시 항상 역할별 다양한 다(토론 루프)를 진행하여 합의할 때까지 반복.

| 역할 | 책임 | 검토 관점 |
|---|---|---|
| 편 PM | 사용자 자쭙 및 서비스 흐름 관점 | 이 정책으로 FE·BE·디자이너에게 가이드 줄 수 있는가? |
| 디자이너 | 사용자 환경·UI 관점 | 이 정책을 보고 UI를 알맞게 구현할 수 있는가? |
| FE | 코드 구현 관점 | 사용자 행동에 따른 다음 결과물을 개발할 수 있는가? |
| BE | API·새로가 관점 | 연동 구조와 부하를 이해할 수 있는가? |

합의 될 때까지 루프 반복 → 합의 후 볼드체로 **필요한 것** 기재 → 파일 저장.

### 17-3. 정책서 파일 관리 기준

| 파일 | 용도 |
|---|---|
| `docs/POLICY.md` | 전체 서비스 정책 단일 참고 소스. 서비스 전반 세로는 여기에 축적. |
| `docs/PHASE1_POLICY.md` | **정책서 작성 샘플 정본.** 다음 세션에서 정책서 작성 요청 시 이 파일을 먼저 읽고 형식·레벨·구조를 그대로 따를 것. |
| `docs/MOCK_GUIDE.md` | BE 연동 안내. 실서비스 연동 시 mock 제거 가이드. |
| `HANDOVER.md` | 세션 인수인계. POLICY.md 변경 시 함께 갱신. |

> **클로드 권장 작업 순서:**
> 1. 이미지 확인
> 2. 관련 코드 읽기 (filesystem MCP)
> 3. POLICY.md 해당 섹션 확인
> 4. 루프 진행 (PM·디자이너·FE·BE 동시 검토)
> 5. 합의 후 정책서 작성
> 6. POLICY.md 업데이트 후 HANDOVER 업데이트


---

## 18. 65·66차 확정 정책 (2026-03-30)

> 65·66차 코드리뷰 루프 + 수정 작업에서 확정된 정책들입니다.

### 18-1. 배포 정책 (65차 확정)

| 항목 | 값 |
|---|---|
| 로컬 개발 경로 | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_ts` |
| Vercel 배포 경로 | `/Users/grey/Desktop/local_grey/web/react/prototype_dashboard_phase` |
| git repo | `github.com/grey-dotcom/local_grey` (`dev` 브랜치) |
| Vercel Root Directory | `web/react/prototype_dashboard_phase` |
| Vercel URL | `https://prototype-dashboard-ten.vercel.app/` |
| 배포 방법 | `local_grey` 루트에서 `git add/commit/push origin dev` |

- `prototype_dashboard_ts`(dev)는 Vercel 빌드 대상 아님 — 절대 수정 금지
- `prototype_dashboard_phase`의 파일 수정 후 `dev` 브랜치에 push하면 Vercel 자동 재배포

### 18-2. 배지 정책 통일 (65차 확정)

FeedCard·IssueCard·ClaimCard 배지 행 정책 통일:
- `flexWrap: wrap` + `overflow: visible` 적용 (62차 기준)
- 배지 개별: `whiteSpace: nowrap` + `flexShrink: 0` 유지
- ClaimCard: 59차 `nowrap+hidden` → 65차에서 62차 최신 정책으로 업데이트

### 18-3. ConfirmModal confirmVariant 정책 (65차 확정)

| 액션 유형 | confirmVariant | 확인 버튼 색상 |
|---|---|---|
| 파괴적 액션 (완료처리·취소·보류) | `error` | `#D32F2F` |
| 일반 상태 변경 (대기처리·확정 등) | `primary` | `#1976D2` |

- 적용 파일: `IssueCard.tsx`, `ClaimCard.tsx`
- `FeedCard.tsx`: 향후 동일 정책 적용 예정 (현재는 기존 방식 유지)

**IssueCard 팝업별 variant:**
- 보류 → `error`
- 완료 처리 → `error`
- 대기 처리 → `primary`
- 확정 → `primary`

**ClaimCard 팝업별 variant:**
- 완료 처리 → `error`

### 18-4. 세그먼트 탭 카운트 정책 (65차 확정)

- 1열 모바일 세그먼트 탭의 카운트 = 각 위젯 ALL 필터 기준 총 카드 수
- 하드코딩(7/2/1) 제거 → 실시간 state로 교체 완료 (65차)
- 구현: `FeedWidget`/`IssueWidget`/`ClaimWidget`에 `onCountChange?: (count: number) => void` prop 추가
- `page.tsx`에서 `feedCount`/`issueCount`/`claimCount` state로 실시간 수신
- `useCallback`으로 memoize → 불필요한 리렌더 방지

### 18-5. 미확인 건 찾기 기능 정의 (65차 PM 확정)

- **기능 정의**: 전체 위젯 중 NEW 배지가 붙은 카드만 필터링해서 노출하는 필터 기능
- **현재 상태**: 미개발 (향후 작업 리스트 등록)
- **구현 시점**: Phase 3 개발 시 진행

### 18-6. 메모 남기기 정책 (65차 PM 확정)

- **현재 상태**: 미개발
- **구현 조건**: 계정 인가 관련 세부 정책 확정 후 개발
- **구현 시점**: Phase 3+4 완료 후

### 18-7. POLICY.md 수정 규칙 (65차 교훈 — 절대 준수)

**원인**: POLICY.md 헤더 수정 시 `write_file`에 2줄만 담아 파일 전체 초기화 (65차 사고)
**규칙**: POLICY.md 수정 시 반드시 기존 전체 내용을 read 후 원하는 부분만 변경하여 write_file
- edit_file 시도 → 실패 시 전체 read → 변경분 포함하여 write_file
- 절대로 부분 내용만 담아 write_file 금지

### 18-8. 추가 작업 리스트 (65·66차 기준)

**FE 코드 수정 (완료/잔여):**
| ID | 내용 | 상태 |
|---|---|---|
| ~~FE-R4~~ | ~~IssueCard ON_HOLD 배지 추가~~ | ✅ 66차 완료 |
| FE-R5 | KpiCards `any` 타입 → `IssueReport[]`/`ClaimReport[]` 타입으로 교체 | 향후 |
| FE-R6 | `applyTodayDueAt` 중복 구현(FeedWidget/KpiCards) → 공통 유틸로 분리 | 향후 |
| ~~FE-R7~~ | ~~`desktopCols` 반응형 탭 전환 분기 누락 → `page.tsx` 수정 필요~~ | ✅ 69차 확인 완료 — 구현 기확인 |
| ~~FE-R17~~ | ~~`mockStore.clearAllMockData`에서 `feed_new_*` 키 누락~~ | ✅ 66차 완료 |

**BE 실 서비스 연동 시 필수:**
- `TicketStatus` 프로토타입↔BE 매핑 테이블 문서화 (§9-1 보완)
- `photoUrls` → `PhotoSource[]` 전환 (§9-3 참고)
- `alertMessages` 필드명 BE 확정 (B14·B15)

**PM 정책 결정 필요:**
- IssueCard ON_HOLD 다음 액션 (처리필요 개발 시)
- 세그먼트 탭 카운트 기준 — ALL vs 미처리만 (현재 ALL로 구현)

### 18-9. 66차 확인 및 수정 내용 (2026-03-30)

#### FeedCard 버그 B — mock 데이터 수정
- **버그**: `W1-TCKT-019`(SVG8 케이스 의도)의 feedbackText가 텍스트를 보유해 SVG9(메모 있음)처럼 읽기 전용 박스가 노출됨
- **해결**: `W1-TCKT-019` feedbackText → `null`로 수정. SVG8(메모 없음) 케이스 검수 정상화.
- **파일**: `src/mocks/feed.json`

#### FeedCard 버그 C — opacity 조건 불일치
- **버그**: 키퍼명+위치 행 opacity 조건에 `wasDelayedBeforeComplete` 체크 누락 → 완료+지연 카드에서 헤더 opacity 1 vs 키퍼명 행 opacity 0.4 불일치
- **해결**: `isCompleted && !delayUrgent ? 0.4 : 1` → `isCompleted && !delayUrgent && !wasDelayedBeforeComplete(ticket.dueAt) ? 0.4 : 1`
- **파일**: `FeedCard.tsx`

#### mockStore.ts 헤더 주석 보완
- **내용**: 파일 헤더 localStorage 키 목록에 `feed_new_w1 / feed_new_w2` 및 `issues_mock / claims_mock` 추가
- **파일**: `src/utils/mockStore.ts`

#### IssueCard ON_HOLD 배지 정책 (66차 확정)
- `getStatusBadge`에 `ON_HOLD → 보류 (bg #FEEBEE / color #FF1744)` 케이스 추가
- `isOnHold` 상태에서 액션 버튼 미노출 (`!isCompleted && !isOnHold && nextAction` 조건)
- ClaimCard에 ON_HOLD 없음: 의도된 설계. ClaimReport는 `PENDING`/`COMPLETED`만 정의.
- **파일**: `IssueCard.tsx`

---

## 19. 67·68차 확정 정책 (2026-03-30~31) — 상태값 전면 재정의

> 상세 내용: `docs/STATUS_POLICY.md` 전체 참조.

### 19-1. 배경

67차 세션에서 BE 개발서버(`indicator.test.11h.kr`) 실측을 통해 프로토타입의 상태값 키가 BE 원본과 대규모 불일치하는 것을 확인. 완전 대체 방식으로 통일 확정. 68차에 코드 교체 완료.

### 19-2. TicketStatus 키 완전 교체 확정 (68차 완료)

| 교체 전 (구) | 교체 후 (현재 코드) | 한글 |
|---|---|---|
| `UNASSIGNED` | `PENDING` | 미배정 |
| `BEFORE_START` | `RESERVED` | 수행전 |
| `IN_PROGRESS` | `STARTED` | 수행중 |
| `COMPLETED` | `RESOLVED` | 완료 |
| `CANCELLED` | `CANCELED` | 취소 |
| `ON_HOLD` | `HOLD` | 보류 |
| `REPORTED` | `REPORTED` | 보고됨 (유지) |
| `ASSIGNED` | `ASSIGNED` | 배정됨 (유지) |

### 19-3. IssueStatus 재정의 — TicketReportStatus 채택

IssueWidget은 BE의 `TicketReportStatus` enum을 기준으로 함 (BE 실측 확인).

| 교체 전 (구) | 교체 후 (현재 코드) | 한글 |
|---|---|---|
| `RECEIVED` | `REPORTED` | 접수됨 |
| `PENDING` | — 제거 | 이슈 상태에 없음 |
| `CONFIRMED` | `RESOLVED` | 완료(확인) |
| `ON_HOLD` | `HOLD` | 보류 |
| — | `CANCELED` | 취소 (신규 추가) |

IssueCard 버튼 흐름: **접수(REPORTED) → 완료(RESOLVED) / 보류(HOLD)** (3단계 → 2단계 단순화)

### 19-4. ClaimStatus 확장 (68차)

`PENDING`(처리 대기) / `ACCEPTED`(인정완료) / `DISPUTED`(이의제기) / `DISPUTE_COMPLETED`(이의제기완료) 4종.

⚠️ `ACCEPTED`·`DISPUTED`·`DISPUTE_COMPLETED` BE 키 미확정 — BE `/shared/v1/ticket-claim-statuses` 실측 후 교체 필요.

### 19-5. 위젯별 enum 채택 기준

| 위젯 | enum | 분류 |
|---|---|---|
| FeedWidget | `TicketStatus` | BE `/shared/v1/ticket-statuses` |
| IssueWidget | `IssueStatus` (= `TicketReportStatus`) | BE `/shared/v1/ticket-report-statuses` |
| ClaimWidget | `ClaimStatus` | 4종 확장 (BE 키 미확정 포함) |

### 19-6. dashboard.ts 수정 권한 (67차~)

`src/types/dashboard.ts`: Claude Desktop 수정 가능 (상태값 키 교체 작업 한정). Claude Code 수정 금지 유지.

### 19-7. 개발자 피드백 대응 기록 (68차)

개발자단의 "BEFORE_START 등 상태값이 없다", "이슈 대기 없다", "클레임 2종 아니다" 피드백은 67·68차 작업 **이전 코드**를 기준으로 한 것. 68차에서 BE 원본 키로 전면 교체 완료됨. 상세: `docs/STATUS_POLICY.md §9`.
