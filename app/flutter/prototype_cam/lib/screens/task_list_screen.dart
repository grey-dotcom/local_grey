// =============================================================================
// [프로토타입 화면] 첫 화면 — 등록하기 (업무 도안 목록 + 보고사항)
//
// ▶ 이 파일은 현재 서비스 UX를 Web 브라우저에서 재현하기 위한 프로토타입입니다.
//   실제 앱 개발의 시작점은 "사진추가" 버튼 탭 → CaptureScreen 진입입니다.
//
// ▶ 개발자 인수인계 참고 사항:
//   - "사진추가" 셀 탭 → CaptureScreen.dart (사진 촬영 메인 플로우)
//   - "보고사항 등록" 버튼 → ReportScreen.dart
//   - 업무 데이터: assets/task_data.json (CaptureProvider가 로드)
//   - 앱 설정(지점명 등): assets/app_config.json
//   - 보고사항 상태: ReportProvider (메모리 한정, 영구 저장 없음)
// =============================================================================

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/capture_provider.dart';
import '../models/task_group.dart';
import 'report_screen.dart';
import '../widgets/task_card.dart';
import '../widgets/report_entry_card.dart';

// ── 디자인 토큰 ──────────────────────────────────────────
const _font         = 'S-Core Dream';
const _bgPage       = Color(0xFFE9EAEF);
const _tabActive    = Color(0xFF10A67B);
const _tabInactive  = Color(0xFF9F9F9F);
const _mandatory    = Color(0xFFDE321C);
const _btnFill      = Color(0xFF2751E0);
const _btnOutline   = Color(0xFF6280E8);
const _btnOutlineBg = Color(0xFFF3F6FF);
const _btnOutlineFg = Color(0xFF122979);

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
// 상단 헤더 — 지점명 + 탭
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
                    decoration: BoxDecoration(
                      color: const Color(0xFF6ED3B3).withAlpha(30),
                      shape: BoxShape.circle,
                    ),
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
// 하단 CTA 버튼 영역
// ══════════════════════════════════════════════════════════
class _BottomCta extends StatelessWidget {
  final CaptureProvider provider;
  const _BottomCta({required this.provider});

  @override
  Widget build(BuildContext context) {
    final isActive = provider.allMandatoryCaptured;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x0A000000), blurRadius: 4, offset: Offset(0, -4))],
      ),
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).padding.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text('*등록 완료 버튼 클릭 후 사진 업로드가 끝나면 수행이 자동 완료 처리됩니다.',
              style: TextStyle(fontFamily: _font, color: Color(0xFF9F9F9F), fontSize: 12, fontWeight: FontWeight.w200, height: 14 / 12)),
        ),
        Row(children: [
          Expanded(
            child: SizedBox(
              height: 40,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportScreen())),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: _btnOutline),
                  backgroundColor: _btnOutlineBg,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('보고사항 등록',
                    style: TextStyle(fontFamily: _font, color: _btnOutlineFg, fontSize: 14, fontWeight: FontWeight.w700, height: 22 / 14)),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 160, height: 40,
            child: FilledButton(
              onPressed: () => _onComplete(context, isActive),
              style: FilledButton.styleFrom(
                backgroundColor: isActive ? _btnFill : const Color(0xFFCCCCCC),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('등록 완료',
                  style: TextStyle(fontFamily: _font, color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700, height: 22 / 14)),
            ),
          ),
        ]),
      ]),
    );
  }

  void _onComplete(BuildContext context, bool isActive) {
    if (isActive) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('등록이 완료되었습니다.', style: TextStyle(fontFamily: _font)),
        backgroundColor: Color(0xFF22C55E), duration: Duration(seconds: 2),
      ));
    } else {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('필수 업무 도안 촬영을 완료해 주세요',
              style: TextStyle(fontFamily: _font, fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black)),
          content: const Text(
            '모든 필수 업무 도안(*표시) 촬영이 완료되어야\n등록 완료가 가능합니다.\n\n미촬영 필수 항목을 확인 후\n촬영을 완료해 주세요.',
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
}
