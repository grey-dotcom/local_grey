'use client';

// ============================================================
// CaptureControls — Flutter capture_controls.dart 대응
// ShutterButton / CaptureCompleteButton / CaptureThumbnail / CaptureDoneBubble
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useCaptureContext } from '@/context/CaptureContext';
import type { UploadStatus } from '@/lib/types';

const FONT = "'Spoqa Han Sans Neo', sans-serif";

// ══════════════════════════════════════════════════════════
// CaptureDoneBubble — Flutter capture_controls.dart _CaptureDoneBubble 대응
// fadeIn 200ms → 1300ms 유지 → fadeOut 200ms (총 1700ms, Flutter 정책 동일)
//
// [버그 수정 노트] showCaptureBubble(boolean) dependency → captureBubbleTrigger(number) 로 교체
// 기존 문제:
//   provider.consumeCaptureBubble() 호출 → showCaptureBubble: true→false →
//   useEffect dependency 변화 → cleanup 즉시 실행 → clearTimeout → 말풍선 영구 표시
// 해결:
//   카운터(captureBubbleTrigger)는 촬영 시 +1만 함. cleanup이 실행돼도 카운터 값이
//   다시 바뀌지 않으므로 타이머를 건드리지 않음. CaptureDoneBubble이 자체적으로 타이머 관리.
// ══════════════════════════════════════════════════════════
export function CaptureDoneBubble() {
  const provider = useCaptureContext();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(6);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (provider.captureBubbleTrigger === 0) return; // 초기값 무시

    // 진행 중인 타이머 정리
    if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    // fadeIn
    setVisible(true);
    setOpacity(0);
    setTranslateY(6);
    requestAnimationFrame(() => {
      setOpacity(1);
      setTranslateY(0);
    });

    // 1300ms 유지 후 fadeOut
    fadeOutTimerRef.current = setTimeout(() => {
      setOpacity(0);
      setTranslateY(6);
      hideTimerRef.current = setTimeout(() => setVisible(false), 200);
    }, 1300);

    // cleanup: 언마운트 시에만 정리 (dependency 변화 시는 위에서 직접 clearTimeout)
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [provider.captureBubbleTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      className="absolute left-0 right-0 flex justify-center z-40 pointer-events-none"
      style={{ bottom: 172 }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }}
      >
        {/* 말풍선 본체 */}
        <div
          style={{
            background: 'rgba(19,127,236,0.10)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            borderRadius: 8,
            padding: '8px 16px',
            maxWidth: 200,
            boxShadow: '0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)',
          }}
        >
          <p
            className="text-center text-white font-bold whitespace-nowrap"
            style={{ fontFamily: FONT, fontSize: 12, lineHeight: '1.625' }}
          >
            사진 촬영 완료
          </p>
          <p
            className="text-center text-white whitespace-nowrap"
            style={{ fontFamily: FONT, fontSize: 12, lineHeight: '1.625', fontWeight: 400 }}
          >
            다음 업무 사진을 촬영해주세요
          </p>
        </div>
        {/* 삼각형 꼬리 */}
        <div className="flex justify-center">
          <div style={{
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid rgba(19,127,236,0.10)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ShutterButton
// ══════════════════════════════════════════════════════════
export function ShutterButton() {
  const provider = useCaptureContext();
  const canCapture = !provider.isCapturing && provider.cameraReady;

  return (
    <button
      onClick={() => canCapture && provider.capture()}
      disabled={!canCapture}
      className="flex items-center justify-center rounded-full"
      style={{
        width: 84,
        height: 84,
        background: 'transparent',
        border: `4px solid ${canCapture ? 'white' : 'rgba(255,255,255,0.38)'}`,
        boxShadow: '0 0 15px rgba(0,0,0,0.3)',
        transition: 'transform 0.1s',
      }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {provider.isCapturing ? (
        <div className="w-7 h-7 rounded-full border-[2.5px] border-white border-t-transparent animate-spin" />
      ) : (
        <div
          className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
          style={{
            background: canCapture ? 'white' : 'rgba(255,255,255,0.38)',
            border: '3px solid rgba(0,0,0,0.10)',
            boxShadow: '0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)',
          }}
        >
          {provider.isRecaptureMode && (
            <span className="text-[#0F172A] font-bold" style={{ fontFamily: FONT, fontSize: 15 }}>
              재촬영
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ══════════════════════════════════════════════════════════
// CaptureCompleteButton — 촬영 완료 버튼 (마지막 도안에만 노출)
// active: 필수 완료 시 화면 종료 / inactive: 첫 미촬영 필수로 이동
// ══════════════════════════════════════════════════════════
export function CaptureCompleteButton({ onBack }: { onBack: () => void }) {
  const provider = useCaptureContext();
  const isActive = provider.allMandatoryCaptured;
  const bgColor = isActive ? '#3B82F6' : 'rgba(148,163,184,0.5)';

  function handleClick() {
    if (!isActive) {
      const target = provider.firstUncapturedMandatory;
      if (target) provider.jumpToItem(target.groupIdx, target.itemIdx);
      return;
    }
    onBack();
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 rounded-3xl text-white font-bold"
      style={{
        background: bgColor,
        padding: '8px 8px 8px 12px',
        fontFamily: FONT,
        fontSize: 14,
        boxShadow: isActive
          ? '0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)'
          : 'none',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: '20px' }}>촬영 완료</span>
      <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>check</span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════
// CaptureThumbnail — 좌하단 미리보기 썸네일 (탭하면 전체화면)
// ══════════════════════════════════════════════════════════
export function CaptureThumbnail({
  dataUrl,
  uploadStatus,
  size = 52,
}: {
  dataUrl: string;
  uploadStatus: UploadStatus;
  size?: number;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const radius = Math.round(size * 0.27);

  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="capture thumbnail"
          className="w-full h-full object-cover"
          style={{
            borderRadius: radius,
            border: '2px solid white',
            boxShadow: '0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)',
          }}
        />
        {uploadStatus === 'uploading' && (
          <div className="absolute bottom-[2px] right-[2px] w-4 h-4 rounded-full bg-black/50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" />
          </div>
        )}
        {uploadStatus === 'success' && (
          <div className="absolute bottom-[2px] right-[2px] w-4 h-4 rounded-full bg-[#22C55E] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="absolute bottom-[2px] right-[2px] w-4 h-4 rounded-full bg-[#EF4444] flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>error</span>
          </div>
        )}
      </button>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="preview" className="max-w-full max-h-full object-contain" />
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-12 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.55)' }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
      )}
    </>
  );
}
