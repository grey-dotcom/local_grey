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
//
// [Phase 1] 에러 노출 경로 — 에러 탭 → 재시도 바텀시트
// [Phase 3] queued / uploading UI 분리
//   queued   : 모달 톤앤매너 — 연파랑 배경, 시계 아이콘 + "대기중" 텍스트
//   uploading: 기존 스피너 유지
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
        TaskPhotoCell(
          capture: capture,
          onTap: () => _goCapture(context),
          onErrorTap: capture?.status == UploadStatus.error
              ? () => _showUploadErrorSheet(context, capture!)
              : null,
        ),
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
                    _UploadStatusLabel(status: capture!.status),
                  ],
                ]),
              ),
              const SizedBox(width: 8),
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

  void _showUploadErrorSheet(BuildContext context, CaptureResult capture) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _UploadErrorSheet(
        itemTitle: item.title,
        capture: capture,
        onRetry: capture.isRetryable
            ? () { Navigator.pop(ctx); provider.retryUpload(item.id); }
            : null,
        onRecapture: () { Navigator.pop(ctx); _goCapture(context); },
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// [Phase 3] 업로드 상태 레이블 — queued / uploading UI 분리
//   queued   : 모달과 동일한 톤앤매너 (연파랑, "대기중")
//   uploading: 기존 스피너 + "업로드 중" 유지
// ══════════════════════════════════════════════════════════
class _UploadStatusLabel extends StatelessWidget {
  final UploadStatus status;
  const _UploadStatusLabel({required this.status});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      // [Phase 3] queued: 모달 업로드중 뱃지와 동일 색상 톤 (연파랑 #1D4ED8)
      case UploadStatus.queued:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.schedule_rounded, size: 10, color: Color(0xFF1D4ED8)),
          SizedBox(width: 3),
          Text('대기중', style: TextStyle(fontFamily: _font, color: Color(0xFF1D4ED8), fontSize: 10, fontWeight: FontWeight.w500)),
        ]);
      // uploading: 기존 스피너 유지
      case UploadStatus.uploading:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          SizedBox(
            width: 9, height: 9,
            child: CircularProgressIndicator(color: Color(0xFF94A3B8), strokeWidth: 1.5),
          ),
          SizedBox(width: 3),
          Text('업로드 중', style: TextStyle(fontFamily: _font, color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w500)),
        ]);
      case UploadStatus.success:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.check_circle_outline_rounded, size: 11, color: _checkGreen),
          SizedBox(width: 3),
          Text('촬영 완료', style: TextStyle(fontFamily: _font, color: _checkGreen, fontSize: 10, fontWeight: FontWeight.w500)),
        ]);
      case UploadStatus.error:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.error_outline_rounded, size: 11, color: Color(0xFFEF4444)),
          SizedBox(width: 3),
          Text('업로드 실패', style: TextStyle(fontFamily: _font, color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.w500)),
        ]);
      case UploadStatus.idle:
        return const SizedBox.shrink();
    }
  }
}

// ══════════════════════════════════════════════════════════
// [Phase 3] 사진 셀 — queued / uploading 아이콘 분리
//   queued  : 시계 아이콘 (연파랑)
//   uploading: 스피너 (흰색)
// ══════════════════════════════════════════════════════════
class TaskPhotoCell extends StatelessWidget {
  final CaptureResult? capture;
  final VoidCallback onTap;
  final VoidCallback? onErrorTap;

  const TaskPhotoCell({
    super.key,
    required this.capture,
    required this.onTap,
    this.onErrorTap,
  });

  @override
  Widget build(BuildContext context) {
    const sz = 60.0;
    if (capture != null) {
      final isError    = capture!.status == UploadStatus.error;
      final isQueued   = capture!.status == UploadStatus.queued;
      final isUploading = capture!.status == UploadStatus.uploading;

      return GestureDetector(
        onTap: isError ? onErrorTap ?? onTap : onTap,
        child: SizedBox(width: sz, height: sz,
          child: Stack(children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.memory(capture!.bytes, width: sz, height: sz, fit: BoxFit.cover),
            ),
            Container(
              width: sz, height: sz,
              decoration: BoxDecoration(
                color: isError
                    ? const Color(0xFFEF4444).withAlpha(60)
                    : isQueued
                        ? const Color(0xFF1D4ED8).withAlpha(30)
                        : Colors.black.withAlpha(40),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            Center(
              child: isError
                  ? Container(
                      width: 24, height: 24,
                      decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                      child: const Icon(Icons.refresh_rounded, size: 14, color: Colors.white),
                    )
                  : isQueued
                      ? Container(
                          width: 24, height: 24,
                          decoration: BoxDecoration(color: const Color(0xFFBFDBFE), shape: BoxShape.circle),
                          child: const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF1D4ED8)),
                        )
                  : isUploading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Container(
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

// ══════════════════════════════════════════════════════════
// 업로드 에러 재시도 바텀시트
// ══════════════════════════════════════════════════════════
class _UploadErrorSheet extends StatelessWidget {
  final String itemTitle;
  final CaptureResult capture;
  final VoidCallback? onRetry;
  final VoidCallback onRecapture;

  const _UploadErrorSheet({
    required this.itemTitle,
    required this.capture,
    required this.onRetry,
    required this.onRecapture,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 20),
            const SizedBox(width: 8),
            const Text('업로드 실패', style: TextStyle(fontFamily: _font, fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          ]),
          const SizedBox(height: 8),
          Text('\'$itemTitle\' 사진이 서버에 전송되지 못했습니다.',
              style: const TextStyle(fontFamily: _font, fontSize: 13, color: Color(0xFF64748B), height: 1.5)),
          const SizedBox(height: 4),
          Text(
            onRetry != null ? '네트워크 상태를 확인한 후 다시 시도해 주세요.' : '파일 오류가 발생했습니다. 다시 촬영해 주세요.',
            style: const TextStyle(fontFamily: _font, fontSize: 12, color: Color(0xFF94A3B8), height: 1.5),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: onRecapture,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('다시 촬영', style: TextStyle(fontFamily: _font, fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: onRetry,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2751E0),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('다시 시도', style: TextStyle(fontFamily: _font, fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                ),
              ),
            ],
          ]),
        ]),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 촬영 완료 토스트 — fade in 300ms → 900ms → fade out 300ms
// ══════════════════════════════════════════════════════════
void _showCaptureCompleteToast(BuildContext context) {
  final overlay = Overlay.of(context);
  late OverlayEntry entry;
  entry = OverlayEntry(builder: (_) => _CaptureCompleteToast(onDismiss: () => entry.remove()));
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
  static const _fadeIn  = Duration(milliseconds: 300);
  static const _hold    = Duration(milliseconds: 900);
  static const _fadeOut = Duration(milliseconds: 300);

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: _fadeIn);
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _ctrl.forward().then((_) {
      Future.delayed(_hold, () {
        if (!mounted) return;
        _ctrl.duration = _fadeOut;
        _ctrl.reverse().then((_) { if (mounted) widget.onDismiss(); });
      });
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0, right: 0,
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
                boxShadow: [BoxShadow(color: Colors.black.withAlpha(40), blurRadius: 16, offset: const Offset(0, 4))],
              ),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.check_circle_rounded, color: Color(0xFF0FE995), size: 18),
                SizedBox(width: 8),
                Text('모든 촬영이 완료되었습니다',
                    style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600, height: 1.4)),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
