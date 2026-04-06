'use client';

// ============================================================
// CaptureScreen — Flutter capture_screen.dart 대응
// ============================================================

import React, { useRef, useState } from 'react';
import { useCaptureContext } from '@/context/CaptureContext';
import { GuideCard } from '@/components/widgets/GuideCard';
import { TaskListModal } from '@/components/widgets/TaskListModal';
import { ShutterButton } from '@/components/widgets/CaptureControls';
import { CaptureDoneBubble } from '@/components/widgets/CaptureControls';
import { CaptureCompleteButton } from '@/components/widgets/CaptureControls';
import { CaptureThumbnail } from '@/components/widgets/CaptureControls';

interface Props {
  onBack: (captureCompleted?: boolean) => void;
}

export default function CaptureScreen({ onBack }: Props) {
  const provider = useCaptureContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 스와이프 감지 — Flutter _SwipeDetector 대응
  const touchStartX = useRef<number | null>(null);
  const swipeCommitted = useRef(false);
  const SWIPE_THRESHOLD = 40;

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    swipeCommitted.current = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || swipeCommitted.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      swipeCommitted.current = true;
      if (dx < 0) provider.goNextItemOrGroup();
      else provider.goPrevItemOrGroup();
    }
  }
  function onTouchEnd() {
    touchStartX.current = null;
    swipeCommitted.current = false;
  }

  if (provider.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#3B82F6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (provider.cameraPermission === 'denied') {
    return <_CameraPermissionDenied onRetry={provider.requestCameraPermission} />;
  }

  const hasPrev = provider.itemIndex > 0 || provider.groupIndex > 0;
  const hasNext =
    provider.itemIndex < provider.currentItems.length - 1 ||
    provider.groupIndex < provider.groups.length - 1;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* ── 상단 영역 (흰색) ─────────────────────────── */}
      <div className="flex-shrink-0 bg-white">
        <_NavBar onBack={() => onBack(false)} />
        <GuideCard onListTap={() => setIsModalOpen(true)} />
      </div>

      {/* ── 카메라 영역 ────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 라이브 카메라 */}
        <div className="absolute inset-0">
          {provider.cameraReady ? (
            // [버그 수정 노트] ref → videoCallbackRef 사용
            // videoRef(useRef)는 cameraReady=true 시 <video>가 아직 DOM에 없어
            // srcObject 할당이 무시되는 타이밍 문제가 있음.
            // videoCallbackRef는 DOM 마운트 즉시 srcObject를 할당하므로 안전함.
            <video
              ref={provider.videoCallbackRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="w-full h-full bg-[#0F172A] flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
              <p className="text-white/40 text-[13px]" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                카메라 초기화 중...
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* 힌트 Pill */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <div
            className="mx-6 px-3 py-1 rounded-full text-white text-sm text-center leading-snug max-w-xs"
            style={{
              background: 'rgba(0,0,0,0.20)',
              backdropFilter: 'blur(2px)',
              boxShadow: '0 4px 3px rgba(0,0,0,0.07), 0 2px 2px rgba(0,0,0,0.06)',
              fontFamily: "'Spoqa Han Sans Neo', sans-serif",
              fontWeight: 400,
            }}
          >
            {provider.isRecaptureMode
              ? '저장된 사진이 있어요. 다시 촬영하려면 재촬영 버튼을 선택하세요.'
              : '스와이프하면 다음 업무 촬영이 가능해요'}
          </div>
        </div>

        {/* 촬영 완료 말풍선 */}
        <CaptureDoneBubble />

        {/* 업로드 인디케이터 */}
        {provider.currentCapture?.status === 'uploading' && (
          <div className="absolute top-3 right-3 z-40">
            <div
              className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-full"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <div className="w-3 h-3 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" />
              <span className="text-white text-[11px] font-medium" style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif" }}>
                업로드 중
              </span>
            </div>
          </div>
        )}

        {/* 스와이프 화살표 */}
        <button
          onClick={provider.goPrevItemOrGroup}
          className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-16 transition-all"
          style={{ opacity: hasPrev ? 1 : 0, pointerEvents: hasPrev ? 'auto' : 'none' }}
        >
          <span className="material-symbols-outlined text-white/50 hover:text-white" style={{ fontSize: 48 }}>
            chevron_left
          </span>
        </button>
        <button
          onClick={provider.goNextItemOrGroup}
          className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-16 transition-all"
          style={{ opacity: hasNext ? 1 : 0, pointerEvents: hasNext ? 'auto' : 'none' }}
        >
          <span className="material-symbols-outlined text-white/50 hover:text-white" style={{ fontSize: 48 }}>
            chevron_right
          </span>
        </button>

        {/* 썸네일 (재촬영 모드) */}
        {provider.isRecaptureMode && provider.currentCapture && (() => {
          return (
            <div className="absolute z-30" style={{ bottom: 96, left: 'calc(50% - 144px)' }}>
              <CaptureThumbnail
                dataUrl={provider.currentCapture.dataUrl}
                uploadStatus={provider.currentCapture.status}
                size={52}
              />
            </div>
          );
        })()}

        {/* 셔터 버튼 */}
        <div className="absolute left-0 right-0 flex justify-center z-30" style={{ bottom: 80 }}>
          <ShutterButton />
        </div>

        {/* 촬영 완료 버튼 (마지막 도안에만) */}
        {provider.isLastItem && (
          <div className="absolute right-6 z-30" style={{ bottom: 28 }}>
            {/* [버그 수정 노트] 촬영 완료 토스트 전달
                Flutter: Navigator.pop(true) → TaskListScreen이 result 수신 후 토스트.
                React: onBack(true)로 완료 여부를 AppRoot에 전달,
                       AppRoot가 TaskListScreen에 showCaptureCompleteToast prop으로 전달. */}
            <CaptureCompleteButton onBack={() => onBack(true)} />
          </div>
        )}
      </div>

      {/* ── 업무 선택 모달 ────────────────────────────── */}
      <TaskListModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// ── NavBar ──────────────────────────────────────────────────
function _NavBar({ onBack }: { onBack: () => void }) {
  const provider = useCaptureContext();
  return (
    <div
      className="h-16 flex items-center px-4"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <button
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center"
      >
        <span className="material-symbols-outlined" style={{ color: '#0F172A', fontSize: 28 }}>
          chevron_left
        </span>
      </button>
      <div className="flex-1 flex flex-col items-center">
        <p
          className="font-bold tracking-tight"
          style={{
            fontFamily: "'Spoqa Han Sans Neo', sans-serif",
            color: '#0F172A',
            fontSize: 17,
            letterSpacing: '-0.43px',
          }}
        >
          {provider.currentGroup?.title ?? ''}
        </p>
        <div className="flex gap-1 mt-1">
          {provider.groups.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === provider.groupIndex ? '#3B82F6' : '#E2E8F0' }}
            />
          ))}
        </div>
      </div>
      <div className="w-10 h-10" />
    </div>
  );
}

// ── 카메라 권한 거부 ─────────────────────────────────────────
function _CameraPermissionDenied({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center bg-white p-10">
      <div className="flex flex-col items-center gap-5 w-full max-w-xs">
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#CBD5E1' }}>
          videocam_off
        </span>
        <p
          className="text-center font-bold"
          style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", color: '#0F172A', fontSize: 18 }}
        >
          카메라 권한이 필요합니다
        </p>
        <p
          className="text-center leading-relaxed"
          style={{ fontFamily: "'Spoqa Han Sans Neo', sans-serif", color: '#64748B', fontSize: 14 }}
        >
          업무 촬영을 위해 브라우저에서<br />카메라 접근을 허용해주세요.
        </p>
        <button
          onClick={onRetry}
          className="w-full py-[14px] rounded-xl text-white font-bold"
          style={{ background: '#3B82F6', fontFamily: "'Spoqa Han Sans Neo', sans-serif", fontSize: 15 }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
