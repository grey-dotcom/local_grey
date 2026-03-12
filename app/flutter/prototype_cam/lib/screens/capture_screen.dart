import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/camera_view.dart';
import '../widgets/capture_controls.dart';
import '../widgets/guide_card.dart';
import '../widgets/task_list_modal.dart';

const _font = 'Spoqa Han Sans Neo';

// ── 레이아웃 상수 (390px 기준) ──
const double _shutterBottom  =  80.0;
const double _thumbBottom    =  96.0;
const double _thumbSize      =  52.0;
const double _shutterRadius  =  42.0;
const double _thumbGap       =  50.0;
const double _completeBottom =  28.0;
const double _sideInset      =  24.0;

// ══════════════════════════════════════════════════════════
// 촬영 화면
// ══════════════════════════════════════════════════════════
class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // 모든 필수 촬영 완료 콜백 등록.
    // 중간 도안 촬영으로 필수가 완료된 경우에만 발화.
    // (마지막 도안 위치에서의 완료는 capture_provider에서 자동 pop 제외 처리)
    final provider = context.read<CaptureProvider>();
    provider.onAllMandatoryComplete = () {
      if (mounted) Navigator.of(context).pop(true);
    };
  }

  @override
  void dispose() {
    // 화면 종료 시 콜백 해제 — 메모리 누수 및 해제된 context 참조 방지
    final provider = context.read<CaptureProvider>();
    provider.onAllMandatoryComplete = null;
    super.dispose();
  }

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
            child: Column(children: [
              _TopArea(onListTap: () => _showTaskModal(context, provider)),
              Expanded(
                child: Stack(children: [
                  const Positioned.fill(child: _LiveCamera()),
                  Positioned.fill(
                    child: IgnorePointer(
                      child: Container(color: Colors.black.withAlpha(102)),
                    ),
                  ),
                  Positioned(top: 32, left: 0, right: 0, child: _HintPill()),
                  const CaptureDoneBubble(),
                  const Positioned.fill(child: _SwipeArrows()),
                  if (provider.currentCapture?.status == UploadStatus.uploading)
                    const Positioned(top: 12, right: 12, child: _UploadIndicator()),
                  if (provider.isRecaptureMode)
                    Builder(builder: (ctx) {
                      final w = MediaQuery.of(ctx).size.width;
                      final thumbLeft = w / 2 - _shutterRadius - _thumbGap - _thumbSize;
                      return Positioned(
                        bottom: _thumbBottom, left: thumbLeft,
                        child: CaptureThumbnail(
                          bytes: provider.currentCapture!.bytes,
                          uploadStatus: provider.currentCapture!.status,
                          size: _thumbSize,
                        ),
                      );
                    }),
                  Positioned(
                    bottom: _shutterBottom, left: 0, right: 0,
                    child: Center(child: ShutterButton(provider: provider)),
                  ),
                  // 촬영 완료 버튼: 마지막 도안일 때만 표시
                  // - active(필수 전체 완료): 탭 시 화면 종료
                  // - inactive: 탭 시 첫 미촬영 필수 도안으로 이동
                  if (provider.isLastItem)
                    Positioned(
                      bottom: _completeBottom, right: _sideInset,
                      child: CaptureCompleteButton(provider: provider),
                    ),
                ]),
              ),
            ]),
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
              const Icon(Icons.videocam_off_outlined, size: 64, color: Color(0xFFCBD5E1)),
              const SizedBox(height: 20),
              const Text('카메라 권한이 필요합니다',
                  style: TextStyle(fontFamily: _font, fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
              const SizedBox(height: 8),
              const Text('업무 촬영을 위해 브라우저에서\n카메라 접근을 허용해주세요.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontFamily: _font, fontSize: 14, color: Color(0xFF64748B), height: 1.6)),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('다시 시도',
                      style: TextStyle(fontFamily: _font, fontSize: 15, fontWeight: FontWeight.w700)),
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
    final viewId   = provider.cameraViewId;
    if (provider.cameraReady && viewId != null) {
      return CameraView(viewId: viewId);
    }
    return Container(
      color: const Color(0xFF0F172A),
      child: const Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          CircularProgressIndicator(color: Colors.white38, strokeWidth: 2),
          SizedBox(height: 12),
          Text('카메라 초기화 중...', style: TextStyle(fontFamily: _font, color: Colors.white38, fontSize: 13)),
        ]),
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
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          _NavBar(),
          GuideCard(onListTap: onListTap),
        ]),
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
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        _BackButton(),
        Expanded(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(provider.currentGroup?.title ?? '',
                style: const TextStyle(fontFamily: _font, color: Color(0xFF0F172A), fontSize: 17, fontWeight: FontWeight.w700, letterSpacing: -0.43)),
            const SizedBox(height: 4),
            _GroupDots(),
          ]),
        ),
        const SizedBox(width: 40, height: 40),
      ]),
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

  Future<void> _handleBack(BuildContext context, CaptureProvider provider) async {
    // [미촬영 검증 주석시작] 필수 미완료 시 다이얼로그 비활성화
    /*
    if (provider.allMandatoryCaptured) {
      if (context.mounted) Navigator.of(context).maybePop();
      return;
    }
    ...
    */
    // [미촬영 검증 주석끝] 어떤 상태든 바로 나가기
    if (context.mounted) Navigator.of(context).maybePop();
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
    final hint = provider.isRecaptureMode
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
            textAlign: TextAlign.center, maxLines: 2,
            style: const TextStyle(fontFamily: _font, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w400, height: 1.5)),
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
      decoration: BoxDecoration(color: Colors.black.withAlpha(140), borderRadius: BorderRadius.circular(20)),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        SizedBox(width: 12, height: 12,
            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5)),
        SizedBox(width: 6),
        Text('업로드 중', style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500)),
      ]),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 스와이프 화살표
// [정책] 순환 스와이프: 첫 도안 ↔ 마지막 도안 양방향 순환.
//        화살표는 항상 표시 (끝 도안에서도 반대편 끝으로 이동 가능).
// ══════════════════════════════════════════════════════════
class _SwipeArrows extends StatelessWidget {
  const _SwipeArrows();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CaptureProvider>();

    return Stack(children: [
      Positioned(
        top: 0, bottom: 0, left: 0, width: 64,
        child: _ArrowButton(icon: Icons.chevron_left, onTap: provider.goPrevItemOrGroup),
      ),
      Positioned(
        top: 0, bottom: 0, right: 0, width: 64,
        child: _ArrowButton(icon: Icons.chevron_right, onTap: provider.goNextItemOrGroup),
      ),
    ]);
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
      child: SizedBox(width: 64,
        child: Center(child: Icon(icon, color: Colors.white.withAlpha(128), size: 48)),
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

  const _SwipeDetector({required this.child, required this.onSwipeLeft, required this.onSwipeRight});

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
          // [버그 수정 노트] if/else 중괄호 추가 (curly_braces_in_flow_control_structures)
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
