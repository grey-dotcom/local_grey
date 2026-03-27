# 📋 prototype_dashboard_ts — 서비스 정책 문서
> 작성일: 2026-03-19 | 최종 업데이트: 2026-03-23 (13차) | 이 문서는 각 세션에서 확정된 정책의 단일 참고 소스입니다.
> 코드 주석과 병행 관리 — 정책 변경 시 이 파일과 해당 파일 주석을 함께 수정할 것.

---

## 0. 공지사항 배너 정책 (2026-03-23 확정)

### 0-1. 위치 및 여백
| 환경 | top bar(탭) 하단 여백 | 집계 레이아웃 title 상단 여백 |
|---|---|---|
| 웹 (> 1,061px) | 24px | 40px |
| 모바일 (≤ 1,061px) | 20px | 20px |

- DashboardHeader(탭) 바로 아래, 콘텐츠 영역 위에 위치
- 배너가 없으면 여백 없이 콘텐츠가 위로 올라옴

### 0-2. 구성 요소
| 요소 | 설명 |
|---|---|
| 아이콘 | 🔔 종형 (32px 웹 / 20px 모바일) |
| 상태값 배지 | 알림 / 점검 / 긴급 / 업데이트 (흰 배경, 회색 텍스트) |
| 타이틀 | 일반 흰색 + markKeywords는 `#FFEB3B` 강조 |
| 일정 | 흰색 regular 텍스트 |
| [자세히 보기] | `#00C853` 버튼 → `/notice/[id]` 라우팅 |
| [종료 X] | 배너 닫기 → sessionStorage에 ID 저장 |

### 0-3. 노출 정책
- `isActive = true` 인 공지만 표시
- sessionStorage `dismissed_notices` 배열에 저장된 ID는 미노출
- 여러 개: 캐러셀 방식 (인디케이터 도트, 한 번에 1개)
- 모든 공지 닫히면 배너 영역 전체 사라짐 (레이아웃 위로 올라감)

### 0-4. 종료(X) 정책
- 세션 동안 닫힘 유지 (새로고침 시 미노출)
- 브라우저 탭 닫으면 sessionStorage 초기화 → 재진입 시 다시 노출

### 0-5. 상세 페이지 정책
- 경로: `/notice/[id]` (별도 라우트)
- 구성: 그라디언트 헤더(상태배지 + 타이틀 + 일정) + 콘텐츠(텍스트/이미지/파일)
- 게시판(목록) 없음 — 대시보드 배너에서만 진입 (추후 게시판 구현 예정)
- 하단 [대시보드로 돌아가기] → `router.push('/')` 로 복귀
- 상단 [돌아가기] → `router.back()` 으로 복귀

### 0-6. 피그마 디자인 스펙
| 항목 | 웹 | 모바일 |
|---|---|---|
| 배너 높이 | 84px | 카드형 (auto) |
| 배경 | `linear-gradient(135deg, #1763FD 0%, #008B76 100%)` | 동일 |
| 타이틀 폰트 | 20px / 700 | 16px / 700 |
| 일정 폰트 | 20px / 400 | 14px / 400 |
| 강조색 | `#FFEB3B` | 동일 |
| 자세히 보기 | `#00C853` / 120×40px / radius 8px | full-width / 40px |
| X 버튼 | 흰색 SVG 24px | 흰색 SVG 20px |
| radius | 8px | 8px |

### 0-7. 구현 파일
- `src/types/notice.ts` — 타입 정의
- `src/mocks/notices.json` — mock 데이터
- `src/components/notice/NoticeBanner.tsx` — 배너 컴포넌트
- `src/app/(dashboard)/notice/[id]/page.tsx` — 상세 페이지
- `src/app/(dashboard)/home/page.tsx` — 배너 마운트

### 0-8. BE 연동 가이드
```
GET /shared/v1/notices        → Notice[] (isActive 기준 필터링은 서버에서 처리)
GET /shared/v1/notices/:id    → Notice 단건
```

---

