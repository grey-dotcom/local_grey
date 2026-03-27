# Mock 데이터 개발자 안내

> 이 문서는 프로토타입 → 실 서비스 연동 시 개발자에게 전달하기 위한 안내입니다.

---

## mock 데이터란?

`src/mocks/`의 JSON 파일들과 `mockStore.ts`는 BE API 없이 화면을 동작시키기 위한
**프로토타입 전용 임시 로컬 데이터**입니다.

실 서비스에서는 이 데이터가 BE API에서 직접 내려오기 때문에
mock 관련 파일과 로직은 **전혀 볼 필요가 없습니다.**

---

## 실 서비스 연동 시 무시하거나 삭제해도 되는 것

| 파일/폴더 | 설명 |
|---|---|
| `src/mocks/` | 전체 폴더 — JSON 샘플 데이터 전부 |
| `src/utils/mockStore.ts` | mock 데이터 로드 유틸 |
| `FeedWidget.tsx` 내 `applyTodayDueAt()` | 날짜 자동 재계산 함수 (mock 전용) |
| `.env.local`의 `NEXT_PUBLIC_USE_MOCK=true` | `false`로 변경 또는 삭제 |

---

## 실 서비스 연동 시 봐야 할 것

| 파일 | 설명 |
|---|---|
| `src/types/dashboard.ts` | API 응답 타입 정의. 필드 매핑 주석(`←`) 포함 |
| `src/components/dashboard/*.tsx` | 화면 컴포넌트. 연동 포인트는 `[BE 연동 시]` 주석으로 표시 |
| `src/stores/dashboardStore.ts` | 필터·모달 상태 관리 |
| `docs/POLICY.md` | 서비스 정책 전체 |

---

## 연동 전환 방법 (요약)

1. `.env.local` → `NEXT_PUBLIC_USE_MOCK=false`
2. 각 컴포넌트에서 `loadMockFeed` 호출부를 실제 API fetch로 교체
3. `FeedWidget.tsx`의 `applyTodayDueAt()` 호출 한 줄 제거
4. `src/mocks/` 폴더 삭제 (선택)

> BE API 엔드포인트: `https://indicator.11h.kr/page-dashboard/v1/ticket-reports`
> 쿼리 파라미터: `roomGroupIds={id}&filter={feedFilter}&sort=LATEST&page=0&size=20`

---

## mock 파일별 주의사항

### staffAuth.json — `isHeadquarter` vs `authority` 필드

`src/mocks/staffAuth.json`에는 `isHeadquarter`와 `authority` 두 필드가 함께 존재합니다.

```json
{
  "isHeadquarter": true,
  "authority": "HEADQUARTER",
  ...
}
```

**RBAC 판단 기준은 `authority` 단일 필드입니다.**

| 필드 | 역할 | 비고 |
|---|---|---|
| `authority` | RBAC 권한 판단 유일 기준 | `HEADQUARTER / SUDO / ADMIN / MANAGER / NONE` |
| `isHeadquarter` | BE 원본 응답에 포함된 부가 정보 | 프론트에서 권한 분기 시 사용하지 않음 |

`isHeadquarter: true`와 `authority: "HEADQUARTER"`는 같은 상태를 표현하는 중복 필드입니다.
프론트엔드 코드(`rbac.config.ts`, `BLOCKED_AUTHORITIES`, 메뉴 접근 제어 등)는 모두
`staffAuth.authority` 값만 참조합니다. `isHeadquarter`는 무시해도 됩니다.

### workspaces.json + roomGroups.json — 그레이 테스트 2 워크스페이스

`그레이 테스트 2` 워크스페이스(WORK01...X3)는 **RBAC 워크스페이스 접근 검증 테스트 전용**입니다.

로그인 후 SubSidebar의 워크스페이스 드롭다운에서 `그레이 테스트 2`로 전환하면
해당 워크스페이스의 지점(마포점·용산점·인천점)만 접근 가능하도록 필터링되는 동작을 확인할 수 있습니다.
별도 보완 없이 의도된 구조입니다.

---

## 공지사항 닫기 동작 (프로토타입)

현재 공지 X 버튼 클릭 시 **React state에만 저장**합니다.
→ 새로고침 또는 재방문 시 공지가 항상 다시 노출됩니다.

실서비스 전환 시 `NoticeBanner.tsx`의 `dismissed` state를 `localStorage` 또는 서버 저장 방식으로 교체하세요.
