import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/camera_view.dart';
import '../widgets/guide_card.dart';
import '../widgets/task_list_modal.dart';

const _font = 'Spoqa Han Sans Neo';

// ──────────────────────────────────────────────────────────
// 레이아웃 상수 (HTML 수치 기반)
//   카메라 영역 619.5px 기준:
//   셔터(84px)   top:455.5  → center=497.5 → bottom=122 → SafeArea 고려 100
//   썸네일(56px) top:14 (셔터 컨테이너 내) → (84-56)/2=14 → bottom=114
//   업무완료     top:567.5  → bottom=619.5-567.5-36=16  → 28
// ──────────────────────────────────────────────────────────
const double _shutterBottom  = 100.0;
const double _thumbBottom    = 114.0;  // _shutterBottom + (84-56)/2
const double _completeBottom =  28.0;
const double _sideInset      =  24.0;

class CaptureScreen extends StatelessWidget {
  const CaptureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Scaffold(
            backgroundColor: Colors.white,
            body: Center(child: CircularProgressIndicator(color: AppTheme.blue)),
          );
        }

        if (provider.cameraPermission == CameraPermission.denied) {
          return _CameraPermissionDenied(onRetry: provider.requestCameraPermission);
        }

        return Scaffold(
          backgroundColor: Colors.black,
          body: _SwipeDetector(
            onSwipeLeft: provider.goNextItemOrGroup,
            onSwipeRight: provider.goPrevItemOrGroup,
            child: Column(
              children: [
                _TopArea(onListTap: () => _showTaskModal(context, provider)),
                Expanded(
                  child: Stack(
                    children: [
                      // ① 카메라
                      const Positioned.fill(child: _LiveCamera()),

                      // ② 힌트 pill
                      Positioned(
                        top: 32, left: 0, right: 0,
                        child: _HintPill(),
                      ),

                      // ③ 스와이프 화살표
                      const Positioned.fill(child: _SwipeArrows()),

                      // ④ 업로드 인디케이터
                      if (provider.currentCapture?.status == UploadStatus.uploading)
                        const Positioned(top: 12, right: 12, child: _UploadIndicator()),

                      // ⑤ 썸네일 — 셔터 중앙과 수직 정렬, 좌측
                      if (provider.isRecaptureMode)
                        Positioned(
                          bottom: _thumbBottom,
                          left: _sideInset,
                          child: _Thumbnail(
                            bytes: provider.currentCapture!.bytes,
                            uploadStatus: provider.currentCapture!.status,
                          ),
                        ),

                      // ⑥ 셔터 버튼 — 수평 중앙, bottom 고정
                      Positioned(
                        bottom: _shutterBottom, left: 0, right: 0,
                        child: Center(child: _ShutterButton(provider: provider)),
                      ),

                      // ⑦ 업무완료 버튼 — 마지막 도안에서만, 우측 하단
                      //    active:   #3B82F6 불투명 (HTML 기준)
                      //    inactive: #94A3B8 50% 투명
                      if (provider.isLastItem)
                        Positioned(
                          bottom: _completeBottom,
                          right: _sideInset,
                          child: _CompleteButton(provider: provider),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showTaskModal(BuildContext context, CaptureProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: false,
      builder: (_) => ChangeNotifierProvider.value(
        value: provider,
        child: const TaskListModal(),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 카메라 권한 거부
// ══════════════════════════════════════════════════════════
class _CameraPermissionDenied extends StatelessWidget {
  final VoidCallback onRetry;
  const _CameraPermissionDenied({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.videocam_off_outlined, size: 64,
                  color: Color(0xFFCBD5E1)),
              const SizedBox(height: 20),
              const Text('카메라 권한이 필요합니다',
                  style: TextStyle(fontFamily: _font, fontSize: 18,
                      fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
              const SizedBox(height: 8),
              const Text('업무 촬영을 위해 브라우저에서\n카메라 접근을 허용해주세요.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontFamily: _font, fontSize: 14,
                      color: Color(0xFF64748B), height: 1.6)),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('다시 시도',
                      style: TextStyle(fontFamily: _font, fontSize: 15,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 라이브 카메라
// ══════════════════════════════════════════════════════════
class _LiveCamera extends StatelessWidget {
  const _LiveCamera();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    final viewId = provider.cameraViewId;
    if (provider.cameraReady && viewId != null) {
      return CameraView(viewId: viewId);
    }
    return Container(
      color: const Color(0xFF0F172A),
      child: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Colors.white38, strokeWidth: 2),
            SizedBox(height: 12),
            Text('카메라 초기화 중...',
                style: TextStyle(fontFamily: _font,
                    color: Colors.white38, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 상단 영역
// ══════════════════════════════════════════════════════════
class _TopArea extends StatelessWidget {
  final VoidCallback onListTap;
  const _TopArea({required this.onListTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [_NavBar(), GuideCard(onListTap: onListTap)],
        ),
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(
        children: [
          _BackButton(),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(provider.currentGroup?.title ?? '',
                    style: const TextStyle(fontFamily: _font,
                        color: Color(0xFF0F172A), fontSize: 17,
                        fontWeight: FontWeight.w700, letterSpacing: -0.43)),
                const SizedBox(height: 4),
                _GroupDots(),
              ],
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.read<CaptureProvider>();
    return IconButton(
      icon: const Icon(Icons.chevron_left, size: 28, color: Color(0xFF0F172A)),
      onPressed: () => _handleBack(context, provider),
    );
  }

  Future<void> _handleBack(
      BuildContext context, CaptureProvider provider) async {
    if (provider.allMandatoryCaptured) {
      if (context.mounted) Navigator.of(context).maybePop();
      return;
    }
    if (!context.mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('업무 촬영이 완료되지 않았어요',
            style: TextStyle(fontFamily: _font, fontSize: 17,
                fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
        content: const Text(
            '필수 항목 촬영이 남아 있어요.\n지금 나가면 촬영한 내용이 저장되지 않을 수 있어요.',
            style: TextStyle(fontFamily: _font, fontSize: 14,
                color: Color(0xFF64748B), height: 1.6)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('계속 촬영',
                style: TextStyle(fontFamily: _font, color: AppTheme.blue,
                    fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('나가기',
                style: TextStyle(fontFamily: _font, color: Color(0xFFEF4444),
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      Navigator.of(context).maybePop();
    }
  }
}

class _GroupDots extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(provider.groups.length, (i) {
        final isActive = i == provider.groupIndex;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: isActive ? 8 : 6,
          height: isActive ? 8 : 6,
          decoration: BoxDecoration(
            color: isActive ? AppTheme.blue : const Color(0xFFE2E8F0),
            shape: BoxShape.circle,
          ),
        );
      }),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 힌트 Pill
// HTML: px-[12] py-[4] bg-black/20 rounded-full backdrop-blur
// ══════════════════════════════════════════════════════════
class _HintPill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    final String hint = provider.isRecaptureMode
        ? '저장된 사진이 있어요. 다시 촬영하려면 재촬영 버튼을 선택하세요.'
        : '스와이프하면 다음 업무 촬영이 가능해요';

    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 342),
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withAlpha(51), // bg-black/20
          borderRadius: BorderRadius.circular(9999),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(18),
                blurRadius: 3, offset: const Offset(0, 4)),
            BoxShadow(color: Colors.black.withAlpha(15),
                blurRadius: 2, offset: const Offset(0, 2)),
          ],
        ),
        child: Text(hint,
            textAlign: TextAlign.center,
            maxLines: 2,
            style: const TextStyle(
                fontFamily: _font, color: Colors.white,
                fontSize: 14, fontWeight: FontWeight.w400, height: 1.5)),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 업로드 인디케이터
// ══════════════════════════════════════════════════════════
class _UploadIndicator extends StatelessWidget {
  const _UploadIndicator();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withAlpha(140),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(width: 12, height: 12,
              child: CircularProgressIndicator(
                  color: Colors.white, strokeWidth: 1.5)),
          SizedBox(width: 6),
          Text('업로드 중',
              style: TextStyle(fontFamily: _font, color: Colors.white,
                  fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 스와이프 화살표
// ══════════════════════════════════════════════════════════
class _SwipeArrows extends StatelessWidget {
  const _SwipeArrows();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    final hasPrev = provider.itemIndex > 0 || provider.groupIndex > 0;
    final hasNext = provider.itemIndex < provider.currentItems.length - 1 ||
        provider.groupIndex < provider.groups.length - 1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (hasPrev)
            _ArrowButton(
                icon: Icons.chevron_left,
                onTap: provider.goPrevItemOrGroup)
          else
            const SizedBox(width: 40),
          if (hasNext)
            _ArrowButton(
                icon: Icons.chevron_right,
                onTap: provider.goNextItemOrGroup)
          else
            const SizedBox(width: 40),
        ],
      ),
    );
  }
}

class _ArrowButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _ArrowButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: Colors.black.withAlpha(40),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white70, size: 24),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 셔터 버튼
// HTML: w-84 h-84 outline-4 white  /  inner w-68 h-68 bg-white outline-3 black/10
//       재촬영: inner 안 텍스트 #0F172A
// ══════════════════════════════════════════════════════════
class _ShutterButton extends StatelessWidget {
  final CaptureProvider provider;
  const _ShutterButton({required this.provider});

  @override
  Widget build(BuildContext context) {
    final canCapture = !provider.isCapturing && provider.cameraReady;

    return GestureDetector(
      onTap: canCapture ? provider.capture : null,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 84, height: 84,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.transparent,
          border: Border.all(
              color: canCapture ? Colors.white : Colors.white38, width: 4),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(77), blurRadius: 15),
          ],
        ),
        child: Center(
          child: provider.isCapturing
              ? const SizedBox(width: 28, height: 28,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5))
              : Container(
                  width: 68, height: 68,
                  decoration: BoxDecoration(
                    color: canCapture ? Colors.white : Colors.white38,
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: Colors.black.withAlpha(26), width: 3),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withAlpha(26),
                          blurRadius: 15, spreadRadius: -3,
                          offset: const Offset(0, 10)),
                      BoxShadow(color: Colors.black.withAlpha(26),
                          blurRadius: 6, spreadRadius: -4,
                          offset: const Offset(0, 4)),
                    ],
                  ),
                  child: provider.isRecaptureMode
                      ? const Center(
                          child: Text('재촬영',
                              style: TextStyle(
                                  fontFamily: _font,
                                  color: Color(0xFF0F172A), // 흰 inner 위
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700)))
                      : null,
                ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 업무완료 버튼
// HTML active:   bg:#3B82F6 불투명, shadow, backdrop-blur
// HTML inactive: bg:#94A3B8 50% 투명, shadow 없음
//
// [PM 확정]
//   active  → 탭 시 화면 종료
//   inactive → 탭 시 첫 미촬영 필수 도안으로 이동
// ══════════════════════════════════════════════════════════
class _CompleteButton extends StatelessWidget {
  final CaptureProvider provider;
  const _CompleteButton({required this.provider});

  @override
  Widget build(BuildContext context) {
    final isActive = provider.allMandatoryCaptured;

    // active: #3B82F6 불투명  inactive: #94A3B8 50%
    final bgColor = isActive
        ? const Color(0xFF3B82F6)
        : const Color(0xFF94A3B8).withAlpha(128);

    return GestureDetector(
      onTap: () => _handleComplete(context, provider),
      behavior: HitTestBehavior.opaque,
      child: Container(
        // HTML: pl-12 pr-8 py-8
        padding: const EdgeInsets.only(left: 12, right: 8, top: 8, bottom: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
          // active일 때만 shadow
          // HTML: 0px 4px 6px -4px rgba(0,0,0,0.10), 0px 10px 15px -3px rgba(0,0,0,0.10)
          boxShadow: isActive
              ? [
                  BoxShadow(
                      color: Colors.black.withAlpha(26),
                      blurRadius: 6, spreadRadius: -4,
                      offset: const Offset(0, 4)),
                  BoxShadow(
                      color: Colors.black.withAlpha(26),
                      blurRadius: 15, spreadRadius: -3,
                      offset: const Offset(0, 10)),
                ]
              : [],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('업무 완료',
                style: TextStyle(
                    fontFamily: _font,
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700)),
            SizedBox(width: 4),
            Icon(Icons.check_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _handleComplete(
      BuildContext context, CaptureProvider provider) async {
    if (!provider.allMandatoryCaptured) {
      final target = provider.firstUncapturedMandatory;
      if (target != null) {
        provider.jumpToItem(target.groupIdx, target.itemIdx);
      }
      return;
    }
    if (context.mounted) Navigator.of(context).maybePop();
  }
}

// ══════════════════════════════════════════════════════════
// 썸네일
// HTML: 56x56, border-radius:24, outline 2px white, opacity:0.80
//       shadow: 0px 10px 15px -3px / 0px 4px 6px -4px rgba(0,0,0,0.10)
// ══════════════════════════════════════════════════════════
class _Thumbnail extends StatelessWidget {
  final Uint8List bytes;
  final UploadStatus uploadStatus;
  const _Thumbnail({required this.bytes, required this.uploadStatus});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showPreview(context),
      child: Stack(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: [
                BoxShadow(color: Colors.black.withAlpha(26),
                    blurRadius: 15, spreadRadius: -3,
                    offset: const Offset(0, 10)),
                BoxShadow(color: Colors.black.withAlpha(26),
                    blurRadius: 6, spreadRadius: -4,
                    offset: const Offset(0, 4)),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: Opacity(
                opacity: 0.80,
                child: Image.memory(bytes, fit: BoxFit.cover),
              ),
            ),
          ),
          if (uploadStatus == UploadStatus.uploading)
            Positioned(bottom: 2, right: 2,
              child: Container(width: 16, height: 16,
                decoration: const BoxDecoration(
                    color: Colors.black54, shape: BoxShape.circle),
                child: const Padding(padding: EdgeInsets.all(3),
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 1.5)))),
          if (uploadStatus == UploadStatus.success)
            Positioned(bottom: 2, right: 2,
              child: Container(width: 16, height: 16,
                decoration: const BoxDecoration(
                    color: Color(0xFF22C55E), shape: BoxShape.circle),
                child: const Icon(Icons.check, size: 10,
                    color: Colors.white))),
          if (uploadStatus == UploadStatus.error)
            Positioned(bottom: 2, right: 2,
              child: Container(width: 16, height: 16,
                decoration: const BoxDecoration(
                    color: Color(0xFFEF4444), shape: BoxShape.circle),
                child: const Icon(Icons.error_outline,
                    size: 10, color: Colors.white))),
        ],
      ),
    );
  }

  void _showPreview(BuildContext context) {
    final mq = MediaQuery.of(context);
    final w = mq.size.width;
    final h = mq.size.height;
    showDialog(
      context: context,
      barrierColor: Colors.black,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: SizedBox(
          width: w, height: h,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Container(color: Colors.black),
              InteractiveViewer(
                minScale: 0.8, maxScale: 5.0,
                child: Center(
                  child: Image.memory(bytes,
                      fit: BoxFit.contain, width: w, height: h),
                ),
              ),
              Positioned(
                top: mq.padding.top + 12, right: 16,
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                        color: Colors.black.withAlpha(140),
                        shape: BoxShape.circle),
                    child: const Icon(Icons.close,
                        color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 스와이프 감지
// ══════════════════════════════════════════════════════════
class _SwipeDetector extends StatefulWidget {
  final Widget child;
  final VoidCallback onSwipeLeft;
  final VoidCallback onSwipeRight;

  const _SwipeDetector({
    required this.child,
    required this.onSwipeLeft,
    required this.onSwipeRight,
  });

  @override
  State<_SwipeDetector> createState() => _SwipeDetectorState();
}

class _SwipeDetectorState extends State<_SwipeDetector> {
  double? _startX;
  static const double _threshold = 40.0;
  bool _committed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onHorizontalDragStart: (d) {
        _startX = d.localPosition.dx;
        _committed = false;
      },
      onHorizontalDragUpdate: (d) {
        if (_startX == null || _committed) return;
        final dx = d.localPosition.dx - _startX!;
        if (dx.abs() >= _threshold) {
          _committed = true;
          if (dx < 0) {
            widget.onSwipeLeft();
          } else {
            widget.onSwipeRight();
          }
        }
      },
      onHorizontalDragEnd: (_) {
        _startX = null;
        _committed = false;
      },
      onHorizontalDragCancel: () {
        _startX = null;
        _committed = false;
      },
      child: widget.child,
    );
  }
}
