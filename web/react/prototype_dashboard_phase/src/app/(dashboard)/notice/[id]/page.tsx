/**
 * @file app/(dashboard)/notice/[id]/page.tsx
 * @description 공지사항 상세 페이지
 *
 * ─ 진입 경로 ─────────────────────────────────────────────────────────────
 *   NoticeBanner [자세히 보기] → /notice/[id]
 *
 * ─ 구성 ──────────────────────────────────────────────────────────────────
 *   상단: 그라디언트 헤더 (상태배지 + 타이틀 + 일정)
 *   본문: 콘텐츠 블록 (텍스트 / 이미지 / 파일)
 *   하단: [닫기] 버튼 → 대시보드(/)로 복귀
 *
 * ─ 정책 ──────────────────────────────────────────────────────────────────
 *   - 상세 페이지는 별도 라우트 (게시판 목록 없음, 추후 구현)
 *   - 닫기 → router.back() or router.push('/') 로 대시보드 복귀
 *   - [BE 연동 가이드] GET /shared/v1/notices/:id 로 교체
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Notice } from '@/types/notice';

/* ── 타이틀 강조 렌더링 ─────────────────────────────────────────────────── */
function HighlightTitle({
  title,
  keywords = [],
  fontSize,
  lineHeight,
}: {
  title: string;
  keywords?: string[];
  fontSize: number;
  lineHeight: string;
}) {
  if (!keywords.length) {
    return (
      <span style={{ color: 'white', fontSize, fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: 700, lineHeight }}>
        {title}
      </span>
    );
  }
  const pattern = new RegExp(
    `(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );
  const parts = title.split(pattern);
  return (
    <span style={{ fontFamily: 'Pretendard, Noto Sans KR, sans-serif', fontWeight: 700, lineHeight, wordBreak: 'keep-all' }}>
      {parts.map((part, i) =>
        keywords.includes(part) ? (
          <span key={i} style={{ color: '#FFEB3B', fontSize }}>{part}</span>
        ) : (
          <span key={i} style={{ color: 'white', fontSize }}>{part}</span>
        )
      )}
    </span>
  );
}

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  /* mock 데이터 로드
   * [BE 연동 가이드] fetch(`/shared/v1/notices/${id}`) 로 교체
   */
  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
    if (!useMock || !id) { setLoading(false); return; }

    import('@/mocks/notices.json').then((mod) => {
      const found = (mod.default as Notice[]).find((n) => n.id === id) ?? null;
      setNotice(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5' }}>
        <span style={{ fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: 'rgba(0,0,0,0.38)', fontSize: 14 }}>
          불러오는 중...
        </span>
      </div>
    );
  }

  if (!notice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F5F5', gap: 16 }}>
        <span style={{ fontFamily: 'Pretendard, Noto Sans KR, sans-serif', color: 'rgba(0,0,0,0.60)', fontSize: 16 }}>
          공지사항을 찾을 수 없습니다.
        </span>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#1976D2', color: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
          }}
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>

      {/* ── 상단 그라디언트 헤더 ──────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1763FD 0%, #008B76 100%)',
          padding: '0 24px',
        }}
      >
        {/* 내비게이션 바 */}
        <div
          style={{
            height: 56, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'white', padding: '4px 0',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 500, fontFamily: 'Pretendard, Noto Sans KR, sans-serif' }}>
              돌아가기
            </span>
          </button>

          {/* 상태 배지 */}
          <span
            style={{
              background: 'white', borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
              color: '#606060', lineHeight: '16px',
            }}
          >
            {notice.status}
          </span>
        </div>

        {/* 타이틀 + 일정 */}
        <div style={{ paddingBottom: 32, paddingTop: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <HighlightTitle
              title={notice.title}
              keywords={notice.markKeywords}
              fontSize={22}
              lineHeight="34px"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              style={{
                color: 'rgba(255,255,255,0.85)', fontSize: 14,
                fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                fontWeight: 400, lineHeight: '20px',
              }}
            >
              {notice.schedule}
            </span>
          </div>
        </div>
      </div>

      {/* ── 콘텐츠 본문 ───────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {notice.content.map((block, idx) => {

          /* 텍스트 블록 */
          if (block.type === 'text') {
            return (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '24px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                    fontWeight: 400,
                    lineHeight: '26px',
                    color: 'rgba(0,0,0,0.87)',
                    whiteSpace: 'pre-line',
                    wordBreak: 'keep-all',
                  }}
                >
                  {block.value}
                </p>
              </div>
            );
          }

          /* 이미지 블록 */
          if (block.type === 'image') {
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.value}
                  alt={block.alt ?? '공지 이미지'}
                  style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                />
              </div>
            );
          }

          /* 파일 블록 */
          if (block.type === 'file') {
            return (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '16px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* 파일 아이콘 */}
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: 'rgba(25,118,210,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 14, fontWeight: 500,
                      fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                      color: 'rgba(0,0,0,0.87)',
                    }}
                  >
                    {block.label ?? '첨부파일'}
                  </span>
                </div>

                {/* 다운로드 버튼 */}
                <a
                  href={block.value}
                  download={block.label}
                  style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: 'rgba(25,118,210,0.08)',
                    color: '#1976D2', textDecoration: 'none',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
                    flexShrink: 0,
                  }}
                >
                  다운로드
                </a>
              </div>
            );
          }

          return null;
        })}

        {/* ── 하단 닫기 버튼 ────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            width: '100%', height: 48,
            borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #1763FD 0%, #008B76 100%)',
            color: 'white', cursor: 'pointer',
            fontSize: 15, fontWeight: 700,
            fontFamily: 'Pretendard, Noto Sans KR, sans-serif',
            marginTop: 8,
          }}
        >
          대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}
