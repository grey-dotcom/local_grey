import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../models/task_item.dart';
import '../utils/app_theme.dart';

const _font = 'Spoqa Han Sans Neo';

/// 촬영 업무 선택 모달
/// - width: 화면 너비 100% (반응형)
/// - height: 화면 92% (상단 마진 8% 유지)
/// - 전체 그룹 × 전체 도안 표시
class TaskListModal extends StatelessWidget {
  const TaskListModal({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        final screenSize = MediaQuery.of(context).size;
        final modalH = screenSize.height * 0.92;
        final totalCount = provider.groups.fold(0, (sum, g) => sum + g.items.length);

        final items = _buildItemList(provider); // 한 번만 생성
        return Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            width: double.infinity,
            height: modalH,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(
                  color: Color(0x1F000000),
                  blurRadius: 32,
                  offset: Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              children: [
                _ModalHeader(),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final entry = items[index];
                      if (entry is _GroupHeader) {
                        return _GroupSectionHeader(
                          title: entry.title,
                          isFirst: index == 0,
                          isActive: entry.groupIndex == provider.groupIndex,
                        );
                      }
                      final data = entry as _ItemData;
                      return Padding(
                        // 피그마: gap:12px
              padding: const EdgeInsets.only(bottom: 12),
                        child: _TaskCard(
                          item: data.item,
                          globalIndex: data.globalIndex,
                          isCurrent: data.groupIndex == provider.groupIndex &&
                              data.indexInGroup == provider.itemIndex,
                          isDone: provider.isItemCaptured(data.item.id),
                          onTap: () {
                            provider.jumpToItem(data.groupIndex, data.indexInGroup);
                            Navigator.pop(context);
                          },
                        ),
                      );
                    },
                  ),
                ),
                _ModalFooter(totalCount: totalCount),
                SizedBox(height: MediaQuery.of(context).padding.bottom),
              ],
            ),
          ),
        );
      },
    );
  }

  List<Object> _buildItemList(CaptureProvider provider) {
    final list = <Object>[];
    int globalIdx = 0;
    for (var gIdx = 0; gIdx < provider.groups.length; gIdx++) {
      final group = provider.groups[gIdx];
      list.add(_GroupHeader(title: group.title, groupIndex: gIdx));
      for (var iIdx = 0; iIdx < group.items.length; iIdx++) {
        globalIdx++;
        list.add(_ItemData(
          item: group.items[iIdx],
          groupIndex: gIdx,
          indexInGroup: iIdx,
          globalIndex: globalIdx,
        ));
      }
    }
    return list;
  }
}

// flat list 데이터 타입
class _GroupHeader {
  final String title;
  final int groupIndex;
  const _GroupHeader({required this.title, required this.groupIndex});
}

class _ItemData {
  final TaskItem item;
  final int groupIndex;
  final int indexInGroup;
  final int globalIndex;
  const _ItemData({
    required this.item,
    required this.groupIndex,
    required this.indexInGroup,
    required this.globalIndex,
  });
}

// ── 모달 헤더 ─────────────────────────────────────────────
class _ModalHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      // HTML: padding: 20px 24px
      padding: const EdgeInsets.fromLTRB(24, 20, 16, 20),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          const Text(
            '촬영 업무 선택',
            style: TextStyle(
              fontFamily: _font,
              color: Color(0xFF0F172A),
              fontSize: 20,
              fontWeight: FontWeight.w700,
              height: 1.4,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: const SizedBox(
              width: 40,
              height: 40,
              child: Icon(Icons.close, size: 24, color: Color(0xFF64748B)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 그룹 섹션 헤더 ─────────────────────────────────────────
class _GroupSectionHeader extends StatelessWidget {
  final String title;
  final bool isFirst;
  final bool isActive;
  const _GroupSectionHeader({
    required this.title,
    this.isFirst = false,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      // HTML: padding: 20px 4px 12px, first-child padding-top:0
      // 피그마: font-size:16px, color:#0F172A (항상 동일 - active/inactive 구분 없음)
      padding: EdgeInsets.fromLTRB(4, isFirst ? 0 : 20, 4, 12),
      child: Text(
        title,
        style: const TextStyle(
          fontFamily: _font,
          color: Color(0xFF0F172A),
          fontSize: 16,
          fontWeight: FontWeight.w700,
          height: 1.5,
        ),
      ),
    );
  }
}

// ── 모달 푸터 ──────────────────────────────────────────────
class _ModalFooter extends StatelessWidget {
  final int totalCount;
  const _ModalFooter({required this.totalCount});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Text(
        '총 $totalCount개의 업무가 있습니다.',
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontFamily: _font,
          color: Color(0xFF94A3B8),
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.33,
        ),
      ),
    );
  }
}

// ── 도안 카드 ──────────────────────────────────────────────
class _TaskCard extends StatelessWidget {
  final TaskItem item;
  final int globalIndex;
  final bool isCurrent;
  final bool isDone;
  final VoidCallback onTap;

  const _TaskCard({
    required this.item,
    required this.globalIndex,
    required this.isCurrent,
    required this.isDone,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isCurrent && isDone) return _buildCurrentDone();
    if (isCurrent) return _buildCurrent();
    if (isDone) return _buildDone();
    return _buildPending();
  }

  // 현재 포커스 + 이미 촬영 완료 (재촬영 상태)
  // 포커스 테두리 유지, 뱃지만 "완료"로 표시
  Widget _buildCurrentDone() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        // HTML: border-radius:32px, padding:16px
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: AppTheme.blue, width: 1),
          boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 2, offset: const Offset(0, 1))],
        ),
        child: Row(
          children: [
            _CheckBadge(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(item.title,
                            style: const TextStyle(
                              fontFamily: _font,
                              color: AppTheme.blue,
                              // HTML: font-size:16px, weight:700
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              height: 1.4,
                            )),
                      ),
                      const SizedBox(width: 8),
                      _Badge(label: '완료', blue: true),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _MandatoryLabel(isMandatory: item.isMandatory, active: true, done: true),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _ArrowCircle(blue: true),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrent() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: AppTheme.blue, width: 1),
          boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 2, offset: const Offset(0, 1))],
        ),
        child: Row(
          children: [
            _IndexBadge(index: globalIndex, active: true),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(item.title,
                            style: const TextStyle(
                              fontFamily: _font,
                              color: AppTheme.blue,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              height: 1.4,
                            )),
                      ),
                      const SizedBox(width: 8),
                      _Badge(label: '진행중', blue: true),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _MandatoryLabel(isMandatory: item.isMandatory, active: true, done: false),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _ArrowCircle(blue: true),
          ],
        ),
      ),
    );
  }

  Widget _buildDone() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Row(
          children: [
            _CheckBadge(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(item.title,
                            style: const TextStyle(
                              fontFamily: _font,
                              color: Color(0xFF475569),
                              // HTML: font-size:16px, weight:500
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              height: 1.4,
                            )),
                      ),
                      const SizedBox(width: 8),
                      _Badge(label: '완료', blue: false),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _MandatoryLabel(isMandatory: item.isMandatory, active: false, done: true),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _ArrowCircle(blue: false),
          ],
        ),
      ),
    );
  }

  Widget _buildPending() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Row(
          children: [
            _IndexBadge(index: globalIndex, active: false),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(item.title,
                            style: const TextStyle(
                              fontFamily: _font,
                              color: Color(0xFF475569),
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              height: 1.4,
                            )),
                      ),
                      const SizedBox(width: 8),
                      _Badge(label: '대기', blue: false),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _MandatoryLabel(isMandatory: item.isMandatory, active: false, done: false),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _ArrowCircle(blue: false),
          ],
        ),
      ),
    );
  }
}

// ── 공통 서브 위젯 ──────────────────────────────────────────

class _IndexBadge extends StatelessWidget {
  final int index;
  final bool active;
  const _IndexBadge({required this.index, required this.active});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: active ? AppTheme.blue : const Color(0xFFF1F5F9),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text('$index',
            style: TextStyle(
              fontFamily: _font,
              color: active ? Colors.white : const Color(0xFF94A3B8),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            )),
      ),
    );
  }
}

class _CheckBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: AppTheme.blue.withAlpha(25),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.check, size: 16, color: AppTheme.blue),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final bool blue;
  const _Badge({required this.label, required this.blue});

  @override
  Widget build(BuildContext context) {
    // HTML: padding: 2px 8px, border-radius: 9999px (pill)
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: blue ? AppTheme.blue : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Text(label,
          style: TextStyle(
            fontFamily: _font,
            color: blue ? Colors.white : const Color(0xFF64748B),
            fontSize: 10,
            fontWeight: FontWeight.w700,
          )),
    );
  }
}

class _MandatoryLabel extends StatelessWidget {
  final bool isMandatory;
  final bool active; // isCurrent
  final bool done;  // isDone
  const _MandatoryLabel({required this.isMandatory, required this.active, required this.done});

  @override
  Widget build(BuildContext context) {
    // 피그마 기준:
    // 필수 활성(isCurrent): #3B82F6, weight:700
    // 필수 완료/대기: #3B82F6, weight:500
    // 선택: #64748B, weight:500
    return Text(
      isMandatory ? '필수' : '선택',
      style: TextStyle(
        fontFamily: _font,
        color: isMandatory ? AppTheme.blue : const Color(0xFF64748B),
        fontSize: 12,
        fontWeight: active && !done ? FontWeight.w700 : FontWeight.w500,
        height: 1.33,
      ),
    );
  }
}

class _ArrowCircle extends StatelessWidget {
  final bool blue;
  const _ArrowCircle({required this.blue});

  @override
  Widget build(BuildContext context) {
    // HTML: chevron 32×32
    return Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: blue ? Colors.white : const Color(0xFFF8FAFC),
        shape: BoxShape.circle,
        boxShadow: blue
            ? [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 2, offset: const Offset(0, 1))]
            : null,
      ),
      child: Icon(Icons.chevron_right,
          size: 20,
          color: blue ? AppTheme.blue : const Color(0xFF94A3B8)),
    );
  }
}
