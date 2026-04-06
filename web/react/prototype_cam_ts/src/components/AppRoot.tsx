'use client';

// ============================================================
// 앱 루트 — Flutter main.dart / MultiProvider 대응
// Screen 네비게이션: TaskListScreen → CaptureScreen / ReportScreen
// ============================================================

import React, { useState } from 'react';
import { CaptureProvider } from '@/context/CaptureContext';
import { ReportProvider } from '@/context/ReportContext';
import TaskListScreen from '@/components/screens/TaskListScreen';
import CaptureScreen from '@/components/screens/CaptureScreen';
import ReportScreen from '@/components/screens/ReportScreen';
import type { NavigationState, ReportEntry } from '@/lib/types';

export default function AppRoot() {
  const [nav, setNav] = useState<NavigationState>({ screen: 'task-list' });
  // [버그 수정 노트] 촬영 완료 토스트 전달 경로
  // Flutter: Navigator.pop(true) → task_card.dart에서 result 수신 → _CaptureCompleteToast.
  // React: CaptureScreen.onBack(captureCompleted=true) → AppRoot가 상태 보관 →
  //        TaskListScreen으로 전환 시 showCaptureCompleteToast prop으로 전달 → 1회 소비 후 초기화.
  const [showCaptureToast, setShowCaptureToast] = useState(false);

  return (
    <CaptureProvider>
      <ReportProvider>
        <div className="flex h-svh w-full flex-col overflow-hidden">
          {nav.screen === 'task-list' && (
            <TaskListScreen
              onGoCapture={(gIdx, iIdx) => {
                setShowCaptureToast(false);
                setNav({ screen: 'capture' });
              }}
              onGoReport={(editEntry) => setNav({ screen: 'report', editEntry: editEntry ?? null })}
              showCaptureCompleteToast={showCaptureToast}
              onCaptureCompleteToastShown={() => setShowCaptureToast(false)}
            />
          )}
          {nav.screen === 'capture' && (
            <CaptureScreen
              onBack={(captureCompleted) => {
                if (captureCompleted) setShowCaptureToast(true);
                setNav({ screen: 'task-list' });
              }}
            />
          )}
          {nav.screen === 'report' && (
            <ReportScreen
              editEntry={nav.editEntry}
              onBack={() => setNav({ screen: 'task-list' })}
            />
          )}
        </div>
      </ReportProvider>
    </CaptureProvider>
  );
}
