import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/camera_view.dart';
import '../widgets/guide_card.dart';
import '../widgets/task_list_modal.dart';

const _font = 'Spoqa Han Sans Neo';

// ── 레이아웃 상수 (390px 기준) ──
const double _shutterBottom  =  80.0;
const double _thumbBottom    =  96.0;  // 셔터 center(122) - 썸네일 절반(26)
const double _thumbSize      =  52.0;
const double _shutterRadius  =  42.0;  // 셔터 외경(84) / 2
const double _thumbGap       =  50.0;  // 셔터 왼쪽 엣지 기준 썸네일 오른쪽 끝까지 거리
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
                      const Positioned.fill(child: _LiveCamera()),
                      Positioned.fill(
                        child: IgnorePointer(
                          child: Container(color: Colors.black.withAlpha(102)),
                        ),
                      ),
                      Positioned(top: 32, left: 0, right: 0, child: _HintPill()),
                      const _CaptureDoneBubbleOverlay(),
                      const Positioned.fill(child: _SwipeArrows()),
                      if (provider.currentCapture?.status == UploadStatus.uploading)
                        const Positioned(top: 12, right: 12, child: _UploadIndicator()),
                      if (provider.isRecaptureMode)
                        Builder(builder: (ctx) {
                          // 셔터 왼쪽 엣지 기준으로 썸네일 오른쪽 끝 위치 고정
                          // thumbLeft = 화면너비/2 - 셔터반지름 - gap - 썸네일크기
                          final w = MediaQuery.of(ctx).size.width;
                          final thumbLeft = w / 2 - _shutterRadius - _thumbGap - _thumbSize;
                          return Positioned(
                            bottom: _thumbBottom,
                            left: thumbLeft,
                            child: _Thumbnail(
                              bytes: provider.currentCapture!.bytes,
                              uploadStatus: provider.currentCapture!.status,
                              size: _thumbSize,
                            ),
                          );
                        }),
                      Positioned(
                        bottom: _shutterBottom, left: 0, right: 0,
                        child: Center(child: _ShutterButton(provider: provider)),
                      ),
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
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
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
          const SizedBox(width: 40, height: 40),
        ],
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.read<CaptureProvider>();
    return SizedBox(
      width: 40, height: 40,
      child: IconButton(
        padding: EdgeInsets.zero,
        icon: const Icon(Icons.chevron_left, size: 28, color: Color(0xFF0F172A)),
        onPressed: () => _handleBack(context, provider),
      ),
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
          width: 6, height: 6,
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
        margin: const EdgeInsets.symmetric(horizontal: 24),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withAlpha(51),
          borderRadius: BorderRadius.circular(9999),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(18), blurRadius: 3, offset: const Offset(0, 4)),
            BoxShadow(color: Colors.black.withAlpha(15), blurRadius: 2, offset: const Offset(0, 2)),
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
// 촬영완료 말풍선 오버레이
// fadeIn 200ms → 1300ms 유지 → fadeOut 200ms
// ══════════════════════════════════════════════════════════
class _CaptureDoneBubbleOverlay extends StatefulWidget {
  const _CaptureDoneBubbleOverlay();

  @override
  State<_CaptureDoneBubbleOverlay> createState() =>
      _CaptureDoneBubbleOverlayState();
}

class _CaptureDoneBubbleOverlayState
    extends State<_CaptureDoneBubbleOverlay>
    with SingleTickerProviderStateMixin {
  DateTime? _trackedTime;
  bool _visible = false;
  AnimationController? _animCtrl;
  Animation<double>? _fadeAnim;
  Animation<Offset>? _slideAnim;

  @override
  void initState() {
    super.initState();
    _setupAnim();
  }

  void _setupAnim() {
    _animCtrl?.dispose();
    final ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _animCtrl = ctrl;
    _fadeAnim = CurvedAnimation(parent: ctrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _animCtrl?.dispose();
    super.dispose();
  }

  void _show() {
    if (!mounted) return;
    if (_animCtrl == null) _setupAnim();
    setState(() => _visible = true);
    _animCtrl!.forward(from: 0);
    Future.delayed(const Duration(milliseconds: 1300), () {
      if (!mounted) return;
      _animCtrl?.reverse().then((_) {
        if (mounted) setState(() => _visible = false);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();
    final captureTime = provider.lastCaptureTime;

    if (captureTime != null && captureTime != _trackedTime) {
      _trackedTime = captureTime;
      WidgetsBinding.instance.addPostFrameCallback((_) => _show());
    }

    // 항상 Positioned 반환 → Stack 자식 타입 고정 (HtmlElementView remount 방지)
    return Positioned(
      left: 0,
      right: 0,
      bottom: 172,
      child: IgnorePointer(
        child: Opacity(
          opacity: _visible ? 1.0 : 0.0,
          child: FadeTransition(
            opacity: _fadeAnim ?? const AlwaysStoppedAnimation(1.0),
            child: SlideTransition(
              position: _slideAnim ?? const AlwaysStoppedAnimation(Offset.zero),
              child: Center(
                // Row(mainAxisSize.min) 안에 Column → 수평 tight constraint 해제
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 200),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: BackdropFilter(
                              filter: ui.ImageFilter.blur(sigmaX: 2, sigmaY: 2),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0x1A137FEC), // rgba(19,127,236,0.10)
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 6, spreadRadius: -4, offset: const Offset(0, 4)),
                                    BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 15, spreadRadius: -3, offset: const Offset(0, 10)),
                                  ],
                                ),
                                child: const Column(
                                  mainAxisSize: MainAxisSize.min,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text('사진 촬영 완료',
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, height: 1.625)),
                                    Text('다음 업무 사진을 촬영해주세요',
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 12, fontWeight: FontWeight.w400, height: 1.625)),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        CustomPaint(
                          size: const Size(14, 7),
                          painter: _BubbleTailPainter(),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BubbleTailPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x1A137FEC)
      ..style = PaintingStyle.fill;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_) => false;
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

    return Stack(
      children: [
        Positioned(
          top: 0, bottom: 0, left: 0,
          width: 64,
          child: Opacity(
            opacity: hasPrev ? 1.0 : 0.0,
            child: IgnorePointer(
              ignoring: !hasPrev,
              child: _ArrowButton(
                  icon: Icons.chevron_left,
                  onTap: provider.goPrevItemOrGroup),
            ),
          ),
        ),
        Positioned(
          top: 0, bottom: 0, right: 0,
          width: 64,
          child: Opacity(
            opacity: hasNext ? 1.0 : 0.0,
            child: IgnorePointer(
              ignoring: !hasNext,
              child: _ArrowButton(
                  icon: Icons.chevron_right,
                  onTap: provider.goNextItemOrGroup),
            ),
          ),
        ),
      ],
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
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Center(
          child: Icon(icon,
              color: Colors.white.withAlpha(128),
              size: 48),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 셔터 버튼
// ══════════════════════════════════════════════════════════
class _ShutterButton extends StatelessWidget {
  final CaptureProvider provider;
  const _ShutterButton({required this.provider});

  void _handleShutter(BuildContext context) {
    provider.capture();
  }

  @override
  Widget build(BuildContext context) {
    final canCapture = !provider.isCapturing && provider.cameraReady;

    return GestureDetector(
      onTap: canCapture ? () => _handleShutter(context) : null,
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
                                  color: Color(0xFF0F172A),
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
// active: 필수 완료 시 화면 종료 / inactive: 첫 미촬영 필수 도안으로 이동
// ══════════════════════════════════════════════════════════
class _CompleteButton extends StatelessWidget {
  final CaptureProvider provider;
  const _CompleteButton({required this.provider});

  @override
  Widget build(BuildContext context) {
    final isActive = provider.allMandatoryCaptured;
    final bgColor = isActive
        ? const Color(0xFF3B82F6)
        : const Color(0xFF94A3B8).withAlpha(128);

    return GestureDetector(
      onTap: () => _handleComplete(context, provider),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.only(left: 12, right: 8, top: 8, bottom: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
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
// ══════════════════════════════════════════════════════════
class _Thumbnail extends StatelessWidget {
  final Uint8List bytes;
  final UploadStatus uploadStatus;
  final double size;
  const _Thumbnail({required this.bytes, required this.uploadStatus, this.size = 52});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showPreview(context),
      child: Stack(
        children: [
          Container(
            width: size, height: size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
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
              borderRadius: BorderRadius.circular(12),
              child: Image.memory(bytes, fit: BoxFit.cover),
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
