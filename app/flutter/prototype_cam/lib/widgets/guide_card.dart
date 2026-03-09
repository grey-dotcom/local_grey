import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';

const _font = 'Spoqa Han Sans Neo';

/// 가이드 카드
/// ┌──────────────────────────────────────────┐
/// │ [필수|선택  n/N]                  [≡]     │
/// │ 업무도안 title (1줄 말줄임)               │
/// │ contents (기본: 40px 고정 / 확장: 전체)  │
/// ├──────────────────────────────────────────┤
/// │  ◦  [②]  ◦  ◦  ◦   페이지네이션         │
/// └──────────────────────────────────────────┘
class GuideCard extends StatelessWidget {
  final VoidCallback onListTap;
  const GuideCard({super.key, required this.onListTap});

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        final item = provider.currentItem;
        final group = provider.currentGroup;
        if (item == null || group == null) return const SizedBox();

        final n = item.order;
        final total = group.items.length;
        final isExpanded = provider.isContentsExpanded;

        return Container(
          color: Colors.white,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── 1행: 배지 + 리스트 버튼 ──
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    _Badge(
                      label: item.isMandatory ? '필수' : '선택',
                      n: n,
                      total: total,
                      mandatory: item.isMandatory,
                    ),
                    const Spacer(),
                    _ListButton(onTap: onListTap),
                  ],
                ),
              ),

              // ── 2행: 타이틀 ──
              // React: h=25px (20px × 1.25) 고정 — 글자 수에 관계없이 높이 동일
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
                child: SizedBox(
                  height: 25,
                  child: Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: _font,
                      color: Color(0xFF0F172A),
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      height: 1.0,
                      leadingDistribution: TextLeadingDistribution.even,
                    ),
                  ),
                ),
              ),

              // ── 3행: contents + 드롭다운 버튼 ──
              // 기본: 1줄 고정(height:40) → 드롭다운 선택 시 아코디언으로 전체 표시
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: AnimatedSize(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeInOut,
                        alignment: Alignment.topLeft,
                        child: SizedBox(
                          height: isExpanded ? null : 23,  // 14px × 1.625 = 22.75 ≈ 23
                          child: Text(
                            item.contents,
                            maxLines: isExpanded ? null : 1,
                            overflow: isExpanded
                                ? TextOverflow.visible
                                : TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: _font,
                              color: Color(0xFF475569),
                              fontSize: 14,
                              height: 1.625,  // line-height: 22.75px (Figma)
                              leadingDistribution: TextLeadingDistribution.even,
                            ),
                          ),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: provider.toggleContents,
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 4, top: 2),
                        child: AnimatedRotation(
                          turns: isExpanded ? 0.5 : 0,
                          duration: const Duration(milliseconds: 220),
                          child: const Icon(
                            Icons.keyboard_arrow_down,
                            color: Color(0xFF94A3B8),
                            size: 22,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── 페이지네이션 ──
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                ),
                child: _PaginationRow(provider: provider),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── 배지: [필수|선택  n/N] ─────────────────────────────────
class _Badge extends StatelessWidget {
  final String label;
  final int n;
  final int total;
  final bool mandatory;
  const _Badge({
    required this.label,
    required this.n,
    required this.total,
    required this.mandatory,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = mandatory ? AppTheme.blue : AppTheme.gray;
    final bgColor = mandatory ? const Color(0xFFEFF6FF) : const Color(0xFFF1F5F9);
    final dividerColor = mandatory ? AppTheme.blue.withAlpha(50) : AppTheme.gray.withAlpha(60);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: TextStyle(
                fontFamily: _font,
                color: textColor,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                height: 1.2,
              )),
          Container(
            width: 1, height: 12,
            margin: const EdgeInsets.symmetric(horizontal: 6),
            color: dividerColor,
          ),
          Text('$n / $total',
              style: TextStyle(
                fontFamily: _font,
                color: textColor,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                height: 1.2,
              )),
        ],
      ),
    );
  }
}

// ── 리스트 버튼 (≡) ────────────────────────────────────────
class _ListButton extends StatelessWidget {
  final VoidCallback onTap;
  const _ListButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 32, height: 32,
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Icon(Icons.format_list_bulleted_rounded, color: Color(0xFF475569), size: 16),
        ),
      ),
    );
  }
}

// ── 페이지네이션 Row ────────────────────────────────────────
class _PaginationRow extends StatelessWidget {
  final CaptureProvider provider;
  const _PaginationRow({required this.provider});

  @override
  Widget build(BuildContext context) {
    final items = provider.currentItems;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(items.length, (i) {
        final isCurrent = i == provider.itemIndex;
        final isDone = provider.isItemCaptured(items[i].id);
        return GestureDetector(
          onTap: () => provider.jumpToItem(provider.groupIndex, i),
          child: Container(
            margin: const EdgeInsets.only(right: 8),
            child: _PaginationDot(index: i + 1, isCurrent: isCurrent, isDone: isDone),
          ),
        );
      }),
    );
  }
}

class _PaginationDot extends StatelessWidget {
  final int index;
  final bool isCurrent;
  final bool isDone;
  const _PaginationDot({required this.index, required this.isCurrent, required this.isDone});

  @override
  Widget build(BuildContext context) {
    if (isCurrent) {
      return Container(
        width: 32, height: 32,
        decoration: BoxDecoration(
          color: AppTheme.blue,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 2, offset: const Offset(0, 1)),
            BoxShadow(color: AppTheme.blue, blurRadius: 0, spreadRadius: 4),
            const BoxShadow(color: Colors.white, blurRadius: 0, spreadRadius: 2),
          ],
        ),
        child: Center(
          child: Text('$index',
              style: const TextStyle(
                fontFamily: _font,
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
                height: 1.0,
              )),
        ),
      );
    }
    if (isDone) {
      return Container(
        width: 24, height: 24,
        decoration: BoxDecoration(
          color: AppTheme.blue,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded, size: 14, color: Colors.white),
      );
    }
    return Container(
      width: 8, height: 8,
      decoration: const BoxDecoration(color: Color(0xFFCBD5E1), shape: BoxShape.circle),
    );
  }
}
