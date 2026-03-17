'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { taskGroups } from '@/lib/data';
import type { Task, TaskGroup } from '@/lib/types';
import { TaskCard } from './task-card';

const ImagePreviewDialog = ({
  src,
  open,
  onOpenChange,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <DialogDescription className="sr-only">
          A preview of the captured image.
        </DialogDescription>
        <Image
          src={src}
          alt="Image preview"
          fill
          className="object-contain object-center w-full"
        />
        <DialogClose asChild>
          <button className="absolute top-12 right-4 p-2 text-white transition-colors hover:opacity-80 z-10">
            <span className="material-symbols-outlined text-[28px] leading-none">
              close
            </span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

const TaskListModal = ({
  isOpen,
  onClose,
  allGroups,
  currentGroupIndex,
  currentTask,
  onTaskClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  allGroups: TaskGroup[];
  currentGroupIndex: number;
  currentTask: Task;
  onTaskClick: (groupIndex: number, taskIndex: number) => void;
}) => {
  if (!isOpen) return null;

  const totalTasks = allGroups.reduce((sum, g) => sum + g.tasks.length, 0);

  return (
    <div className="absolute inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-14 left-0 right-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-3xl flex flex-col shadow-up">
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            촬영 업무 선택
          </h1>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-3">
          {allGroups.map((group, groupIndex) => (
            <div key={group.id}>
              <div className="px-1 pb-3 pt-5 first:pt-0">
                <h2 className={cn(
                  'text-base font-bold',
                  groupIndex === currentGroupIndex
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                )}>
                  {group.name}
                </h2>
              </div>
              <div className="space-y-3">
                {group.tasks.map((task, taskIndex) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    taskNumber={taskIndex + 1}
                    isActive={task.id === currentTask.id}
                    onClick={() => onTaskClick(groupIndex, taskIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">
            총 {totalTasks}개의 업무가 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function TaskCapturePage() {
  const [tasksData, setTasksData] = useState<TaskGroup[]>(
    taskGroups.map(group => ({
      ...group,
      tasks: group.tasks.map(task => ({ ...task, status: 'pending' })),
    }))
  );

  const findInitialTask = () => {
    for (let i = 0; i < tasksData.length; i++) {
      const taskIndex = tasksData[i].tasks.findIndex(
        t => t.status !== 'completed'
      );
      if (taskIndex !== -1) {
        return { groupIndex: i, taskIndex: taskIndex };
      }
    }
    return { groupIndex: 0, taskIndex: 0 };
  };

  const { groupIndex: initialGroupIndex, taskIndex: initialTaskIndex } =
    useMemo(findInitialTask, []);

  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialTaskIndex);
  const [capturedImages, setCapturedImages] = useState<Record<string, string>>(
    {}
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | undefined
  >(undefined);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCaptureBubble, setShowCaptureBubble] = useState(false);
  const captureBubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGroup = useMemo(
    () => tasksData[currentGroupIndex],
    [tasksData, currentGroupIndex]
  );
  const currentTask = useMemo(
    () => currentGroup.tasks[currentTaskIndex],
    [currentGroup, currentTaskIndex]
  );
  const hasCapturedImage = !!capturedImages[currentTask?.id];

  const isFirstGroup = currentGroupIndex === 0;
  const isLastGroup = currentGroupIndex === tasksData.length - 1;
  const isFirstTaskInGroup = currentTaskIndex === 0;
  const isLastTaskInGroup = currentTaskIndex === currentGroup.tasks.length - 1;

  useEffect(() => {
    const getCameraPermission = async () => {
      if (mediaStream) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setHasCameraPermission(true);
        setMediaStream(stream);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      if (api.selectedScrollSnap() !== currentTaskIndex) {
        setCurrentTaskIndex(api.selectedScrollSnap());
        // [POLICY v4] 드롭다운 상태 도안 이동 시 유지 — 리셋 제거
      }
    };

    api.on('select', onSelect);

    if (api.selectedScrollSnap() !== currentTaskIndex) {
      api.scrollTo(currentTaskIndex, true);
    }

    return () => {
      api.off('select', onSelect);
    };
  }, [api, currentTaskIndex]);

  useEffect(() => {
    if (api) {
      api.reInit();
      api.scrollTo(currentTaskIndex, true);
    }
  }, [api, currentGroupIndex, tasksData]);

  const handleCapture = async () => {
    if (isAnalyzing || !videoRef.current || videoRef.current.videoWidth === 0) {
      return;
    }

    // [POLICY v3] 촬영 전 상태 스냅샷 — 재촬영 여부 / 필수 완료 여부
    const wasRecapture = !!capturedImages[currentTask.id];
    const wasAllMandatoryDone = tasksData
      .flatMap(g => g.tasks)
      .filter(t => t.requirement === 'required')
      .every(t => t.status === 'completed');
    const isLastTask =
      currentGroupIndex === tasksData.length - 1 &&
      currentTaskIndex === currentGroup.tasks.length - 1;

    setIsAnalyzing(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsAnalyzing(false);
      return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    setCapturedImages(prev => ({ ...prev, [currentTask.id]: photoDataUri }));

    // 촬영 완료 버블: fadeIn 200ms → 1300ms 유지 → fadeOut 200ms (CSS transition)
    if (captureBubbleTimer.current) clearTimeout(captureBubbleTimer.current);
    setShowCaptureBubble(true);
    captureBubbleTimer.current = setTimeout(() => setShowCaptureBubble(false), 1200);

    const newTasksData: TaskGroup[] = JSON.parse(JSON.stringify(tasksData));
    newTasksData[currentGroupIndex].tasks[currentTaskIndex].status = 'completed';
    setTasksData(newTasksData);

    // [POLICY v3] Auto-Advance 분기
    const navigateTo = (gIdx: number, tIdx: number) => {
      if (gIdx !== currentGroupIndex) {
        setCurrentGroupIndex(gIdx);
        setCurrentTaskIndex(tIdx);
      } else {
        api?.scrollTo(tIdx);
      }
    };

    const findNextUncaptured = (fromGroupIdx: number, fromTaskIdx: number) => {
      for (let g = fromGroupIdx; g < newTasksData.length; g++) {
        const startI = g === fromGroupIdx ? fromTaskIdx : 0;
        for (let i = startI; i < newTasksData[g].tasks.length; i++) {
          if (newTasksData[g].tasks[i].status !== 'completed') {
            return { groupIndex: g, taskIndex: i };
          }
        }
      }
      return null;
    };

    const findFirstUncapturedMandatory = () => {
      for (let g = 0; g < newTasksData.length; g++) {
        for (let i = 0; i < newTasksData[g].tasks.length; i++) {
          const t = newTasksData[g].tasks[i];
          if (t.requirement === 'required' && t.status !== 'completed') {
            return { groupIndex: g, taskIndex: i };
          }
        }
      }
      return null;
    };

    if (!wasRecapture) {
      // 일반 촬영: 다음 미촬영 도안으로, 없으면 현위치 유지
      const next = findNextUncaptured(currentGroupIndex, currentTaskIndex + 1)
        ?? findNextUncaptured(0, 0);
      if (next && !(next.groupIndex === currentGroupIndex && next.taskIndex === currentTaskIndex)) {
        navigateTo(next.groupIndex, next.taskIndex);
      }
    } else if (wasAllMandatoryDone) {
      // 재촬영 + 필수 이미 전체 완료
      if (isLastTask) {
        // 마지막 도안이었으면 첫 도안으로 루프
        navigateTo(0, 0);
      } else {
        // 그 외: 순서상 바로 다음 도안 (미촬영 여부 무관)
        const nextTaskIdx = currentTaskIndex + 1;
        if (nextTaskIdx < currentGroup.tasks.length) {
          navigateTo(currentGroupIndex, nextTaskIdx);
        } else {
          const nextGroupIdx = currentGroupIndex + 1;
          if (nextGroupIdx < newTasksData.length) {
            navigateTo(nextGroupIdx, 0);
          }
        }
      }
    } else {
      // 재촬영 + 필수 미완료: 첫 미촬영 필수 도안으로
      const mandatory = findFirstUncapturedMandatory();
      if (mandatory) {
        navigateTo(mandatory.groupIndex, mandatory.taskIndex);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    setIsAnalyzing(false);
  };

  const allMandatoryCaptured = useMemo(() => {
    return tasksData
      .flatMap(g => g.tasks)
      .filter(t => t.requirement === 'required')
      .every(t => t.status === 'completed');
  }, [tasksData]);

  const firstUncapturedMandatory = useMemo(() => {
    for (let g = 0; g < tasksData.length; g++) {
      const items = tasksData[g].tasks;
      for (let i = 0; i < items.length; i++) {
        if (items[i].requirement === 'required' && items[i].status !== 'completed') {
          return { groupIndex: g, taskIndex: i };
        }
      }
    }
    return null;
  }, [tasksData]);

  const handleCompleteAllTasks = () => {
    if (allMandatoryCaptured) {
      console.log('All required tasks completed!');
    } else {
      // inactive: 첫 미촬영 필수 도안으로 이동
      if (firstUncapturedMandatory) {
        setCurrentGroupIndex(firstUncapturedMandatory.groupIndex);
        setCurrentTaskIndex(firstUncapturedMandatory.taskIndex);
      }
    }
  };

  // --- Navigation Handlers ---

  const handlePrevTask = () => {
    if (!isFirstTaskInGroup) {
      api?.scrollPrev();
    } else if (!isFirstGroup) {
      const prevGroupIndex = currentGroupIndex - 1;
      setCurrentGroupIndex(prevGroupIndex);
      setCurrentTaskIndex(tasksData[prevGroupIndex].tasks.length - 1);
    }
  };

  const handleNextTask = () => {
    if (!isLastTaskInGroup) {
      api?.scrollNext();
    } else if (!isLastGroup) {
      const nextGroupIndex = currentGroupIndex + 1;
      setCurrentGroupIndex(nextGroupIndex);
      const firstIncomplete = tasksData[nextGroupIndex].tasks.findIndex(
        t => t.status !== 'completed'
      );
      setCurrentTaskIndex(firstIncomplete !== -1 ? firstIncomplete : 0);
    }
  };

  const requirementLabel =
    currentTask?.requirement === 'required' ? '필수' : '선택';
  const progressLabel = `${currentTaskIndex + 1} / ${
    currentGroup.tasks.length
  }`;

  if (hasCameraPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 p-8">
        <Alert variant="destructive">
          <span className="material-symbols-outlined">error</span>
          <AlertTitle>카메라 접근이 필요합니다</AlertTitle>
          <AlertDescription>
            이 앱을 사용하려면 카메라 권한이 필요합니다. 브라우저 또는 기기
            설정에서 카메라 접근을 허용해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (hasCameraPermission === undefined || !currentTask) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div className="relative flex h-full w-full flex-col bg-white dark:bg-slate-900">
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 z-10 border-b border-slate-100 relative">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="!size-10 rounded-full">
                <span className="material-symbols-outlined text-slate-900 dark:text-slate-100 text-[28px] font-light">chevron_left</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>업무를 종료하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  변경사항이 저장되지 않을 수 있습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    console.log('Exiting task capture.');
                  }}
                >
                  종료
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">{currentGroup.name}</h1>
            <div className="flex gap-1 mt-1">
              {tasksData.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    index === currentGroupIndex ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>
          </div>
          <div className="!size-10" />
        </header>

        <div className="flex-shrink-0 relative w-full bg-white dark:bg-slate-900 z-10">
          <div className="px-5 pt-4 pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold w-fit',
                      currentTask.requirement === 'required'
                        ? 'bg-blue-50 text-primary'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    <span>{requirementLabel}</span>
                    <span className={cn('w-[1px] h-3', currentTask.requirement === 'required' ? 'bg-primary/20' : 'bg-slate-300 dark:bg-slate-600')}></span>
                    <span>{progressLabel}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setIsSheetOpen(true)}
                  variant="ghost"
                  size="icon"
                  className="!size-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-[24px]">format_list_bulleted</span>
                </Button>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate mt-1">{currentTask.title}</h2>
            </div>
            {/* [POLICY v4] min-h를 line-height 기준 23px으로 수정 */}
            <div className="flex items-start justify-between mt-2 min-h-[23px] gap-2">
              <p
                className={cn(
                  'text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-1',
                  !isDescriptionExpanded && 'line-clamp-1'
                )}
              >
                {currentTask.description}
              </p>
              <button
                onClick={() => setIsDescriptionExpanded(p => !p)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-600 mt-0.5"
              >
                <span
                  className={cn(
                    'material-symbols-outlined transition-transform duration-200',
                    isDescriptionExpanded && 'rotate-180'
                  )}
                >
                  expand_more
                </span>
              </button>
            </div>
          </div>
          {/* [STEP 3] 페이지네이션 dot — div → button으로 변경하여 탭 이동 지원 */}
          <div className="flex gap-2 px-5 py-3 overflow-x-auto items-center border-b border-slate-100 dark:border-slate-800 hide-scrollbar">
            {currentGroup.tasks.map((task, index) => (
              index === currentTaskIndex ? (
                <div key={task.id} className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold shadow-sm ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-900">
                  {index + 1}
                </div>
              ) : (
                <button
                  key={task.id}
                  onClick={() => api?.scrollTo(index)}
                  className="shrink-0 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 transition-colors"
                />
              )
            ))}
          </div>
        </div>

        <main className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden group">
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <Carousel
            setApi={setApi}
            opts={{ active: true, loop: false }}
            className="absolute inset-0"
          >
            <CarouselContent>
              {currentGroup.tasks.map(task => (
                <CarouselItem key={task.id} />
              ))}
            </CarouselContent>
          </Carousel>

          <button
            onClick={handlePrevTask}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-16 text-white/50 hover:text-white disabled:opacity-0 transition-all"
            disabled={isFirstGroup && isFirstTaskInGroup}
          >
            <span className="material-symbols-outlined text-5xl font-light">
              chevron_left
            </span>
          </button>
          <button
            onClick={handleNextTask}
            className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-16 text-white/50 hover:text-white disabled:opacity-0 transition-all"
            disabled={isLastGroup && isLastTaskInGroup}
          >
            <span className="material-symbols-outlined text-5xl font-light">
              chevron_right
            </span>
          </button>

          {/* 촬영 완료 버블 — Flutter _CaptureDoneBubbleOverlay 동일 스펙
               위치: bottom 172px (셔터 위), 2줄 텍스트, 파란 반투명 blur + 삼각형 꼬리
               fadeIn 200ms → 1300ms 유지 → fadeOut 200ms */}
          <div
            className="absolute w-full flex justify-center z-40 pointer-events-none"
            style={{ bottom: '172px' }}
          >
            <div
              style={{
                transition: 'opacity 200ms ease-out, transform 200ms ease-out',
                opacity: showCaptureBubble ? 1 : 0,
                transform: showCaptureBubble ? 'translateY(0)' : 'translateY(6px)',
              }}
            >
              {/* 말풍선 본체 */}
              <div
                style={{
                  background: 'rgba(19,127,236,0.75)',
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  boxShadow: '0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)',
                  maxWidth: '200px',
                }}
              >
                <p className="text-white text-[12px] font-bold leading-[1.625] text-center whitespace-nowrap">사진 촬영 완료</p>
                <p className="text-white text-[12px] font-normal leading-[1.625] text-center whitespace-nowrap">다음 업무 사진을 촬영해주세요</p>
              </div>
              {/* 삼각형 꼬리 */}
              <div className="flex justify-center">
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderTop: '7px solid rgba(19,127,236,0.75)',
                }} />
              </div>
            </div>
          </div>

          <div className="absolute top-8 w-full px-6 flex justify-center z-30 pointer-events-none">
            <div className="bg-black/20 rounded-full shadow-sm backdrop-blur-sm px-3 py-1">
              {/* [STEP 6] 재촬영 힌트 텍스트 1줄로 단축 */}
              <p className="text-white text-sm font-normal text-center leading-snug max-w-xs">
                {hasCapturedImage
                  ? '저장된 사진이 있어요. 재촬영하려면 셔터를 누르세요.'
                  : '스와이프하면 다음 업무 촬영이 가능해요'}
              </p>
            </div>
          </div>

          <div className="absolute bottom-[80px] w-full flex items-center justify-center z-30" style={{bottom: '80px'}}>
            <div className="relative flex items-center justify-center w-80">
              {hasCapturedImage && (
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    {/* 썸네일: 셔터 왼쪽 엣지 기준 50px 간격 */}
                    <button className="absolute left-4 top-3.5 size-14 rounded-xl border-2 border-white overflow-hidden shadow-lg bg-slate-200">
                      <Image
                        src={capturedImages[currentTask.id]}
                        alt="Thumbnail"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  </DialogTrigger>
                  <ImagePreviewDialog
                    src={capturedImages[currentTask.id]}
                    open={isPreviewOpen}
                    onOpenChange={setIsPreviewOpen}
                  />
                </Dialog>
              )}
              <button
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="relative flex items-center justify-center size-20 rounded-full bg-transparent border-[4px] border-white group active:scale-95 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.3)] disabled:opacity-50"
                aria-label="Capture photo"
              >
                {isAnalyzing ? (
                  <Loader2 className="size-8 animate-spin text-white" />
                ) : hasCapturedImage ? (
                  <div className="size-16 rounded-full bg-white shadow-lg border-[3px] border-black/10 flex items-center justify-center">
                    <span className="text-slate-900 text-sm font-bold">
                      재촬영
                    </span>
                  </div>
                ) : (
                  <div className="size-16 rounded-full bg-white shadow-lg border-[3px] border-black/10" />
                )}
              </button>
            </div>
          </div>

          {/* [POLICY v3] 업무완료 버튼: 마지막 그룹의 마지막 도안에서만 표시, active/inactive 상태로 구분 */}
          {isLastGroup && isLastTaskInGroup && (
            <div className="absolute bottom-7 w-full px-6 flex justify-end z-30">
              <button
                onClick={handleCompleteAllTasks}
                className={cn(
                  'flex items-center gap-1 transition-all',
                  'pl-3 pr-2 py-2 rounded-3xl',
                  'font-bold text-sm text-white',
                  allMandatoryCaptured
                    ? 'bg-primary'
                    : 'bg-slate-400/50'
                )}
                style={allMandatoryCaptured ? {
                  boxShadow: '0px 4px 6px -4px rgba(0,0,0,0.10), 0px 10px 15px -3px rgba(0,0,0,0.10)'
                } : {}}
              >
                <span className="text-[14px] font-bold leading-5">업무 완료</span>
                <span className="material-symbols-outlined text-base leading-none">check</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <TaskListModal
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        allGroups={tasksData}
        currentGroupIndex={currentGroupIndex}
        currentTask={currentTask}
        onTaskClick={(groupIndex, taskIndex) => {
          if (groupIndex !== currentGroupIndex) {
            setCurrentGroupIndex(groupIndex);
            setCurrentTaskIndex(taskIndex);
          } else {
            api?.scrollTo(taskIndex, true);
          }
          setIsSheetOpen(false);
        }}
      />
    </div>
  );
}
