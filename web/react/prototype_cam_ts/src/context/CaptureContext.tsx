'use client';

// ============================================================
// CaptureContext — Flutter CaptureProvider 대응
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { taskGroups, buildAppConfig } from '@/lib/data';
import type {
  AppConfig,
  CaptureResult,
  TaskGroup,
  TaskItem,
  UploadStatus,
} from '@/lib/types';
import { apiService } from '@/lib/api';

interface CaptureCtx {
  groups: TaskGroup[];
  appConfig: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  groupIndex: number;
  itemIndex: number;
  currentGroup: TaskGroup | null;
  currentItem: TaskItem | null;
  currentItems: TaskItem[];
  captures: Record<string, CaptureResult>;
  captureOf: (itemId: string) => CaptureResult | undefined;
  currentCapture: CaptureResult | undefined;
  isItemCaptured: (itemId: string) => boolean;
  isRecaptureMode: boolean;
  isCapturing: boolean;
  totalItemCount: number;
  currentItemGlobalIndex: number;
  mandatoryDoneCount: number;
  mandatoryTotalCount: number;
  allMandatoryCaptured: boolean;
  allCaptured: boolean;
  isLastItem: boolean;
  firstUncapturedMandatory: { groupIdx: number; itemIdx: number } | null;
  cameraPermission: 'unknown' | 'granted' | 'denied';
  cameraReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoCallbackRef: (node: HTMLVideoElement | null) => void;
  requestCameraPermission: () => Promise<void>;
  isContentsExpanded: boolean;
  toggleContents: () => void;
  // [버그 수정 노트] showCaptureBubble(boolean) → captureBubbleTrigger(number) 로 교체
  // 기존 boolean 방식: true→false 전환 시 useEffect cleanup이 타이머를 clearTimeout해서
  // 말풍선이 영구 표시되는 문제. 카운터 방식은 값이 증가만 하므로 cleanup이 타이머를 죽이지 않음.
  // CaptureDoneBubble이 이 카운터를 dependency로 보고 독립적으로 타이머를 관리함.
  captureBubbleTrigger: number;
  jumpToItem: (groupIdx: number, itemIdx: number) => void;
  goNextItemOrGroup: () => void;
  goPrevItemOrGroup: () => void;
  capture: () => Promise<void>;
  clearError: () => void;
}

const Ctx = createContext<CaptureCtx | null>(null);

export function useCaptureContext(): CaptureCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCaptureContext must be used within CaptureProvider');
  return ctx;
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [groups] = useState<TaskGroup[]>(taskGroups);
  const [appConfig] = useState<AppConfig>(() => buildAppConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [groupIndex, setGroupIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);

  const [captures, setCaptures] = useState<Record<string, CaptureResult>>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [isContentsExpanded, setIsContentsExpanded] = useState(false);

  // [버그 수정 노트] boolean → 카운터. 촬영 시마다 +1. CaptureDoneBubble이 이 값을 dependency로 사용.
  // 카운터 증가만 하므로 useEffect cleanup이 실행돼도 dependency가 다시 바뀌지 않아 타이머가 살아있음.
  const [captureBubbleTrigger, setCaptureBubbleTrigger] = useState(0);

  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [cameraReady, setCameraReady] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // [버그 수정 노트] 카메라 srcObject 타이밍 문제
  // 기존: useRef(videoRef) → cameraReady=true 시 <video>가 아직 DOM에 없어 srcObject 할당 무시됨.
  // 수정: ref callback(videoCallbackRef) 방식으로 <video> DOM 마운트 즉시 srcObject 할당.
  // [▶ 개발자 인수인계] CaptureScreen의 <video ref={provider.videoCallbackRef}> 로 사용할 것.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && mediaStreamRef.current) {
      node.srcObject = mediaStreamRef.current;
    }
  }, []);

  // ref로 최신 groupIndex / itemIndex 유지 (capture 콜백 클로저 stale 방지)
  const groupIndexRef = useRef(groupIndex);
  const itemIndexRef = useRef(itemIndex);
  useEffect(() => { groupIndexRef.current = groupIndex; }, [groupIndex]);
  useEffect(() => { itemIndexRef.current = itemIndex; }, [itemIndex]);

  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      setCameraPermission('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch {
      setCameraPermission('denied');
      setCameraReady(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(false);
    initCamera();
  }, [initCamera]);

  const requestCameraPermission = useCallback(async () => {
    setCameraPermission('unknown');
    setCameraReady(false);
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    await initCamera();
  }, [initCamera]);

  // ── 파생값 ────────────────────────────────────────────────
  const currentGroup = groups[groupIndex] ?? null;
  const currentItem = currentGroup?.items[itemIndex] ?? null;
  const currentItems = currentGroup?.items ?? [];
  const captureOf = useCallback((itemId: string) => captures[itemId], [captures]);
  const currentCapture = currentItem ? captures[currentItem.id] : undefined;
  const isItemCaptured = useCallback((itemId: string) => itemId in captures, [captures]);
  const isRecaptureMode = !!currentCapture;

  const totalItemCount = groups.reduce((s, g) => s + g.items.length, 0);
  const currentItemGlobalIndex = (() => {
    let idx = 0;
    for (let g = 0; g < groupIndex; g++) idx += groups[g].items.length;
    return idx + itemIndex + 1;
  })();

  const mandatoryTotalCount = groups.reduce((s, g) => s + g.mandatoryItems.length, 0);
  const mandatoryDoneCount = groups.reduce(
    (s, g) => s + g.mandatoryItems.filter(i => i.id in captures).length, 0,
  );
  const allMandatoryCaptured = mandatoryTotalCount > 0 && mandatoryDoneCount === mandatoryTotalCount;
  const allCaptured = groups.every(g => g.items.every(i => i.id in captures));
  const isLastItem =
    groupIndex === groups.length - 1 &&
    itemIndex === (currentGroup?.items.length ?? 1) - 1;

  const firstUncapturedMandatory = (() => {
    for (let g = 0; g < groups.length; g++) {
      for (const item of groups[g].mandatoryItems) {
        if (!(item.id in captures)) {
          return { groupIdx: g, itemIdx: groups[g].items.indexOf(item) };
        }
      }
    }
    return null;
  })();

  // ── 네비게이션 ─────────────────────────────────────────────
  const jumpToItem = useCallback((gIdx: number, iIdx: number) => {
    if (gIdx < 0 || gIdx >= taskGroups.length) return;
    if (iIdx < 0 || iIdx >= taskGroups[gIdx].items.length) return;
    setGroupIndex(gIdx);
    setItemIndex(iIdx);
  }, []);

  const goNextItemOrGroup = useCallback(() => {
    const g = groupIndexRef.current;
    const i = itemIndexRef.current;
    const grp = taskGroups[g];
    if (i < grp.items.length - 1) {
      setItemIndex(i + 1);
    } else if (g < taskGroups.length - 1) {
      setGroupIndex(g + 1);
      setItemIndex(0);
    }
  }, []);

  const goPrevItemOrGroup = useCallback(() => {
    const g = groupIndexRef.current;
    const i = itemIndexRef.current;
    if (i > 0) {
      setItemIndex(i - 1);
    } else if (g > 0) {
      const prev = g - 1;
      setGroupIndex(prev);
      setItemIndex(taskGroups[prev].items.length - 1);
    }
  }, []);

  // ── 촬영 ─────────────────────────────────────────────────
  const capture = useCallback(async () => {
    // [▶ 개발자 인수인계] cameraReady 또는 videoWidth === 0 일 때:
    //   실제 카메라 없는 환경(브라우저 mock 테스트, localhost 개발)에서도
    //   촬영 로직(auto-advance, 말풍선, 업로드)이 동작하도록 mock 폴백 처리.
    //   Flutter 웹 빌드와 동일한 mock 정책으로, 실제 기기 배포 시 hasLiveCamera
    //   분기가 true가 되어 실 카메라 캡처가 정상 수행됨.
    if (isCapturing || !currentItem) return;

    setIsCapturing(true);

    const capGIdx = groupIndexRef.current;
    const capIIdx = itemIndexRef.current;
    const capItem = taskGroups[capGIdx].items[capIIdx];
    const capGroup = taskGroups[capGIdx];

    const wasRecapture = capItem.id in captures;
    const wasAllMandatoryDone = taskGroups
      .flatMap(g => g.mandatoryItems)
      .every(i => i.id in captures);

    const hasLiveCamera = cameraReady && videoRef.current && videoRef.current.videoWidth > 0;
    const canvas = document.createElement('canvas');

    if (hasLiveCamera && videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) { setIsCapturing(false); return; }
      ctx2d.drawImage(videoRef.current, 0, 0);
    } else {
      canvas.width = 640;
      canvas.height = 480;
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) { setIsCapturing(false); return; }
      ctx2d.fillStyle = '#374151';
      ctx2d.fillRect(0, 0, 640, 480);
      ctx2d.fillStyle = '#9CA3AF';
      ctx2d.font = 'bold 24px sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.fillText(capItem.title, 320, 240);
      ctx2d.font = '16px sans-serif';
      ctx2d.fillText('[Mock 촬영]', 320, 275);
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    const newCaptures = {
      ...captures,
      [capItem.id]: { dataUrl, status: 'uploading' as UploadStatus },
    };
    setCaptures(newCaptures);

    // 말풍선 트리거 — 카운터 +1 (Flutter: _showCaptureBubble = true 대응)
    // CaptureDoneBubble이 이 카운터를 dependency로 보고 독립적으로 타이머 관리
    setCaptureBubbleTrigger(n => n + 1);

    // ── Auto-Advance: Flutter _autoAdvance 동일 로직 ──────────────
    const isLastTask =
      capGIdx === taskGroups.length - 1 &&
      capIIdx === taskGroups[capGIdx].items.length - 1;

    const navigate = (gIdx: number, iIdx: number) => {
      setGroupIndex(gIdx);
      setItemIndex(iIdx);
    };

    if (wasRecapture && wasAllMandatoryDone) {
      // [재촬영 + 필수 완료] → 순서상 다음 도안, 마지막이면 루프
      if (isLastTask) {
        navigate(0, 0);
      } else if (capIIdx < capGroup.items.length - 1) {
        navigate(capGIdx, capIIdx + 1);
      } else {
        navigate(capGIdx + 1, 0);
      }
    } else if (wasRecapture && !wasAllMandatoryDone) {
      // [재촬영 + 필수 미완료] → 첫 미촬영 필수 도안으로
      let navigated = false;
      for (let g = 0; g < taskGroups.length && !navigated; g++) {
        for (const item of taskGroups[g].mandatoryItems) {
          if (!(item.id in newCaptures)) {
            navigate(g, taskGroups[g].items.indexOf(item));
            navigated = true;
            break;
          }
        }
      }
      if (!navigated) {
        let found = false;
        outer: for (let g = capGIdx; g < taskGroups.length; g++) {
          const startI = g === capGIdx ? capIIdx + 1 : 0;
          for (let i = startI; i < taskGroups[g].items.length; i++) {
            if (!(taskGroups[g].items[i].id in newCaptures)) {
              navigate(g, i);
              found = true;
              break outer;
            }
          }
        }
        if (!found) {
          navigate(taskGroups.length - 1, taskGroups[taskGroups.length - 1].items.length - 1);
        }
      }
    } else {
      // [일반 촬영] → 다음 미촬영 도안
      let found = false;
      outer: for (let g = capGIdx; g < taskGroups.length; g++) {
        const startI = g === capGIdx ? capIIdx + 1 : 0;
        for (let i = startI; i < taskGroups[g].items.length; i++) {
          if (!(taskGroups[g].items[i].id in newCaptures)) {
            navigate(g, i);
            found = true;
            break outer;
          }
        }
      }
      if (!found) {
        navigate(taskGroups.length - 1, taskGroups[taskGroups.length - 1].items.length - 1);
      }
    }

    setIsCapturing(false);

    const itemIdForUpload = capItem.id;
    apiService
      .uploadCapture({ dataUrl, itemId: itemIdForUpload, groupId: capGroup.id })
      .then(result => {
        setCaptures(prev => {
          if (!(itemIdForUpload in prev)) return prev;
          return { ...prev, [itemIdForUpload]: { ...prev[itemIdForUpload], status: 'success' as UploadStatus, serverUrl: result.url } };
        });
      })
      .catch(err => {
        setCaptures(prev => {
          if (!(itemIdForUpload in prev)) return prev;
          return { ...prev, [itemIdForUpload]: { ...prev[itemIdForUpload], status: 'error' as UploadStatus, errorMessage: String(err) } };
        });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCapturing, currentItem, cameraReady, captures]);

  const toggleContents = useCallback(() => setIsContentsExpanded(p => !p), []);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const value: CaptureCtx = {
    groups, appConfig, isLoading, error,
    groupIndex, itemIndex, currentGroup, currentItem, currentItems,
    captures, captureOf, currentCapture, isItemCaptured, isRecaptureMode, isCapturing,
    totalItemCount, currentItemGlobalIndex, mandatoryDoneCount, mandatoryTotalCount,
    allMandatoryCaptured, allCaptured, isLastItem, firstUncapturedMandatory,
    cameraPermission, cameraReady, videoRef, videoCallbackRef, requestCameraPermission,
    isContentsExpanded, toggleContents, captureBubbleTrigger,
    jumpToItem, goNextItemOrGroup, goPrevItemOrGroup, capture, clearError,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
