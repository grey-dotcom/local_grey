import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/task_item.dart';
import '../providers/capture_provider.dart';
import '../screens/capture_screen.dart';
import 'guide_modal.dart';

const _font        = 'S-Core Dream';
const _mandatory   = Color(0xFFDE321C);
const _guideBlue   = Color(0xFF2751E0);
const _guideGray   = Color(0xFF888888);
const _checkGreen  = Color(0xFF0FE995);

// ══════════════════════════════════════════════════════════
// 업무 도안 카드
// [개발자] "사진추가" 셀 탭 → CaptureScreen 이동이 핵심 진입점입니다.
// ══════════════════════════════════════════════════════════
class TaskCard extends StatelessWidget {
  final TaskItem item;
  final int groupIdx, itemIdx;
  final CaptureProvider provider;
  const TaskCard({
    super.key,
    required this.item,
    required this.groupIdx,
    required this.itemIdx,
    required this.provider,
  });

  @override
  Widget build(BuildContext context) {
    final capture     = provider.captureOf(item.id);
    final isDone      = capture != null;
    final guideActive = item.hasGuide;

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(8)),
      child: Row(children: [
        // 사진추가 / 촬영완료 셀 → CaptureScreen 진입
        TaskPhotoCell(capture: capture, onTap: () => _goCapture(context)),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  RichText(
                    maxLines: 2, overflow: TextOverflow.ellipsis,
                    text: TextSpan(
                      style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 12, fontWeight: FontWeight.w500, height: 14 / 12),
                      children: [
                        if (item.isMandatory) const TextSpan(text: '*', style: TextStyle(color: _mandatory)),
                        TextSpan(text: item.title),
                      ],
                    ),
                  ),
                  if (isDone) ...[
                    const SizedBox(height: 4),
                    const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.check_circle_outline_rounded, size: 11, color: _checkGreen),
                      SizedBox(width: 3),
                      Text('촬영 완료', style: TextStyle(fontFamily: _font, color: _checkGreen, fontSize: 10, fontWeight: FontWeight.w500)),
                    ]),
                  ],
                ]),
              ),
              const SizedBox(width: 8),
              // 가이드 버튼: 가이드 있으면 파랑(active), 없으면 회색(비활성)
              GestureDetector(
                onTap: guideActive ? () => _showGuide(context) : null,
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(8)),
                  child: Center(child: Icon(Icons.description_outlined, size: 16, color: guideActive ? _guideBlue : _guideGray)),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }

  Future<void> _goCapture(BuildContext context) async {
    provider.jumpToItem(groupIdx, itemIdx);

    // CaptureScreen에서 pop(true)로 돌아오면 모든 필수 촬영 완료 → 토스트 표시
    final result = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => ChangeNotifierProvider.value(value: provider, child: const CaptureScreen()),
    ));

    if (result == true && context.mounted) {
      _showCaptureCompleteToast(context);
    }
  }

  void _showGuide(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withAlpha(100),
      builder: (_) => GuideModal(item: item),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 촬영 완료 토스트
// fade in 300ms → 900ms 유지 → fade out 300ms = 총 1500ms
// ══════════════════════════════════════════════════════════
void _showCaptureCompleteToast(BuildContext context) {
  final overlay = Overlay.of(context);
  late OverlayEntry entry;

  entry = OverlayEntry(
    builder: (_) => _CaptureCompleteToast(
      onDismiss: () => entry.remove(),
    ),
  );

  overlay.insert(entry);
}

class _CaptureCompleteToast extends StatefulWidget {
  final VoidCallback onDismiss;
  const _CaptureCompleteToast({required this.onDismiss});

  @override
  State<_CaptureCompleteToast> createState() => _CaptureCompleteToastState();
}

class _CaptureCompleteToastState extends State<_CaptureCompleteToast>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fade;

  // 타이밍: fade in 300ms → 900ms 유지 → fade out 300ms = 1500ms 총합
  static const _fadeIn  = Duration(milliseconds: 300);
  static const _hold    = Duration(milliseconds: 900);
  // [버그 수정 노트] _fadeOut unused_field 수정 — _ctrl.duration을 fade out 시 교체해 실제 사용
  static const _fadeOut = Duration(milliseconds: 300);

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: _fadeIn);
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);

    // fade in
    _ctrl.forward().then((_) {
      // 유지
      Future.delayed(_hold, () {
        if (!mounted) return;
        // fade out — duration을 _fadeOut으로 교체 후 reverse
        _ctrl.duration = _fadeOut;
        _ctrl.reverse().then((_) {
          if (mounted) widget.onDismiss();
        });
      });
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: MediaQuery.of(context).padding.bottom + 32,
      child: IgnorePointer(
        child: FadeTransition(
          opacity: _fade,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withAlpha(230),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withAlpha(40), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_rounded, color: Color(0xFF0FE995), size: 18),
                  SizedBox(width: 8),
                  Text(
                    '모든 촬영이 완료되었습니다',
                    style: TextStyle(
                      fontFamily: _font,
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 사진 셀 60×60
// ══════════════════════════════════════════════════════════
class TaskPhotoCell extends StatelessWidget {
  final CaptureResult? capture;
  final VoidCallback onTap;
  const TaskPhotoCell({super.key, required this.capture, required this.onTap});

  @override
  Widget build(BuildContext context) {
    const sz = 60.0;
    if (capture != null) {
      return GestureDetector(
        onTap: onTap,
        child: SizedBox(width: sz, height: sz,
          child: Stack(children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.memory(capture!.bytes, width: sz, height: sz, fit: BoxFit.cover),
            ),
            Container(
              width: sz, height: sz,
              decoration: BoxDecoration(color: Colors.black.withAlpha(40), borderRadius: BorderRadius.circular(8)),
            ),
            Center(
              child: Container(
                width: 24, height: 24,
                decoration: const BoxDecoration(color: _checkGreen, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, size: 14, color: Colors.white),
              ),
            ),
          ]),
        ),
      );
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: sz, height: sz,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFDADADA)),
        ),
        child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.camera_alt_outlined, size: 20, color: Colors.black),
          SizedBox(height: 2),
          Text('사진추가', style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 8, fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }
}
