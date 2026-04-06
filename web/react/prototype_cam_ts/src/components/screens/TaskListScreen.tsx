'use client';

// ============================================================
// TaskListScreen — Flutter task_list_screen.dart 대응
// 첫 화면: 등록하기 탭 (업무 도안 목록 + 보고사항)
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useCaptureContext } from '@/context/CaptureContext';
import { useReportContext } from '@/context/ReportContext';
import type { ReportEntry } from '@/lib/types';
import { TaskCardList } from '@/components/widgets/TaskCardList';
import { ReportEntriesSection } from '@/components/widgets/ReportEntriesSection';
import { GuideModal } from '@/components/widgets/GuideModal';
import type { TaskItem } from '@/lib/types';

// ── 디자인 토큰 ──────────────────────────────────────────────
// Flutter 대응 색상:
// _bgPage       = #E9EAEF
// _tabActive    = #10A67B
// _tabInactive  = #9F9F9F
// _mandatory    = #DE321C
// _btnFill      = #2751E0
// _btnOutline   = #6280E8
// _btnOutlineBg = #F3F6FF
// _btnOutlineFg = #122979

const FONT = "'S-Core Dream', sans-serif";

interface Props {
  onGoCapture: (groupIdx: number, itemIdx: number) => void;
  onGoReport: (editEntry?: ReportEntry) => void;
  // [버그 수정 노트] 촬영 완료 토스트 전달
  // Flutter: Navigator.pop(true) result → _CaptureCompleteToast (OverlayEntry)
  // React: AppRoot가 captureCompleted 상태를 보관하고 prop으로 전달, 1회 소비 후 초기화
  showCaptureCompleteToast?: boolean;
  onCaptureCompleteToastShown?: () => void;
}

export default function TaskListScreen({
  onGoCapture,
  onGoReport,
  showCaptureCompleteToast,
  onCaptureCompleteToastShown,
}: Props) {
  const capture = useCaptureContext();
  const report = useReportContext();
  const [guideItem, setGuideItem] = useState<TaskItem | null>(null);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 촬영 완료 토스트 — AppRoot에서 전달받아 1회 표시 후 소비
  useEffect(() => {
    if (showCaptureCompleteToast) {
      showToast('모든 촬영이 완료되었습니다.');
      onCaptureCompleteToastShown?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCaptureCompleteToast]);

  if (capture.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#2751E0] border-t-transparent animate-spin" />
      </div>
    );
  }

  const title = capture.appConfig?.displayTitle ?? '';
  const code = capture.appConfig?.accessCode ?? '------';
  const isCompleteActive = capture.allMandatoryCaptured;

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  function handleComplete() {
    if (isCompleteActive) {
      // Flutter: ScaffoldMessenger.showSnackBar
      showToast('등록이 완료되었습니다.');
    } else {
      setShowIncompleteDialog(true);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#E9EAEF]">

      {/* ── 상단 헤더 ─────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-white"
        style={{ boxShadow: '0 4px 4px 0 rgba(0,0,0,0.04)' }}
      >
        {/* 지점명 행 */}
        <div className="flex items-center px-4 py-[14px]">
          <div className="w-6" />
          <p
            className="flex-1 text-center text-black font-semibold truncate"
            style={{ fontFamily: FONT, fontSize: 16, lineHeight: '24px' }}
          >
            {title}
          </p>
          <div className="w-2" />
          {/* Flutter: Icons.notifications_none_outlined → outlined 변형 */}
          <span
            className="material-symbols-outlined text-black"
            style={{ fontSize: 24, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            notifications
          </span>
        </div>

        {/* 탭 행 */}
        <div className="flex">
          <_TabChip label="등록하기" isActive={true} />
          <_TabChip label="일정 및 티켓정보" isActive={false} />
        </div>
      </div>

      {/* ── 본문 스크롤 ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-6">

        {/* 안내 배너 + 비밀번호 */}
        <div className="bg-white">
          {/* 안내 배너 */}
          <div className="px-4 pt-4">
            <div
              className="rounded-2xl flex items-center overflow-hidden"
              style={{
                background: '#F4F4F4',
                padding: '10px 12px 10px 16px',
                height: 90,
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-black font-bold leading-[1.4]"
                  style={{ fontFamily: FONT, fontSize: 13 }}
                >
                  흔들린 사진 주의+가이드 확인 안내!
                </p>
                <div className="mt-1" style={{ fontFamily: FONT, fontSize: 10, lineHeight: '1.4', fontWeight: 200 }}>
                  <span style={{ color: '#747474' }}>흔들린 사진 등록 불가! </span>
                  <span
                    style={{ color: '#DE321C', textDecoration: 'underline', textDecorationColor: '#DE321C' }}
                  >
                    수행 전 가이드를 확인하고, 완료 후 수행 등록을 해주세요.
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 w-[52px] flex items-center justify-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(110,211,179,0.12)' }}
                >
                  <span className="material-symbols-outlined" style={{ color: '#6ED3B3', fontSize: 28 }}>vibration</span>
                </div>
              </div>
            </div>
          </div>

          {/* 객실 비밀번호 */}
          <div
            className="flex items-center px-4 py-[14px]"
            style={{ borderTop: '1px solid #EEEEEE' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: '#FFBB00', fontSize: 18, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              vpn_key
            </span>
            <span
              className="ml-2 text-black font-bold"
              style={{ fontFamily: FONT, fontSize: 14, lineHeight: '22px' }}
            >
              객실 비밀번호
            </span>
            <span className="flex-1" />
            <span
              className="text-black font-bold"
              style={{ fontFamily: FONT, fontSize: 14, lineHeight: '22px' }}
            >
              {code}
            </span>
          </div>
        </div>

        {/* 그룹 섹션들 */}
        {capture.groups.map((group, gIdx) => (
          <div key={group.id} className="bg-white mt-2 px-4 py-5">
            <p
              className="text-black font-bold mb-3"
              style={{ fontFamily: FONT, fontSize: 16, lineHeight: '24px' }}
            >
              {group.title}
            </p>
            <TaskCardList
              group={group}
              groupIdx={gIdx}
              captures={capture.captures}
              onGoCapture={(iIdx) => {
                capture.jumpToItem(gIdx, iIdx);
                onGoCapture(gIdx, iIdx);
              }}
              onShowGuide={(item) => setGuideItem(item)}
            />
          </div>
        ))}

        {/* 보고사항 섹션 */}
        <ReportEntriesSection onEdit={(entry) => onGoReport(entry)} />
      </div>

      {/* ── 하단 CTA ────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-white px-4 pt-4 pb-4"
        style={{ boxShadow: '0 -4px 4px 0 rgba(0,0,0,0.04)' }}
      >
        <p
          className="mb-2"
          style={{ fontFamily: FONT, color: '#9F9F9F', fontSize: 12, fontWeight: 200, lineHeight: '14px' }}
        >
          *등록 완료 버튼 클릭 후 사진 업로드가 끝나면 수행이 자동 완료 처리됩니다.
        </p>
        <div className="flex gap-2">
          {/* 보고사항 등록 버튼 */}
          <button
            onClick={() => onGoReport()}
            className="flex-1 h-10 rounded-lg font-bold"
            style={{
              border: '1px solid #6280E8',
              background: '#F3F6FF',
              color: '#122979',
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: '22px',
            }}
          >
            보고사항 등록
          </button>
          {/* 등록 완료 버튼 */}
          <button
            onClick={handleComplete}
            className="w-40 h-10 rounded-lg text-white font-bold"
            style={{
              background: isCompleteActive ? '#2751E0' : '#CCCCCC',
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: '22px',
              transition: 'background 0.15s',
            }}
          >
            등록 완료
          </button>
        </div>
      </div>

      {/* ── 필수 미완료 다이얼로그 (Flutter AlertDialog 대응) ── */}
      {showIncompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-[320px] w-[90%] mx-4">
            <p
              className="font-bold text-black mb-3"
              style={{ fontFamily: FONT, fontSize: 16 }}
            >
              필수 업무 도안 촬영을 완료해 주세요
            </p>
            <p
              className="mb-5"
              style={{ fontFamily: FONT, color: '#555555', fontSize: 14, lineHeight: '1.6' }}
            >
              모든 필수 업무 도안(*표시) 촬영이 완료되어야<br />
              등록 완료가 가능합니다.<br /><br />
              미촬영 필수 항목을 확인 후<br />
              촬영을 완료해 주세요.
            </p>
            <button
              onClick={() => setShowIncompleteDialog(false)}
              className="w-full h-10 rounded-xl text-white font-bold"
              style={{ background: '#2751E0', fontFamily: FONT, fontSize: 15 }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* ── 토스트 (Flutter SnackBar / _CaptureCompleteToast 대응) ── */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            className="px-4 py-3 rounded-lg text-white text-sm font-medium"
            style={{ background: '#22C55E', fontFamily: FONT, maxWidth: 320 }}
          >
            {toast}
          </div>
        </div>
      )}

      {/* ── 가이드 모달 ───────────────────────────────── */}
      {guideItem && (
        <GuideModal item={guideItem} onClose={() => setGuideItem(null)} />
      )}
    </div>
  );
}

function _TabChip({ label, isActive }: { label: string; isActive: boolean }) {
  return (
    <div className="pl-4">
      <div className="flex flex-col">
        <div
          className="py-[14px]"
          style={{
            fontFamily: FONT,
            color: isActive ? '#10A67B' : '#9F9F9F',
            fontSize: 14,
            lineHeight: '22px',
            fontWeight: isActive ? 700 : 200,
          }}
        >
          {label}
        </div>
        <div style={{ height: 2, background: isActive ? '#10A67B' : 'transparent' }} />
      </div>
    </div>
  );
}
