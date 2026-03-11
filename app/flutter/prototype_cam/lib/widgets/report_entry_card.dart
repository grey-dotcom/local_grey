import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/report_entry.dart';
import '../providers/report_provider.dart';
import '../screens/report_screen.dart';

const _font = 'S-Core Dream';

// ══════════════════════════════════════════════════════════
// 등록한 보고사항 섹션 (항목 없으면 자동 숨김)
// ══════════════════════════════════════════════════════════
class ReportEntriesSection extends StatelessWidget {
  const ReportEntriesSection({super.key});

  @override
  Widget build(BuildContext context) {
    final entries = context.watch<ReportProvider>().entries;
    if (entries.isEmpty) return const SizedBox.shrink();

    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.assignment_outlined, size: 22, color: Colors.black),
          SizedBox(width: 6),
          Text('등록한 보고사항',
              style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 16),
        ...entries.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: ReportEntryCard(entry: e),
        )),
      ]),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 보고사항 카드
// ══════════════════════════════════════════════════════════
class ReportEntryCard extends StatelessWidget {
  final ReportEntry entry;
  const ReportEntryCard({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
      decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // ── 헤더: 보고 유형명 + 수정/삭제 버튼
        Row(children: [
          Expanded(
            child: Text(entry.typeLabel,
                style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 14, fontWeight: FontWeight.w600, height: 22 / 14)),
          ),
          ReportSmallBtn(
            label: '수정',
            color: const Color(0xFF2751E0),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ReportScreen(editEntry: entry)),
            ),
          ),
          const SizedBox(width: 8),
          ReportSmallBtn(
            label: '삭제',
            color: const Color(0xFF505050),
            onTap: () => _confirmDelete(context),
          ),
        ]),
        const SizedBox(height: 12),
        const Divider(height: 1, thickness: 1, color: Color(0xFFD9D9D9)),
        const SizedBox(height: 12),
        // ── 사진 썸네일 (탭하면 전체화면)
        if (entry.photoDataUrls.isNotEmpty) ...[
          ReportPhotoRow(photoDataUrls: entry.photoDataUrls),
          const SizedBox(height: 12),
        ],
        // ── 내용 텍스트 박스
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFDADADA)),
          ),
          child: Text(entry.text,
              style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 12, fontWeight: FontWeight.w200, height: 14 / 12)),
        ),
      ]),
    );
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('보고사항을 삭제하시겠습니까?',
            style: TextStyle(fontFamily: _font, fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black)),
        content: const Text('삭제된 내용은 복구할 수 없습니다.',
            style: TextStyle(fontFamily: _font, fontSize: 14, color: Color(0xFF555555), height: 1.6)),
        actionsAlignment: MainAxisAlignment.end,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소', style: TextStyle(fontFamily: _font, color: Color(0xFF888888), fontWeight: FontWeight.w500)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFDE321C),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('삭제', style: TextStyle(fontFamily: _font, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ],
      ),
    );
    if (result == true && context.mounted) {
      context.read<ReportProvider>().remove(entry.id);
    }
  }
}

// ══════════════════════════════════════════════════════════
// 보고사항 카드 내 사진 행 — 썸네일 탭 → 전체화면 뷰어
// ══════════════════════════════════════════════════════════
class ReportPhotoRow extends StatelessWidget {
  final List<String> photoDataUrls;
  const ReportPhotoRow({super.key, required this.photoDataUrls});

  @override
  Widget build(BuildContext context) {
    const sz = 60.0;
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: photoDataUrls.asMap().entries.map((e) {
        final bytes = _decodeBytes(e.value);
        return GestureDetector(
          onTap: () => _showFullScreen(context, e.key),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: bytes != null
                ? Image.memory(bytes, width: sz, height: sz, fit: BoxFit.cover)
                : Container(
                    width: sz, height: sz,
                    decoration: BoxDecoration(color: const Color(0xFFF3F3F3), borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.broken_image_outlined, size: 24, color: Color(0xFFAAAAAA)),
                  ),
          ),
        );
      }).toList(),
    );
  }

  void _showFullScreen(BuildContext context, int initialIndex) {
    final mq = MediaQuery.of(context);
    showDialog(
      context: context,
      barrierColor: Colors.black,
      builder: (_) => ReportFullScreenViewer(
        photoDataUrls: photoDataUrls,
        initialIndex: initialIndex,
        mq: mq,
      ),
    );
  }

  static Uint8List? _decodeBytes(String dataUrl) {
    try {
      final b64 = dataUrl.contains(',') ? dataUrl.split(',').last : dataUrl;
      return base64Decode(b64);
    } catch (_) {
      return null;
    }
  }
}

// ══════════════════════════════════════════════════════════
// 전체화면 사진 뷰어 (PageView + 핀치줌 + 인디케이터)
// ══════════════════════════════════════════════════════════
class ReportFullScreenViewer extends StatefulWidget {
  final List<String> photoDataUrls;
  final int initialIndex;
  final MediaQueryData mq;
  const ReportFullScreenViewer({
    super.key,
    required this.photoDataUrls,
    required this.initialIndex,
    required this.mq,
  });

  @override
  State<ReportFullScreenViewer> createState() => _ReportFullScreenViewerState();
}

class _ReportFullScreenViewerState extends State<ReportFullScreenViewer> {
  late PageController _pageCtrl;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageCtrl = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  static Uint8List? _decodeBytes(String dataUrl) {
    try {
      final b64 = dataUrl.contains(',') ? dataUrl.split(',').last : dataUrl;
      return base64Decode(b64);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = widget.mq;
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: EdgeInsets.zero,
      child: SizedBox(
        width: mq.size.width, height: mq.size.height,
        child: Stack(fit: StackFit.expand, children: [
          Container(color: Colors.black),
          PageView.builder(
            controller: _pageCtrl,
            itemCount: widget.photoDataUrls.length,
            onPageChanged: (i) => setState(() => _currentIndex = i),
            itemBuilder: (_, i) {
              final bytes = _decodeBytes(widget.photoDataUrls[i]);
              return InteractiveViewer(
                minScale: 0.8, maxScale: 5.0,
                child: Center(
                  child: bytes != null
                      ? Image.memory(bytes, fit: BoxFit.contain, width: mq.size.width, height: mq.size.height)
                      : const Icon(Icons.broken_image_outlined, size: 60, color: Color(0xFFAAAAAA)),
                ),
              );
            },
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
          if (widget.photoDataUrls.length > 1)
            Positioned(
              bottom: mq.padding.bottom + 20, left: 0, right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: Colors.black.withAlpha(120), borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    '${_currentIndex + 1} / ${widget.photoDataUrls.length}',
                    style: const TextStyle(fontFamily: _font, color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            ),
        ]),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 수정/삭제 소형 버튼
// ══════════════════════════════════════════════════════════
class ReportSmallBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const ReportSmallBtn({super.key, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38, height: 26,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color),
        ),
        alignment: Alignment.center,
        child: Text(label, maxLines: 1,
            style: TextStyle(fontFamily: _font, color: color, fontSize: 12, fontWeight: FontWeight.w500, height: 14 / 12)),
      ),
    );
  }
}
