# Claude Desktop 작업 요청 — IssueWidget/ClaimWidget 통합 (3건)

> 작성일: 2026-03-27 | 작성자: Claude Code (서브)
> 대상 파일: `IssueWidget.tsx`, `ClaimWidget.tsx`
> 참고: POLICY.md, HANDOVER.md, authStore.ts, mockStore.ts

---

## 배경 — Claude Code가 작업한 내용

Claude Code가 IssueWidget/ClaimWidget에 **기초 UI**를 구현했습니다:
- mock JSON 직접 import → `useState`로 로컬 상태 관리
- 필터 탭 (IssueFilter 4종 / ClaimFilter 3종) + 카운트
- IssueCard / ClaimCard 카드 렌더링 + 상태변경 액션 버튼
- 높이 정책(§6), Empty 상태(§6-7), 배지 줄바꿈(§12-5) 등 정책 반영 완료

**단, Claude Code는 `authStore.ts`와 `utils/mockStore.ts`에 접근할 수 없어서** 아래 3건이 미반영 상태입니다.

---

## 작업 1: 지점 필터(roomGroup) 연동

### 현재 상태 (Claude Code)
```tsx
// IssueWidget.tsx — 전체 이슈를 필터 없이 표시
const [allIssues, setAllIssues] = useState<IssueReport[]>(
  (issuesMock.content ?? []) as IssueReport[]
);
const filtered = filterIssues(allIssues, activeFilter);
```

### 문제
DashboardHeader에서 지점을 선택하면 FeedWidget은 해당 지점만 표시하지만, IssueWidget/ClaimWidget은 **전체 데이터를 계속 표시**합니다.

### 해야 할 것
FeedWidget의 `roomFilteredTickets` 패턴을 IssueWidget/ClaimWidget에 적용:

```tsx
// FeedWidget 참고 패턴 (FeedWidget.tsx:245-295)
const staffAuth            = useAuthStore((s) => s.staffAuth);
const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

// roomGroup 필터링 (FeedWidget.tsx:289-295)
const roomFilteredTickets = useMemo(() => {
  if (activeTabGroupId)
    return allTickets.filter((t) => t.roomGroupId === activeTabGroupId);
  if (selectedRoomGroupIds.length > 0)
    return allTickets.filter((t) => selectedRoomGroupIds.includes(t.roomGroupId ?? ''));
  return allTickets;
}, [allTickets, activeTabGroupId, selectedRoomGroupIds]);
```

**IssueWidget에 적용할 방식:**
```tsx
import { useAuthStore } from '@/stores/authStore';

// 컴포넌트 내부
const activeTabGroupId     = useAuthStore((s) => s.activeTabGroupId);
const selectedRoomGroupIds = useAuthStore((s) => s.selectedRoomGroupIds);

// allIssues에서 roomGroup 필터 적용
const roomFilteredIssues = useMemo(() => {
  if (activeTabGroupId)
    return allIssues.filter((i) => i.roomGroupId === activeTabGroupId);
  if (selectedRoomGroupIds.length > 0)
    return allIssues.filter((i) => selectedRoomGroupIds.includes(i.roomGroupId));
  return allIssues;
}, [allIssues, activeTabGroupId, selectedRoomGroupIds]);

// 기존 filterIssues를 roomFilteredIssues 기준으로 적용
const filtered = filterIssues(roomFilteredIssues, activeFilter);
```

**ClaimWidget도 동일 패턴** — `allClaims` → `roomFilteredClaims` → `filterClaims` 순서.

### 주의사항
- `IssueReport`와 `ClaimReport` 모두 `roomGroupId: string` 필드가 있음 (타입 확인됨)
- `useMemo` import 필요 (`react`에서)
- 탭 카운트도 `roomFilteredIssues`/`roomFilteredClaims` 기준으로 변경해야 함
  - 현재: `getTabCount(allIssues, tab.key)` → 변경: `getTabCount(roomFilteredIssues, tab.key)`

---

## 작업 2: 워크스페이스별 mock 로드

### 현재 상태 (Claude Code)
```tsx
// IssueWidget.tsx — JSON 직접 import (워크스페이스 무관)
import issuesMock from '@/mocks/issues.json';

const [allIssues, setAllIssues] = useState<IssueReport[]>(
  (issuesMock.content ?? []) as IssueReport[]
);
```

### 문제
FeedWidget은 `loadMockFeed(workspaceId)`로 워크스페이스별 데이터를 로드하지만, IssueWidget/ClaimWidget은 JSON을 직접 import하여 **워크스페이스 전환이 반영되지 않습니다.**

### 해야 할 것
FeedWidget의 mock 로드 패턴을 적용:

```tsx
// FeedWidget 참고 패턴 (FeedWidget.tsx:263-275)
useEffect(() => {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true') return;
  const workspaceId = staffAuth?.workspaceId;
  if (!workspaceId) return;
  setLoading(true);
  loadMockFeed(workspaceId).then((res) => {
    setAllTickets(res.content as TicketReport[]);
    setLoading(false);
  });
}, [staffAuth?.workspaceId]);
```

**IssueWidget에 적용할 방식:**
```tsx
import { loadMockIssues } from '@/utils/mockStore';

// JSON 직접 import 제거
// import issuesMock from '@/mocks/issues.json';  ← 삭제

const staffAuth = useAuthStore((s) => s.staffAuth);
const [allIssues, setAllIssues] = useState<IssueReport[]>([]);
const [loading, setLoading]     = useState(true);

useEffect(() => {
  if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true') return;
  setLoading(true);
  loadMockIssues().then((res) => {
    setAllIssues(res.content as IssueReport[]);
    setLoading(false);
  });
}, [staffAuth?.workspaceId]);
```

**ClaimWidget도 동일** — `loadMockClaims()` 사용.

### 주의사항
- `mockStore.ts`의 `loadMockIssues`/`loadMockClaims`는 **워크스페이스 파라미터 없음** (현재 단일 키 `issues_mock`/`claims_mock` 사용)
- W2 별도 파일 분리는 미결 이슈(POLICY §8) — 현재는 단일 파일로 충분
- `loading` 상태 추가 시 Empty 렌더링 분기에 `!loading &&` 조건 추가 필요:
  ```tsx
  {loading && <div style={{...}}>로딩 중...</div>}
  {!loading && filtered.length === 0 && ( /* Empty UI */ )}
  {!loading && filtered.length > 0 && ( /* Card list */ )}
  ```

---

## 작업 3: IssueFilter ON_HOLD 필터 로직 수정

### 현재 상태 (Claude Code)
```tsx
// IssueWidget.tsx — 기초 필터 로직
function filterIssues(issues: IssueReport[], filter: IssueFilter): IssueReport[] {
  switch (filter) {
    case 'ALL':       return issues;
    case 'ISSUE':     return issues.filter(i => i.issueStatus !== 'COMPLETED');
    case 'ON_HOLD':   return issues.filter(i => i.issueStatus === 'PENDING');  // ⚠️
    case 'COMPLETED': return issues.filter(i => i.issueStatus === 'COMPLETED');
    default:          return issues;
  }
}
```

### 문제
- `ON_HOLD` 탭(라벨: "보류")이 `issueStatus === 'PENDING'`으로 필터링
- `PENDING`은 "대기"이지 "보류"가 아님 — 의미가 다름
- `IssueReport.issueStatus`에는 `ON_HOLD` 값 자체가 없음 (RECEIVED/PENDING/CONFIRMED/COMPLETED만 존재)

### 해야 할 것
PM/BE와 협의하여 다음 중 하나를 결정:

**옵션 A**: `IssueReport.issueStatus`에 `ON_HOLD` 값을 추가하고 mock 데이터에 반영
```tsx
// types/dashboard.ts
issueStatus:
  | 'RECEIVED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'ON_HOLD'     // ← 추가
  | 'COMPLETED';

// 필터 로직
case 'ON_HOLD': return issues.filter(i => i.issueStatus === 'ON_HOLD');
```

**옵션 B**: ON_HOLD 탭 자체를 제거하고 필터를 재정의 (예: 전체/접수/대기/확정/완료)

**옵션 C**: 현재 PENDING 매핑을 유지하되 탭 라벨을 "대기"로 변경

### 주의사항
- `types/dashboard.ts` 수정 시 IssueCard의 `getStatusBadge`에도 ON_HOLD 케이스 추가 필요
- mock 데이터(`issues.json`)에 ON_HOLD 상태 샘플 추가 필요
- POLICY.md §12 ON_HOLD 정의 참고: "진행 중 클레임 등으로 일시 중단된 건. 재개 가능성 있음 (59차 정의 추가)"

---

## Claude Code 작업물 현재 파일 구조

```
src/components/dashboard/
├── IssueWidget.tsx    ← Claude Code 수정 (mock 연결 + 필터 + 카드 렌더링)
├── IssueCard.tsx      ← Claude Code 전면 작성 (배지 + 알림박스 + 액션 버튼 + ConfirmModal)
├── ClaimWidget.tsx    ← Claude Code 수정 (mock 연결 + 필터 + 카드 렌더링)
├── ClaimCard.tsx      ← Claude Code 신규 생성 (IssueCard 동일 패턴)
├── FeedWidget.tsx     ← Claude Desktop (미수정)
├── FeedCard.tsx       ← Claude Desktop (미수정)
└── ...기타            ← Claude Desktop (미수정)
```

### Claude Code가 수정한 부분 요약
- **IssueWidget**: `useState`로 이슈 로컬 상태 관리, `handleStatusChange` 콜백, 필터 탭 FeedWidget 공통 스펙 적용
- **ClaimWidget**: 동일 패턴 + `ClaimCard` 연결 + "클레임 등록" 버튼 추가
- **IssueCard**: FeedCard 패턴 이식 (nowrap 배지, hover 버튼, ConfirmModal, 반응형 사이즈)
- **ClaimCard**: IssueCard와 동일 구조, 클레임 전용 상태/색상

### 수정 시 주의
- IssueWidget/ClaimWidget의 **헤더/탭 디자인은 FeedWidget 공통 스펙으로 통일 완료** — 변경 불필요
- IssueCard/ClaimCard의 **카드 내부 구조는 변경 가능** (Claude Code → Claude Desktop 영향 허용)
- `page.tsx`의 세그먼트 탭 카운트 (하드코딩 7/2/1)는 별도 작업
