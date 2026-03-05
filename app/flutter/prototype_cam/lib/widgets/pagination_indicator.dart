// [미사용 파일] guide_card.dart의 _PaginationRow/_PaginationDot으로 인라인 통합됨.
// 네이티브 전환 시 재사용 가능성이 있으므로 보존. 불필요하면 삭제 가능.
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../utils/app_theme.dart';

class PaginationIndicator extends StatelessWidget {
  const PaginationIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        final items = provider.currentItems;
        if (items.isEmpty) return const SizedBox();

        return SizedBox(
          height: 32,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(items.length, (i) {
              final item = items[i];
              final isCurrent = i == provider.itemIndex;
              final isDone = provider.isItemCaptured(item.id);

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: _Dot(
                  isCurrent: isCurrent,
                  isDone: isDone,
                  number: i + 1,
                  onTap: () => provider.jumpToItem(provider.groupIndex, i),
                ),
              );
            }),
          ),
        );
      },
    );
  }
}

class _Dot extends StatelessWidget {
  final bool isCurrent;
  final bool isDone;
  final int number;
  final VoidCallback onTap;

  const _Dot({
    required this.isCurrent,
    required this.isDone,
    required this.number,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // 완료
    if (isDone && !isCurrent) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: AppTheme.blue.withAlpha(20),
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.blue, width: 1.5),
          ),
          child: const Icon(Icons.check, color: AppTheme.blue, size: 12),
        ),
      );
    }

    // 현재
    if (isCurrent) {
      return GestureDetector(
        onTap: onTap,
        child: Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: AppTheme.blue,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      );
    }

    // 대기
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(80),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
