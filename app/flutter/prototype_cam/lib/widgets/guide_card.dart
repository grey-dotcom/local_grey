import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';

const _font = 'Spoqa Han Sans Neo';

/// 가이드 카드 — 4구역 레이아웃
/// ┌──────────────────────────────────────────┐
/// │ (1) NavBar (헤더) — capture_screen.dart  │
/// ├──────────────────────────────────────────┤
/// │ (2) [필수|선택  n/N]            [≡]      │  padding top/bottom 10px
/// ├──────────────────────────────────────────┤  ↕ 20px (10+10)
/// │ (3) 업무도안 title                        │  padding top 10px (배지→타이틀 5px 내부)
/// │     contents (기본 1줄 / 확장 전체)       │  padding bottom 10px
/// ├──────────────────────────────────────────┤  ↕ 20px (10+10)
/// │ (4) ← 캐러셀 가로 스크롤 영역 →          │  padding top/bottom 10px
/// │     ✓  ✓  ●  ·  ·  ·  ·                 │
/// └──────────────────────────────────────────┘
// [시안 A 반영]
// - 배지 height 26px 고정
// - 배지 font weight w500
// - 캐러셀 현재 도트: Stack으로 파랑원+흰링+파랑링 레이어 명시
// - 캐러셀 Row crossAxisAlignment: center
// - 캐러셀 하단 라인 제거
// - 리스트 버튼 border 0.5px solid #E2E8F0
// [레이아웃 수정] (2)(3)(4) 상하 패딩 각 10px
// → 영역 간 마진 = 10(하단) + 10(상단) = 20px
// [버그 수정 노트] 현재 도트 boxShadow → Stack 방식으로 전환
// boxShadow spreadRadius는 바깥으로 퍼지는 방식이라
// 흰 링이 파랑 링을 가리는 레이어 구조를 만들 수 없음.
// Stack으로 파랑 링(24px) → 흰 링(20px) → 파랑 원(16px) 순으로 명시적 레이어링.
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

        final n = provider.currentItemGlobalIndex;
        final total = provider.totalItemCount;
        final isExpanded = provider.isContentsExpanded;

        return Container(
          color: Colors.white,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── (2) 배지 + 리스트 버튼 ──────────────────────
              // [레이아웃] padding top 10, bottom 10
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
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

              // ── (3) 타이틀 + contents ─────────────────────────
              // [레이아웃] (3) 전체 padding top 10, bottom 10
              // 내부 배지→타이틀 5px 마진은 title padding-top으로 유지
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // (3-a) 타이틀
                    SizedBox(
                      height: 25,
                      child: Text(
                        item.title,
                        key: ValueKey('title_${item.id}'),
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
                    const SizedBox(height: 8),
                    // (3-b) contents + 드롭다운
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: AnimatedSize(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeInOut,
                            alignment: Alignment.topLeft,
                            child: SizedBox(
                              height: isExpanded ? null : 23,
                              child: Text(
                                item.contents,
                                key: ValueKey('contents_${item.id}'),
                                maxLines: isExpanded ? null : 1,
                                overflow: isExpanded
                                    ? TextOverflow.visible
                                    : TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontFamily: _font,
                                  color: Color(0xFF475569),
                                  fontSize: 14,
                                  height: 1.625,
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
                  ],
                ),
              ),

              // ── (4) 캐러셀 — 가로 스크롤 독립 영역 ───────────
              // [레이아웃] padding top 10, bottom 10
              // [시안 A] 하단 라인 제거
              // [정책] SingleChildScrollView로 캐러셀 영역을 분리.
              // 상위 _SwipeDetector(카메라 영역)는 Expanded 안에 있으므로
              // 이 영역과 스와이프 충돌 없음.
              Container(
                padding: const EdgeInsets.fromLTRB(0, 10, 0, 10),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _PaginationRow(provider: provider),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── 배지: [필수|선택  n/N] ─────────────────────────────────
// [시안 A] height 26px 고정, font weight w500
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
      height: 26,
      padding: const EdgeInsets.symmetric(horizontal: 10),
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
                fontWeight: FontWeight.w500,
                height: 1.2,
              )),
          Container(
            width: 1, height: 11,
            margin: const EdgeInsets.symmetric(horizontal: 6),
            color: dividerColor,
          ),
          Text('$n / $total',
              style: TextStyle(
                fontFamily: _font,
                color: textColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.2,
              )),
        ],
      ),
    );
  }
}

// ── 리스트 버튼 (≡) ────────────────────────────────────────
// [시안 A] border 0.5px solid #E2E8F0, 외곽 32px, 내부 아이콘 16px
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
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          shape: BoxShape.circle,
          border: Border.all(
            color: const Color(0xFFE2E8F0),
            width: 0.5,
          ),
        ),
        child: const Center(
          child: Icon(Icons.format_list_bulleted_rounded, color: Color(0xFF475569), size: 16),
        ),
      ),
    );
  }
}

// ── 페이지네이션 Row ────────────────────────────────────────
// [정책] 가로 스크롤 컨테이너 내부. 도트 간격 margin right 8.
class _PaginationRow extends StatelessWidget {
  final CaptureProvider provider;
  const _PaginationRow({required this.provider});

  @override
  Widget build(BuildContext context) {
    final items = provider.currentItems;
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: List.generate(items.length, (i) {
        final isCurrent = i == provider.itemIndex;
        final isDone = provider.isItemCaptured(items[i].id);
        return GestureDetector(
          onTap: () => provider.jumpToItem(provider.groupIndex, i),
          child: Container(
            margin: const EdgeInsets.only(right: 8),
            child: _PaginationDot(isCurrent: isCurrent, isDone: isDone),
          ),
        );
      }),
    );
  }
}

// ── 페이지네이션 도트 ─────────────────────────────────────
// [시안 A]
//   현재  : Stack 24px
//            파랑 원(24) → 흰 원(20) → 파랑 원(16)
//   완료  : 파란 원 20×20 + ✓ (size 11)
//   미촬영: 회색 점 8×8
class _PaginationDot extends StatelessWidget {
  final bool isCurrent;
  final bool isDone;
  const _PaginationDot({required this.isCurrent, required this.isDone});

  @override
  Widget build(BuildContext context) {
    if (isCurrent) {
      return SizedBox(
        width: 24, height: 24,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // 가장 바깥: 파랑 링
            Container(
              width: 24, height: 24,
              decoration: BoxDecoration(
                color: AppTheme.blue,
                shape: BoxShape.circle,
              ),
            ),
            // 중간: 흰 링
            Container(
              width: 20, height: 20,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
            // 안쪽: 파랑 원
            Container(
              width: 16, height: 16,
              decoration: BoxDecoration(
                color: AppTheme.blue,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      );
    }
    if (isDone) {
      return Container(
        width: 20, height: 20,
        decoration: BoxDecoration(
          color: AppTheme.blue,
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.check_rounded, size: 11, color: Colors.white),
      );
    }
    return Container(
      width: 8, height: 8,
      decoration: const BoxDecoration(color: Color(0xFFCBD5E1), shape: BoxShape.circle),
    );
  }
}
