import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../models/task_item.dart';
import '../utils/app_theme.dart';

const _font = 'Spoqa Han Sans Neo';

// =============================================================================
// TaskListModal — 촬영 업무 선택 모달
//
// ── Phase 2: 상태값 5종 정의 반영 ──────────────────────────────────────────
//
// 상태값 정의 (정책 기준):
//   완료      : 사진 촬영 후 서버 업로드까지 완료된 경우 (UploadStatus.success)
//   진행중    : 현재 포커스된 도안이 첫 촬영인 경우 (isCurrent && !isCaptured)
//   대기      : 촬영이 이루어지지 않은 업무 도안 (!isCurrent && !isCaptured)
//   업로드중  : 촬영/재촬영 완료 후 큐에서 업로드 중인 도안 (uploading | queued)
//   에러      : 업로드 실패 — "재시도"로 표기 (UploadStatus.error)
//
// ── 리프레시 정책 (FE 충돌 2 해결) ────────────────────────────────────────
//   업로드가 BE에서 완료되더라도 사용자가 별도 액션(리프레시)을 취하지 않는 한
//   앱 내 상태값은 이전 상태를 유지. 실시간 상태 동기화 없음.
//   → isCurrent 기준 유지, 상태 변경은 _captures Map 업데이트 시점에만 반영.
//
// ── [버그 수정 #2] 업로드중 도안 탭 정책 확인 ─────────────────────────────
//   업로드중(_CardState.uploading) 도안을 탭하면 onTap → jumpToItem → 모달 닫힘
//   → CaptureScreen 진입 시 isRecaptureMode=true(재촬영 모드)로 표시됨.
//   정책: 업로드중에도 재촬영 진입 허용. 동작 변경 없음, 의도된 흐름.
//
// ── FE/BE 논의 필요 항목 (충돌 1, 3, 4) ───────────────────────────────────
//   [FE/BE 논의 #1] 완료 판단 기준
//     현재: UploadStatus.success (모달 내부)
//     allMandatoryCaptured는 아직 촬영 여부 기준 유지 (연쇄 영향 검토 후 변경)
//   [FE/BE 논의 #3] 수행완료 버튼 활성화 조건
//     에러 상태 도안 존재 시 수행완료 허용 여부 → BE 팀과 협의 필요
//   [FE/BE 논의 #4] app-BE 상태 동기화 방식
//     폴링 / 웹소켓 / 업로드 응답 포함 중 결정 필요
//
// =============================================================================

/// 촬영 업무 선택 모달
class TaskListModal extends StatefulWidget {
  const TaskListModal({super.key});

  @override
  State<TaskListModal> createState() => _TaskListModalState();
}

class _TaskListModalState extends State<TaskListModal> {
  final ScrollController _scrollController = ScrollController();

  static const double _groupHeaderFirstH = 12.0 + 24.0;
  static const double _groupHeaderH      = 20.0 + 24.0 + 12.0;
  static const double _cardH             = 88.0;
  static const double _cardGap           = 12.0;
  static const double _listPaddingTop    = 24.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToCurrent());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrent() {
    final provider = context.read<CaptureProvider>();
    final items = _buildItemList(provider);

    int targetIndex = -1;
    for (int i = 0; i < items.length; i++) {
      final entry = items[i];
      if (entry is _ItemData &&
          entry.groupIndex == provider.groupIndex &&
          entry.indexInGroup == provider.itemIndex) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex < 0) return;

    double offset = _listPaddingTop;
    for (int i = 0; i < targetIndex; i++) {
      if (items[i] is _GroupHeader) {
        offset += (i == 0) ? _groupHeaderFirstH : _groupHeaderH;
      } else {
        offset += _cardH + _cardGap;
      }
    }

    final viewportH = _scrollController.position.viewportDimension;
    final targetOffset = offset - (viewportH / 2) + (_cardH / 2);

    _scrollController.jumpTo(
      targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        final screenSize = MediaQuery.of(context).size;
        final modalH = screenSize.height * 0.92;
        final totalCount = provider.groups.fold(0, (sum, g) => sum + g.items.length);
        final items = _buildItemList(provider);

        return Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            width: double.infinity,
            height: modalH,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [
                BoxShadow(color: Color(0x1F000000), blurRadius: 32, offset: Offset(0, -4)),
              ],
            ),
            child: Column(
              children: [
                _ModalHeader(),
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
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
                      final capture = provider.captureOf(data.item.id);
                      final isCurrent = data.groupIndex == provider.groupIndex &&
                          data.indexInGroup == provider.itemIndex;

                      // ── Phase 2: 상태 판단 ────────────────────────────────
                      // [리프레시 정책] 상태는 _captures Map 기준. BE 완료 여부와 무관하게
                      // 사용자 액션(리프레시) 전까지 현재 상태 유지.
                      final _CardState cardState = _resolveCardState(
                        isCurrent: isCurrent,
                        capture: capture,
                      );

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _TaskCard(
                          item: data.item,
                          globalIndex: data.globalIndex,
                          cardState: cardState,
                          capture: capture,
                          // [버그 수정 #2] 업로드중 도안 탭 → 재촬영 진입 허용 (의도된 동작)
                          onTap: () {
                            provider.jumpToItem(data.groupIndex, data.indexInGroup);
                            Navigator.pop(context);
                          },
                          onRetry: cardState == _CardState.error
                              ? () {
                                  provider.retryUpload(data.item.id);
                                  Navigator.pop(context);
                                }
                              : null,
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

  // ── 상태 판단 로직 ──────────────────────────────────────────────────────────
  // 정책 5종을 우선순위 순으로 판단.
  // 우선순위: error > uploading/queued > success(완료) > 진행중 > 대기
  _CardState _resolveCardState({
    required bool isCurrent,
    required CaptureResult? capture,
  }) {
    if (capture == null) {
      return isCurrent ? _CardState.inProgress : _CardState.pending;
    }
    switch (capture.status) {
      case UploadStatus.error:
        return _CardState.error;
      case UploadStatus.uploading:
      case UploadStatus.queued:
        // [버그 수정 #1 연계] queued와 uploading 모두 uploading 카드로 표시
        return _CardState.uploading;
      case UploadStatus.success:
        // [리프레시 정책] BE 완료 = 앱 내 success 상태. isCurrent 여부와 무관하게 완료.
        return _CardState.done;
      case UploadStatus.idle:
        return isCurrent ? _CardState.inProgress : _CardState.pending;
    }
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

// ── 상태 enum ─────────────────────────────────────────────────────────────────
enum _CardState {
  done,       // 완료: 업로드 success
  inProgress, // 진행중: 현재 포커스 + 미촬영
  pending,    // 대기: 미촬영 + 비포커스
  uploading,  // 업로드중: 촬영 후 큐 전송 중 (uploading | queued)
  error,      // 에러: 업로드 실패 → "재시도"
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

// ── 모달 헤더 ─────────────────────────────────────────────────────────────────
class _ModalHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 16, 20),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          const Text('촬영 업무 선택',
              style: TextStyle(
                fontFamily: _font, color: Color(0xFF0F172A),
                fontSize: 20, fontWeight: FontWeight.w700, height: 1.4,
              )),
          const Spacer(),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: const SizedBox(width: 40, height: 40,
                child: Icon(Icons.close, size: 24, color: Color(0xFF64748B))),
          ),
        ],
      ),
    );
  }
}

// ── 그룹 섹션 헤더 ────────────────────────────────────────────────────────────
class _GroupSectionHeader extends StatelessWidget {
  final String title;
  final bool isFirst;
  final bool isActive;
  const _GroupSectionHeader({required this.title, this.isFirst = false, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(4, isFirst ? 0 : 20, 4, 12),
      child: Text(title,
          style: const TextStyle(
            fontFamily: _font, color: Color(0xFF0F172A),
            fontSize: 16, fontWeight: FontWeight.w700, height: 1.5,
          )),
    );
  }
}

// ── 모달 푸터 ─────────────────────────────────────────────────────────────────
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
      child: Text('총 $totalCount개의 업무가 있습니다.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontFamily: _font, color: Color(0xFF94A3B8),
            fontSize: 12, fontWeight: FontWeight.w400, height: 1.33,
          )),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 도안 카드 — Phase 2: 5종 상태 분기
// ══════════════════════════════════════════════════════════════════════════════
class _TaskCard extends StatelessWidget {
  final TaskItem item;
  final int globalIndex;
  final _CardState cardState;
  final CaptureResult? capture;
  final VoidCallback onTap;
  final VoidCallback? onRetry;

  const _TaskCard({
    required this.item,
    required this.globalIndex,
    required this.cardState,
    required this.capture,
    required this.onTap,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    switch (cardState) {
      case _CardState.done:       return _buildDone();
      case _CardState.inProgress: return _buildInProgress();
      case _CardState.pending:    return _buildPending();
      case _CardState.uploading:  return _buildUploading();
      case _CardState.error:      return _buildError();
    }
  }

  Widget _card({
    required Color bgColor,
    required Color borderColor,
    required Widget leading,
    required Widget title,
    required Widget badge,
    required Widget trailing,
    required bool hasShadow,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap ?? this.onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: borderColor),
          boxShadow: hasShadow
              ? [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 2, offset: const Offset(0, 1))]
              : null,
        ),
        child: Row(children: [
          leading,
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(child: title),
                const SizedBox(width: 8),
                badge,
              ]),
              const SizedBox(height: 4),
              _MandatoryLabel(isMandatory: item.isMandatory, cardState: cardState),
            ]),
          ),
          const SizedBox(width: 8),
          trailing,
        ]),
      ),
    );
  }

  Widget _buildDone() => _card(
    bgColor: Colors.white, borderColor: const Color(0xFFF1F5F9),
    leading: _CheckBadge(),
    title: Text(item.title, style: const TextStyle(fontFamily: _font, color: Color(0xFF475569), fontSize: 16, fontWeight: FontWeight.w500, height: 1.4)),
    badge: _StatusBadge.done(), trailing: _ArrowCircle(blue: false), hasShadow: false,
  );

  Widget _buildInProgress() => _card(
    bgColor: const Color(0xFFEFF6FF), borderColor: AppTheme.blue,
    leading: _IndexBadge(index: globalIndex, active: true),
    title: Text(item.title, style: const TextStyle(fontFamily: _font, color: AppTheme.blue, fontSize: 16, fontWeight: FontWeight.w700, height: 1.4)),
    badge: _StatusBadge.inProgress(), trailing: _ArrowCircle(blue: true), hasShadow: true,
  );

  Widget _buildPending() => _card(
    bgColor: Colors.white, borderColor: const Color(0xFFF1F5F9),
    leading: _IndexBadge(index: globalIndex, active: false),
    title: Text(item.title, style: const TextStyle(fontFamily: _font, color: Color(0xFF475569), fontSize: 16, fontWeight: FontWeight.w500, height: 1.4)),
    badge: _StatusBadge.pending(), trailing: _ArrowCircle(blue: false), hasShadow: false,
  );

  // [버그 수정 #2] 업로드중 탭 → 재촬영 진입 허용. onTap은 jumpToItem → 모달 닫힘 → CaptureScreen
  Widget _buildUploading() => _card(
    bgColor: const Color(0xFFF8FAFC), borderColor: const Color(0xFFBFDBFE),
    leading: _UploadingBadge(),
    title: Text(item.title, style: const TextStyle(fontFamily: _font, color: Color(0xFF334155), fontSize: 16, fontWeight: FontWeight.w500, height: 1.4)),
    badge: _StatusBadge.uploading(), trailing: _ArrowCircle(blue: false), hasShadow: false,
  );

  Widget _buildError() {
    final isRetryable = capture?.isRetryable ?? true;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF1F2),
          borderRadius: BorderRadius.circular(32),
          border: Border.all(color: const Color(0xFFFCA5A5)),
        ),
        child: Row(children: [
          _ErrorBadge(),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(child: Text(item.title,
                    style: const TextStyle(fontFamily: _font, color: Color(0xFF991B1B), fontSize: 16, fontWeight: FontWeight.w500, height: 1.4))),
                const SizedBox(width: 8),
                _StatusBadge.error(),
              ]),
              const SizedBox(height: 4),
              _MandatoryLabel(isMandatory: item.isMandatory, cardState: cardState),
            ]),
          ),
          const SizedBox(width: 8),
          if (isRetryable && onRetry != null)
            _RetryButton(onTap: onRetry!)
          else
            _ArrowCircle(blue: false),
        ]),
      ),
    );
  }
}

// ── 공통 서브 위젯 ────────────────────────────────────────────────────────────

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
      child: Center(child: Text('$index',
          style: TextStyle(fontFamily: _font, color: active ? Colors.white : const Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w700))),
    );
  }
}

class _CheckBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 32, height: 32,
    decoration: BoxDecoration(color: AppTheme.blue.withAlpha(25), shape: BoxShape.circle),
    child: const Icon(Icons.check, size: 16, color: AppTheme.blue),
  );
}

class _UploadingBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 32, height: 32,
    decoration: BoxDecoration(color: const Color(0xFFEFF6FF), shape: BoxShape.circle),
    child: const Padding(
      padding: EdgeInsets.all(8),
      child: CircularProgressIndicator(color: AppTheme.blue, strokeWidth: 2),
    ),
  );
}

class _ErrorBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 32, height: 32,
    decoration: const BoxDecoration(color: Color(0xFFFEE2E2), shape: BoxShape.circle),
    child: const Icon(Icons.error_outline_rounded, size: 18, color: Color(0xFFEF4444)),
  );
}

class _RetryButton extends StatelessWidget {
  final VoidCallback onTap;
  const _RetryButton({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: const Color(0xFFEF4444), borderRadius: BorderRadius.circular(20)),
        child: const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.refresh_rounded, size: 12, color: Colors.white),
          SizedBox(width: 3),
          Text('재시도', style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
        ]),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color bgColor;
  final Color textColor;
  const _StatusBadge({required this.label, required this.bgColor, required this.textColor});

  factory _StatusBadge.done()       => const _StatusBadge(label: '완료',    bgColor: Color(0xFFF1F5F9), textColor: Color(0xFF64748B));
  factory _StatusBadge.inProgress() => const _StatusBadge(label: '진행중',  bgColor: AppTheme.blue,     textColor: Colors.white);
  factory _StatusBadge.pending()    => const _StatusBadge(label: '대기',    bgColor: Color(0xFFF1F5F9), textColor: Color(0xFF64748B));
  factory _StatusBadge.uploading()  => const _StatusBadge(label: '업로드중', bgColor: Color(0xFFBFDBFE), textColor: Color(0xFF1D4ED8));
  factory _StatusBadge.error()      => const _StatusBadge(label: '재시도',  bgColor: Color(0xFFFEE2E2), textColor: Color(0xFFEF4444));

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(9999)),
      child: Text(label, style: TextStyle(fontFamily: _font, color: textColor, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}

class _MandatoryLabel extends StatelessWidget {
  final bool isMandatory;
  final _CardState cardState;
  const _MandatoryLabel({required this.isMandatory, required this.cardState});
  @override
  Widget build(BuildContext context) {
    final isActive = cardState == _CardState.inProgress;
    final isError  = cardState == _CardState.error;
    final color = isError ? const Color(0xFFEF4444) : isMandatory ? AppTheme.blue : const Color(0xFF64748B);
    return Text(
      isMandatory ? '필수' : '선택',
      style: TextStyle(fontFamily: _font, color: color, fontSize: 12,
          fontWeight: isActive ? FontWeight.w700 : FontWeight.w500, height: 1.33),
    );
  }
}

class _ArrowCircle extends StatelessWidget {
  final bool blue;
  const _ArrowCircle({required this.blue});
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32, height: 32,
      decoration: BoxDecoration(
        color: blue ? Colors.white : const Color(0xFFF8FAFC),
        shape: BoxShape.circle,
        boxShadow: blue ? [BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 2, offset: const Offset(0, 1))] : null,
      ),
      child: Icon(Icons.chevron_right, size: 20, color: blue ? AppTheme.blue : const Color(0xFF94A3B8)),
    );
  }
}
