import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';

const _font = 'Spoqa Han Sans Neo';

// ══════════════════════════════════════════════════════════
// 촬영완료 말풍선 오버레이
// fadeIn 200ms → 1300ms 유지 → fadeOut 200ms
// ══════════════════════════════════════════════════════════
class CaptureDoneBubble extends StatefulWidget {
  const CaptureDoneBubble({super.key});

  @override
  State<CaptureDoneBubble> createState() => _CaptureDoneBubbleState();
}

class _CaptureDoneBubbleState extends State<CaptureDoneBubble>
    with SingleTickerProviderStateMixin {
  bool _visible = false;
  AnimationController? _animCtrl;
  Animation<double>? _fadeAnim;
  Animation<Offset>? _slideAnim;

  @override
  void initState() {
    super.initState();
    _setupAnim();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // showCaptureBubble 플래그가 true이면 말풍선을 띄우고 즉시 소비.
    // build() 안에서 처리하지 않으므로 재진입/초기화 타이밍 문제 없음.
    final provider = context.read<CaptureProvider>();
    if (provider.showCaptureBubble) {
      provider.consumeCaptureBubble();
      WidgetsBinding.instance.addPostFrameCallback((_) => _show());
    }
  }

  void _setupAnim() {
    _animCtrl?.dispose();
    final ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 200));
    _animCtrl = ctrl;
    _fadeAnim  = CurvedAnimation(parent: ctrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(CurvedAnimation(parent: ctrl, curve: Curves.easeOut));
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
    // Provider 변경 시 didChangeDependencies가 호출되도록 구독 유지
    context.watch<CaptureProvider>();
    return Positioned(
      left: 0, right: 0, bottom: 172,
      child: IgnorePointer(
        child: Opacity(
          opacity: _visible ? 1.0 : 0.0,
          child: FadeTransition(
            opacity: _fadeAnim ?? const AlwaysStoppedAnimation(1.0),
            child: SlideTransition(
              position: _slideAnim ?? const AlwaysStoppedAnimation(Offset.zero),
              child: Center(
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
// 촬영완료 버튼
// active: 필수 완료 시 화면 종료 / inactive: 첫 미촬영 필수 도안으로 이동
// ══════════════════════════════════════════════════════════
class CaptureCompleteButton extends StatelessWidget {
  final CaptureProvider provider;
  const CaptureCompleteButton({super.key, required this.provider});

  @override
  Widget build(BuildContext context) {
    final isActive = provider.allMandatoryCaptured;
    final bgColor = isActive
        ? const Color(0xFF3B82F6)
        : const Color(0xFF94A3B8).withAlpha(128);

    return GestureDetector(
      onTap: () => _handleComplete(context),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.only(left: 12, right: 8, top: 8, bottom: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: isActive
              ? [
                  BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 6, spreadRadius: -4, offset: const Offset(0, 4)),
                  BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 15, spreadRadius: -3, offset: const Offset(0, 10)),
                ]
              : [],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('촬영 완료', style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
            SizedBox(width: 4),
            Icon(Icons.check_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _handleComplete(BuildContext context) async {
    if (!provider.allMandatoryCaptured) {
      final target = provider.firstUncapturedMandatory;
      if (target != null) provider.jumpToItem(target.groupIdx, target.itemIdx);
      return;
    }
    if (context.mounted) Navigator.of(context).maybePop();
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
