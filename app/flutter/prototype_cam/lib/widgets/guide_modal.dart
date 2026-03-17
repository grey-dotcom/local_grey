import 'package:flutter/material.dart';
import '../models/task_item.dart';

const _font = 'S-Core Dream';

// ══════════════════════════════════════════════════════════
// 업무 참고사항 가이드 모달
// ══════════════════════════════════════════════════════════
class GuideModal extends StatefulWidget {
  final TaskItem item;
  const GuideModal({super.key, required this.item});

  @override
  State<GuideModal> createState() => _GuideModalState();
}

class _GuideModalState extends State<GuideModal> {
  int _currentPage = 0;

  List<String> get _images =>
      widget.item.guideImageUrl != null ? [widget.item.guideImageUrl!] : [];

  @override
  Widget build(BuildContext context) {
    final hasImages = _images.isNotEmpty;
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      child: Container(
        width: 296,
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          if (hasImages)
            _ImageCarousel(
              images: _images,
              currentPage: _currentPage,
              onPageChanged: (p) => setState(() => _currentPage = p),
            )
          else
            const SizedBox(height: 40),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Center(
                child: Text('업무 참고사항', textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 18, fontWeight: FontWeight.w600, height: 26 / 18)),
              ),
              const SizedBox(height: 8),
              CustomPaint(size: const Size(double.infinity, 1), painter: _DashedLinePainter()),
              const SizedBox(height: 12),
              Text(
                widget.item.instructions ?? widget.item.contents,
                style: const TextStyle(fontFamily: _font, color: Color(0xFF9F9F9F), fontSize: 14, fontWeight: FontWeight.w200, height: 22 / 14),
                maxLines: 3, overflow: TextOverflow.ellipsis,
              ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
            child: SizedBox(
              width: double.infinity, height: 40,
              child: FilledButton(
                onPressed: () => Navigator.pop(context),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF2751E0),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('확인', style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700, height: 22 / 14)),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _ImageCarousel extends StatelessWidget {
  final List<String> images;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  const _ImageCarousel({required this.images, required this.currentPage, required this.onPageChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: Stack(children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          child: PageView.builder(
            itemCount: images.length,
            onPageChanged: onPageChanged,
            itemBuilder: (_, i) => Image.network(images[i], fit: BoxFit.cover, width: double.infinity,
              errorBuilder: (_, __, ___) => Container(
                color: const Color(0xFFF0F0F0),
                child: const Center(child: Icon(Icons.image_outlined, size: 40, color: Color(0xFFCCCCCC))),
              ),
            ),
          ),
        ),
        if (images.length > 1) ...[
          Positioned(
            left: 8, top: 0, bottom: 0,
            child: Center(child: _NavCircle(icon: Icons.chevron_left_rounded,
                onTap: currentPage > 0 ? () => onPageChanged(currentPage - 1) : null)),
          ),
          Positioned(
            right: 8, top: 0, bottom: 0,
            child: Center(child: _NavCircle(icon: Icons.chevron_right_rounded,
                onTap: currentPage < images.length - 1 ? () => onPageChanged(currentPage + 1) : null)),
          ),
        ],
        Positioned(
          bottom: 10, left: 0, right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: Colors.black.withAlpha(100), borderRadius: BorderRadius.circular(20)),
              child: Text('${currentPage + 1}/${images.length}',
                  style: const TextStyle(fontFamily: _font, color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
            ),
          ),
        ),
      ]),
    );
  }
}

class _NavCircle extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _NavCircle({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36, height: 36,
        decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFFD0D0D0)..strokeWidth = 1;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 0), Offset(x + 4, 0), paint);
      x += 7;
    }
  }
  @override
  bool shouldRepaint(_) => false;
}
