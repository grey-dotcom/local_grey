// =============================================================================
// [프로토타입 화면] 첫 화면 — 등록하기 (업무 도안 목록 + 보고사항)
//
// ▶ Phase 3 변경 내용:
//   - [보고사항 등록] 버튼 제거
//   - 하단 버튼 3단계 전환:
//       필수 미촬영        → [등록 완료] disabled
//       촬영완료+업로드중   → [수행완료] → [등록 완료 - 업로드중] disabled
//       촬영완료+업로드완료 → [수행완료] → 즉시 등록완료
//
// ▶ [디버깅] _BottomCta StatelessWidget → StatefulWidget 전환
//   기존: build() 내 addPostFrameCallback → 리빌드마다 콜백 중복 스케줄 위험
//   수정: _completeTriggered 플래그로 단 1회만 _doComplete 호출 보장
//
// ▶ [BE 연동 #4] 수행완료 API
//   실서버 연동 시 _doComplete 내 주석 해제 후 구현
// =============================================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../models/task_group.dart';
import '../widgets/task_card.dart';
import '../widgets/report_entry_card.dart';

const _font        = 'S-Core Dream';
const _bgPage      = Color(0xFFE9EAEF);
const _tabActive   = Color(0xFF10A67B);
const _tabInactive = Color(0xFF9F9F9F);
const _mandatory   = Color(0xFFDE321C);
const _btnFill     = Color(0xFF2751E0);

// ══════════════════════════════════════════════════════════
// 최상위 화면
// ══════════════════════════════════════════════════════════
class TaskListScreen extends StatelessWidget {
  const TaskListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<CaptureProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Scaffold(
            backgroundColor: Colors.white,
            body: Center(child: CircularProgressIndicator(color: _btnFill)),
          );
        }
        return Scaffold(
          backgroundColor: _bgPage,
          body: SafeArea(
            bottom: false,
            child: Column(children: [
              _TopHeader(),
              Expanded(child: _BodyScroll(provider: provider)),
              _BottomCta(provider: provider),
            ]),
          ),
        );
      },
    );
  }
}

// ══════════════════════════════════════════════════════════
// 상단 헤더
// ══════════════════════════════════════════════════════════
class _TopHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final title = context.watch<CaptureProvider>().appConfig?.displayTitle ?? '';
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, 4))],
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Row(children: [
            const SizedBox(width: 24),
            Expanded(
              child: Text(title,
                textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600, height: 24 / 16),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.notifications_none_outlined, size: 24, color: Colors.black),
          ]),
        ),
        Row(children: [
          _TabChip(label: '등록하기', isActive: true),
          const SizedBox(width: 8),
          _TabChip(label: '일정 및 티켓정보', isActive: false),
        ]),
      ]),
    );
  }
}

class _TabChip extends StatelessWidget {
  final String label;
  final bool isActive;
  const _TabChip({required this.label, required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Text(label, style: TextStyle(
            fontFamily: _font,
            color: isActive ? _tabActive : _tabInactive,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w200,
            height: 22 / 14,
          )),
        ),
        Container(height: 2, color: isActive ? _tabActive : Colors.transparent),
      ]),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 본문 스크롤
// ══════════════════════════════════════════════════════════
class _BodyScroll extends StatelessWidget {
  final CaptureProvider provider;
  const _BodyScroll({required this.provider});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        Container(
          color: Colors.white,
          child: Column(children: [_GuideBanner(), _PasswordRow()]),
        ),
        ...provider.groups.asMap().entries.map(
          (e) => _GroupSection(group: e.value, groupIdx: e.key, provider: provider),
        ),
        const ReportEntriesSection(),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════
// 안내 배너
// ══════════════════════════════════════════════════════════
class _GuideBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          height: 90,
          padding: const EdgeInsets.only(left: 16, right: 12, top: 10, bottom: 10),
          decoration: BoxDecoration(color: const Color(0xFFF4F4F4), borderRadius: BorderRadius.circular(16)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                const Text('흔들린 사진 주의+가이드 확인 안내!',
                    style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 13, fontWeight: FontWeight.w700, height: 1.4)),
                const SizedBox(height: 4),
                Text.rich(
                  const TextSpan(
                    style: TextStyle(fontFamily: _font, fontSize: 10, fontWeight: FontWeight.w200, height: 1.4),
                    children: [
                      TextSpan(text: '흔들린 사진 등록 불가! ', style: TextStyle(color: Color(0xFF747474))),
                      TextSpan(text: '수행 전 가이드를 확인하고, 완료 후 수행 등록을 해주세요.',
                          style: TextStyle(color: _mandatory, decoration: TextDecoration.underline, decorationColor: _mandatory)),
                    ],
                  ),
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                ),
              ]),
            ),
            const SizedBox(width: 8),
            SizedBox(
              width: 52,
              child: Center(
                child: Stack(alignment: Alignment.center, children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: const Color(0xFF6ED3B3).withAlpha(30), shape: BoxShape.circle),
                  ),
                  const Icon(Icons.vibration, size: 28, color: Color(0xFF6ED3B3)),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 객실 비밀번호 행
// ══════════════════════════════════════════════════════════
class _PasswordRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final code = context.watch<CaptureProvider>().appConfig?.accessCode ?? '------';
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFFEEEEEE)))),
      child: Row(children: [
        const Icon(Icons.vpn_key_rounded, size: 18, color: Color(0xFFFFBB00)),
        const SizedBox(width: 8),
        const Text('객실 비밀번호',
            style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 14, fontWeight: FontWeight.w700, height: 22 / 14)),
        const Spacer(),
        Text(code, style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 14, fontWeight: FontWeight.w700, height: 22 / 14)),
      ]),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 업무 그룹 섹션
// ══════════════════════════════════════════════════════════
class _GroupSection extends StatelessWidget {
  final TaskGroup group;
  final int groupIdx;
  final CaptureProvider provider;
  const _GroupSection({required this.group, required this.groupIdx, required this.provider});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(group.title,
            style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w700, height: 24 / 16)),
        const SizedBox(height: 12),
        ...group.items.asMap().entries.map((e) => Padding(
          padding: EdgeInsets.only(bottom: e.key < group.items.length - 1 ? 8 : 0),
          child: TaskCard(item: e.value, groupIdx: groupIdx, itemIdx: e.key, provider: provider),
        )),
      ]),
    );
  }
}

// ══════════════════════════════════════════════════════════
// 하단 CTA — StatefulWidget
//
// [디버깅 수정] StatelessWidget → StatefulWidget 전환
//   _completeTriggered 플래그로 자동 등록완료가 단 1회만 호출되도록 보장.
//   기존 StatelessWidget에서는 build() 내 addPostFrameCallback이
//   provider 상태 변경마다 반복 스케줄될 수 있는 무한루프 위험이 있었음.
// ══════════════════════════════════════════════════════════
class _BottomCta extends StatefulWidget {
  final CaptureProvider provider;
  const _BottomCta({required this.provider});

  @override
  State<_BottomCta> createState() => _BottomCtaState();
}

class _BottomCtaState extends State<_BottomCta> {
  // 자동 등록완료 처리 중복 방지 플래그
  bool _completeTriggered = false;

  @override
  Widget build(BuildContext context) {
    final provider    = widget.provider;
    final allCaptured = provider.allMandatoryCaptured;
    final isUploading = provider.hasMandatoryUploading;
    final hasError    = provider.hasMandatoryError;
    final allUploaded = provider.allMandatoryUploadSuccess;
    final requested   = provider.completeRequested;

    // [BE 연동 #4] completeRequested=true + 업로드 완료 → 자동 등록완료 (1회 보장)
    if (requested && allUploaded && !_completeTriggered) {
      _completeTriggered = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _doComplete(context);
      });
    }
    // 상태가 초기화되면 플래그도 초기화
    if (!requested) _completeTriggered = false;

    // 상태 ①: 필수 미촬영
    if (!allCaptured) {
      return _buildCta(
        context,
        guideText: '*모든 필수 업무 도안(*표시) 촬영 후 수행완료가 가능합니다.',
        btnText: '등록 완료',
        btnColor: const Color(0xFFCCCCCC),
        enabled: false,
        onTap: () => _showNotReadyDialog(context),
      );
    }

    // 상태 ②: 수행완료 요청됨 + 업로드 진행 중
    if (requested && (isUploading || hasError)) {
      return _buildCta(
        context,
        guideText: '사진 업로드가 완료되면 자동으로 수행완료 처리됩니다.',
        btnText: '등록 완료 - 업로드중',
        btnColor: const Color(0xFFCCCCCC),
        enabled: false,
        onTap: null,
        showUploadIndicator: true,
      );
    }

    // 상태 ③: 수행완료 가능
    return _buildCta(
      context,
      guideText: '*수행완료 선택 시 사진 업로드가 끝나면 자동 완료 처리됩니다.',
      btnText: '수행완료',
      btnColor: _btnFill,
      enabled: true,
      onTap: () => _onPerformComplete(context),
    );
  }

  Widget _buildCta(
    BuildContext context, {
    required String guideText,
    required String btnText,
    required Color btnColor,
    required bool enabled,
    required VoidCallback? onTap,
    bool showUploadIndicator = false,
  }) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, -4))],
      ),
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).padding.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(children: [
            if (showUploadIndicator) ...[
              const SizedBox(
                width: 10, height: 10,
                child: CircularProgressIndicator(color: Color(0xFF94A3B8), strokeWidth: 1.5),
              ),
              const SizedBox(width: 6),
            ],
            Expanded(
              child: Text(guideText,
                  style: const TextStyle(fontFamily: _font, color: Color(0xFF9F9F9F), fontSize: 12, fontWeight: FontWeight.w200, height: 14 / 12)),
            ),
          ]),
        ),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: enabled ? onTap : null,
            style: FilledButton.styleFrom(
              backgroundColor: btnColor,
              disabledBackgroundColor: const Color(0xFFCCCCCC),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(btnText,
                style: const TextStyle(fontFamily: _font, color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700, height: 22 / 15)),
          ),
        ),
      ]),
    );
  }

  void _onPerformComplete(BuildContext context) {
    if (widget.provider.allMandatoryUploadSuccess) {
      _doComplete(context);
    } else {
      widget.provider.setCompleteRequested(true);
      // [BE 연동 #4] 업로드 완료 시 build()에서 자동 감지 → _doComplete 호출
    }
  }

  void _doComplete(BuildContext context) {
    if (widget.provider.completeRequested) {
      widget.provider.setCompleteRequested(false);
    }
    // [BE 연동 #4] POST /api/v1/tasks/{taskId}/complete 호출 지점
    // await _api.completeTask(taskId: widget.provider.appConfig?.taskId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('수행이 완료되었습니다.', style: TextStyle(fontFamily: _font)),
      backgroundColor: Color(0xFF22C55E),
      duration: Duration(seconds: 2),
    ));
  }

  void _showNotReadyDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('필수 업무 도안 촬영을 완료해 주세요',
            style: TextStyle(fontFamily: _font, fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black)),
        content: const Text(
          '모든 필수 업무 도안(*표시) 촬영이 완료되어야\n수행완료가 가능합니다.\n\n미촬영 필수 항목을 확인 후\n촬영을 완료해 주세요.',
          style: TextStyle(fontFamily: _font, fontSize: 14, color: Color(0xFF555555), height: 1.6),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => Navigator.pop(ctx),
              style: FilledButton.styleFrom(
                backgroundColor: _btnFill,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('확인',
                  style: TextStyle(fontFamily: _font, fontWeight: FontWeight.w700, fontSize: 15, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}
