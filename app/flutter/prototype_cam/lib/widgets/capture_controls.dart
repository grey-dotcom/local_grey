import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';

const _font = 'Spoqa Han Sans Neo';

// ══════════════════════════════════════════════════════════
// 촬영완료 말풍선 오버레이
//
// 정책: fadeIn 200ms → 유지 1100ms → fadeOut 200ms = 총 1500ms
//
// [핵심 규칙] build() 안에서는 Provider에 쓰기 작업 절대 금지.
//   consumeCaptureBubble() → notifyListeners() → 빌드 중 setState 에러 발생.
//   → build()에서는 showCaptureBubble 값 읽기(read)만 수행.
//   → consume 및 _show() 호출은 모두 addPostFrameCallback 안에서만 실행.
//
// [버그 수정 1] 한글 깨짐
//   빠른 촬영 시 _isShowing=true 동안 신규 _show() 차단.
//   AnimationController는 initState에서 단 1회 생성.
//
// [버그 수정 2] 토스트 시간
//   fadeIn 200ms + 유지 1100ms + fadeOut 200ms = 정확히 1500ms.
// ══════════════════════════════════════════════════════════
class CaptureDoneBubble extends StatefulWidget {
  const CaptureDoneBubble({super.key});

  @override
  State<CaptureDoneBubble> createState() => _CaptureDoneBubbleState();
}

class _CaptureDoneBubbleState extends State<CaptureDoneBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<Offset> _slideAnim;

  bool _visible          = false;
  bool _isShowing        = false; // 표시 중 중복 진입 방지
  bool _pendingConsume   = false; // postFrameCallback 예약됐는지 여부

  static const _fadeInDuration  = Duration(milliseconds: 200);
  static const _holdDuration    = Duration(milliseconds: 1100);
  static const _fadeOutDuration = Duration(milliseconds: 200);

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: _fadeInDuration);
    _fadeAnim  = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _show() {
    if (_isShowing || !mounted) return;
    _isShowing = true;

    setState(() => _visible = true);
    _animCtrl.duration = _fadeInDuration;
    _animCtrl.forward(from: 0).then((_) {
      if (!mounted) return;
      Future.delayed(_holdDuration, () {
        if (!mounted) return;
        _animCtrl.duration = _fadeOutDuration;
        _animCtrl.reverse().then((_) {
          if (!mounted) return;
          setState(() {
            _visible   = false;
            _isShowing = false;
          });
        });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    // build()에서는 읽기만 — Provider 상태 변경 금지
    final provider = context.watch<CaptureProvider>();

    // showCaptureBubble=true이고 아직 콜백 예약이 없을 때만 예약
    if (provider.showCaptureBubble && !_pendingConsume) {
      _pendingConsume = true;
      // 빌드 완료 후 실행 — consumeCaptureBubble()의 notifyListeners()가
      // 빌드 사이클 밖에서 호출되도록 보장
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _pendingConsume = false;
        // consume과 _show() 모두 postFrame 안에서 실행
        context.read<CaptureProvider>().consumeCaptureBubble();
        _show();
      });
    }

    return Positioned(
      left: 0, right: 0, bottom: 172,
      child: IgnorePointer(
        child: Visibility(
          visible: _visible,
          child: FadeTransition(
            opacity: _fadeAnim,
            child: SlideTransition(
              position: _slideAnim,
              child: Center(
                child: Column(
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
                              color: const Color(0x1A137FEC),
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
                                    textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700, height: 1.625)),
                                Text('다음 업무 사진을 촬영해주세요',
                                    textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 12, fontWeight: FontWeight.w400, height: 1.625)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    CustomPaint(size: const Size(14, 7), painter: _BubbleTailPainter()),
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
    final paint = Paint()..color = const Color(0x1A137FEC)..style = PaintingStyle.fill;
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
// 셔터 버튼
// ══════════════════════════════════════════════════════════
class ShutterButton extends StatelessWidget {
  final CaptureProvider provider;
  const ShutterButton({super.key, required this.provider});

  @override
  Widget build(BuildContext context) {
    final canCapture = !provider.isCapturing && provider.cameraReady;
    return GestureDetector(
      onTap: canCapture ? () => provider.capture() : null,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 84, height: 84,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.transparent,
          border: Border.all(color: canCapture ? Colors.white : Colors.white38, width: 4),
          boxShadow: [BoxShadow(color: Colors.black.withAlpha(77), blurRadius: 15)],
        ),
        child: Center(
          child: provider.isCapturing
              ? const SizedBox(width: 28, height: 28,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
              : Container(
                  width: 68, height: 68,
                  decoration: BoxDecoration(
                    color: canCapture ? Colors.white : Colors.white38,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.black.withAlpha(26), width: 3),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 15, spreadRadius: -3, offset: const Offset(0, 10)),
                      BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 6, spreadRadius: -4, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: provider.isRecaptureMode
                      ? const Center(child: Text('재촬영',
                          style: TextStyle(fontFamily: _font, color: Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.w700)))
                      : null,
                ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 촬영 화면 썸네일 (좌하단 미리보기)
// ══════════════════════════════════════════════════════════
class CaptureThumbnail extends StatelessWidget {
  final Uint8List bytes;
  final UploadStatus uploadStatus;
  final double size;
  const CaptureThumbnail({super.key, required this.bytes, required this.uploadStatus, this.size = 52});

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
                BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 15, spreadRadius: -3, offset: const Offset(0, 10)),
                BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 6, spreadRadius: -4, offset: const Offset(0, 4)),
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
                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                child: const Padding(padding: EdgeInsets.all(3),
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5)))),
          if (uploadStatus == UploadStatus.success)
            Positioned(bottom: 2, right: 2,
              child: Container(width: 16, height: 16,
                decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
                child: const Icon(Icons.check, size: 10, color: Colors.white))),
          if (uploadStatus == UploadStatus.error)
            Positioned(bottom: 2, right: 2,
              child: Container(width: 16, height: 16,
                decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                child: const Icon(Icons.error_outline, size: 10, color: Colors.white))),
        ],
      ),
    );
  }

  void _showPreview(BuildContext context) {
    final mq = MediaQuery.of(context);
    showDialog(
      context: context,
      barrierColor: Colors.black,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: SizedBox(
          width: mq.size.width, height: mq.size.height,
          child: Stack(fit: StackFit.expand, children: [
            Container(color: Colors.black),
            InteractiveViewer(
              minScale: 0.8, maxScale: 5.0,
              child: Center(child: Image.memory(bytes, fit: BoxFit.contain, width: mq.size.width, height: mq.size.height)),
            ),
            Positioned(
              top: mq.padding.top + 12, right: 16,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: Colors.black.withAlpha(140), shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 20),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
