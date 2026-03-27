/**
 * @file types/notice.ts
 * @description 공지사항 타입 정의
 *
 * ─ 정책 (2026-03-23 확정) ────────────────────────────────────────────────
 *   - 배너: 여러 개 순서대로 캐러셀 표시 (최신순)
 *   - 종료(X): 세션 동안 닫힘 유지 (sessionStorage 활용)
 *   - 자세히 보기: /notice/[id] 별도 라우트로 이동
 *   - 상세 구성: 상태값 + 타이틀 + 일정 + 콘텐츠(텍스트·이미지·파일)
 *   - 상세에서 종료 → 대시보드로 복귀
 *
 * ─ BE 연동 가이드 ─────────────────────────────────────────────────────────
 *   GET /shared/v1/notices          → 활성 공지 목록 (최신순)
 *   GET /shared/v1/notices/:id      → 공지 상세
 */

export type NoticeStatus = '알림' | '점검' | '긴급' | '업데이트';

export interface NoticeContentBlock {
  type: 'text' | 'image' | 'file';
  value: string;        // 텍스트 내용 | 이미지 URL | 파일 URL
  label?: string;       // 파일명 (type=file일 때)
  alt?: string;         // 이미지 alt (type=image일 때)
}

export interface Notice {
  id: string;
  status: NoticeStatus;
  title: string;        // 강조 키워드 포함 (markKeywords로 파싱)
  markKeywords?: string[]; // 노란색 강조 키워드 목록
  schedule: string;     // "2026년 02월 23일 / 오후 9시 부터 10시까지"
  content: NoticeContentBlock[];
  createdAt: string;    // ISO 날짜
  isActive: boolean;
}
