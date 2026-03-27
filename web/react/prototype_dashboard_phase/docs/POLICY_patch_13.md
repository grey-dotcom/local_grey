># 📋 prototype_dashboard_ts — 서비스 정책 문서

이 파일은 패치 노트입니다. 본문은 POLICY.md를 참고하세요.

## 13차 패치 (2026-03-23)

### § 5-2 추가 — 지점 선택 초기화 정책

지점 선택(드롭다운/바텀시트)을 열 때 상태:

| 상황 | 상태 |
|---|---|
| 첫 진입 (디폴트) | 미선택 (아무것도 체크 안 됨) |
| 일부 지점 적용 후 다시 열기 | **미선택으로 리셋** (이전 선택값 무관) |
| 전체 선택 적용 후 다시 열기 | **미선택으로 리셋** |

전체로 되돌리는 방법:
→ 지점 선택 진입(미선택 상태) → "전체" 체크 → 적용/외부클릭
→ `selectedRoomGroupIds = []` → top bar 전체 지점 표시

### § 5-2 추가 — 웹 드롭다운 전체 행
RoomGroupSelector에 전체 체크박스 행 추가 (바텀시트와 동일 구조)
- 검색어 없을 때만 표시
- 외부 클릭 시 반영 (기존 트리거 방식 유지)
- 전체 선택 → `selectedRoomGroupIds = []`

### 변경 파일
- `src/components/dashboard/RoomGroupSelector.tsx` — 전체 행 추가, 열릴 때 빈 상태 초기화
- `src/components/dashboard/RoomGroupBottomSheet.tsx` — 열릴 때 빈 상태 초기화 (selectedIds 의존성 제거)
