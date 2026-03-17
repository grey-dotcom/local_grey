// =============================================================================
// [프로토타입 화면] 보고사항 등록 / 수정
//
// ▶ 이 파일은 현재 서비스 UX를 Web 브라우저에서 재현하기 위한 프로토타입입니다.
//   실제 앱 개발 범위(사진 촬영 플로우)와는 별개로 동작합니다.
//
// ▶ 개발자 인수인계 참고 사항:
//   - 이 화면은 TaskListScreen 하단 "보고사항 등록" 버튼에서 진입합니다.
//   - 데이터는 ReportProvider(ChangeNotifier)로 관리되며,
//     앱 생명주기 동안 메모리에만 유지됩니다(영구 저장 없음).
//   - 사진은 Web dart:html FileUploadInputElement로 선택하며,
//     base64 data URL 형태로 메모리에 보관합니다.
//   - 실서비스에서는 Multipart 업로드로 교체 필요 (api_service.dart 참고).
// =============================================================================

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/report_data.dart';
import '../models/report_entry.dart';
import '../providers/report_provider.dart';
import '../services/image_picker_web.dart';

const _font        = 'S-Core Dream';
const _btnFill     = Color(0xFF2751E0);
const _btnInactive = Color(0xFFCCCCCC);
const _mandatory   = Color(0xFFDE321C);
const _dividerDash = Color(0xFFD0D0D0);

/// 보고사항 등록 / 수정 화면
/// [editEntry] null → 신규 등록 모드 / 값 있음 → 수정 모드
class ReportScreen extends StatefulWidget {
  final ReportEntry? editEntry;
  const ReportScreen({super.key, this.editEntry});

  bool get isEditMode => editEntry != null;

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  List<ReportCategory> _categories = [];
  List<ReportType>     _reportTypes = [];
  bool _isLoading = true;

  ReportCategory? _selectedCategory;
  ReportType?     _selectedType;
  List<String>    _photoDataUrls = [];
  final TextEditingController _textCtrl = TextEditingController();

  bool _categoryOpen = false;
  bool _typeOpen     = false;

  // ── 완료 조건 ──────────────────────────────────────────
  // 카테고리 + 유형 + 텍스트 1자 이상 → 등록 버튼 active
  bool get _isComplete =>
      _selectedCategory != null &&
      _selectedType != null &&
      _textCtrl.text.isNotEmpty;

  // 뒤로가기 경고 조건: 하나라도 입력이 있으면 경고
  bool get _isDirty {
    if (!widget.isEditMode) {
      return _selectedCategory != null ||
          _selectedType != null ||
          _photoDataUrls.isNotEmpty ||
          _textCtrl.text.isNotEmpty;
    }
    final e = widget.editEntry!;
    return _selectedCategory?.id != e.categoryId ||
        _selectedType?.id != e.typeId ||
        _textCtrl.text != e.text ||
        _photoDataUrls.length != e.photoDataUrls.length;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
    // 등록 버튼 active/inactive 갱신용 — charCount는 _CategorySection 내부에서 처리
    _textCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  // ── 데이터 로드 ─────────────────────────────────────────
  Future<void> _loadData() async {
    final raw  = await rootBundle.loadString('assets/report_data.json');
    final json = jsonDecode(raw) as Map<String, dynamic>;
    setState(() {
      _categories  = (json['categories']   as List).map((e) => ReportCategory.fromJson(e as Map<String, dynamic>)).toList();
      _reportTypes = (json['reportTypes']  as List).map((e) => ReportType.fromJson(e as Map<String, dynamic>)).toList();
      _isLoading   = false;
    });
    if (widget.isEditMode) {
      final e = widget.editEntry!;
      _selectedCategory = _categories.firstWhere((c) => c.id == e.categoryId, orElse: () => _categories.first);
      _selectedType     = _reportTypes.firstWhere((t) => t.id == e.typeId, orElse: () => _reportTypes.first);
      _photoDataUrls    = List<String>.from(e.photoDataUrls);
      _textCtrl.text    = e.text;
      setState(() {});
    }
  }

  // ── 사진 추가 ───────────────────────────────────────────
  Future<void> _pickPhoto() async {
    if (_photoDataUrls.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('사진은 최대 5장까지 등록 가능합니다.', style: TextStyle(fontFamily: _font)),
        duration: Duration(seconds: 2),
      ));
      return;
    }
    try {
      final dataUrl = await pickImageWeb();
      if (dataUrl != null) setState(() => _photoDataUrls.add(dataUrl));
    } catch (e) {
      debugPrint('photo pick error: $e');
    }
  }

  // ── 뒤로가기 경고 팝업 ─────────────────────────────────
  Future<bool> _onWillPop() async {
    if (!_isDirty) return true;
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('작성 중인 내용이 있습니다',
            style: TextStyle(fontFamily: _font, fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black)),
        content: const Text('입력한 내용이 저장되지 않습니다.\n정말 나가시겠습니까?',
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
              backgroundColor: _mandatory,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('나가기', style: TextStyle(fontFamily: _font, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  // ── 등록 / 수정 저장 ────────────────────────────────────
  void _submit() {
    if (!_isComplete) return;
    final provider = context.read<ReportProvider>();
    if (widget.isEditMode) {
      provider.update(widget.editEntry!.copyWith(
        categoryId:    _selectedCategory!.id,
        categoryLabel: _selectedCategory!.label,
        typeId:        _selectedType!.id,
        typeLabel:     _selectedType!.label,
        photoDataUrls: List<String>.from(_photoDataUrls),
        text:          _textCtrl.text,
      ));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('보고사항이 수정되었습니다.', style: TextStyle(fontFamily: _font)),
        backgroundColor: Color(0xFF22C55E), duration: Duration(seconds: 2),
      ));
    } else {
      provider.add(ReportEntry(
        id:            DateTime.now().millisecondsSinceEpoch.toString(),
        categoryId:    _selectedCategory!.id,
        categoryLabel: _selectedCategory!.label,
        typeId:        _selectedType!.id,
        typeLabel:     _selectedType!.label,
        photoDataUrls: List<String>.from(_photoDataUrls),
        text:          _textCtrl.text,
        createdAt:     DateTime.now(),
      ));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('보고사항이 등록되었습니다.', style: TextStyle(fontFamily: _font)),
        backgroundColor: Color(0xFF22C55E), duration: Duration(seconds: 2),
      ));
    }
    Navigator.pop(context);
  }

  // ── 빌드 ────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: _buildAppBar(),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: _btnFill))
            : Column(children: [
                Expanded(child: _buildBody()),
                _buildSubmitButton(),
              ]),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.black),
        onPressed: () async {
          if (await _onWillPop()) { if (mounted) Navigator.pop(context); }
        },
      ),
      title: Text(
        widget.isEditMode ? '보고사항 수정' : '보고사항 등록',
        style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600),
      ),
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(height: 1, color: Color(0xFFEEEEEE)),
      ),
    );
  }

  Widget _buildBody() {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        children: [
          // ① 카테고리 드롭다운
          const _SectionTitle(text: '카테고리를 선택해 주세요'),
          const SizedBox(height: 12),
          _DropdownTile(
            label: _selectedCategory?.label ?? '카테고리 선택',
            isPlaceholder: _selectedCategory == null,
            isOpen: _categoryOpen,
            onTap: () => setState(() {
              _categoryOpen = !_categoryOpen;
              if (_categoryOpen) _typeOpen = false;
            }),
          ),
          if (_categoryOpen) ...[
            const SizedBox(height: 4),
            _DropdownMenu(
              items: _categories.map((c) => c.label).toList(),
              onSelect: (idx) => setState(() {
                _selectedCategory = _categories[idx];
                _categoryOpen     = false;
                _selectedType     = null;
                _typeOpen         = false;
              }),
            ),
          ],
          const SizedBox(height: 16),
          const _DashedDivider(),
          const SizedBox(height: 16),

          // ② 카테고리 선택 후 상세 섹션
          if (_selectedCategory != null)
            _CategorySection(
              categoryLabel:  _selectedCategory!.label,
              selectedType:   _selectedType,
              reportTypes:    _reportTypes,
              typeOpen:       _typeOpen,
              onTypeTap:      () => setState(() => _typeOpen = !_typeOpen),
              onTypeSelect:   (idx) => setState(() {
                _selectedType = _reportTypes[idx];
                _typeOpen     = false;
              }),
              photos:         _photoDataUrls,
              onAddPhoto:     _pickPhoto,
              onRemovePhoto:  (idx) => setState(() => _photoDataUrls.removeAt(idx)),
              textCtrl:       _textCtrl,
            )
          else
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Text(
                  '카테고리를 선택하면\n상세 항목이 표시됩니다.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontFamily: _font, color: Color(0xFFBBBBBB), fontSize: 13, height: 1.6),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFEEEEEE))),
      ),
      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: FilledButton(
          onPressed: _isComplete ? _submit : null,
          style: FilledButton.styleFrom(
            backgroundColor: _isComplete ? _btnFill : _btnInactive,
            disabledBackgroundColor: _btnInactive,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          ),
          child: Text(
            widget.isEditMode ? '수정 완료' : '등록',
            style: const TextStyle(fontFamily: _font, color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// 공통 위젯
// ═══════════════════════════════════════════════════════════

// ── 섹션 타이틀 ─────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle({required this.text});
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w700, height: 24 / 16),
  );
}

// ── 드롭다운 타이틀 버튼 ─────────────────────────────────
class _DropdownTile extends StatelessWidget {
  final String label;
  final bool isPlaceholder, isOpen;
  final VoidCallback onTap;
  const _DropdownTile({required this.label, required this.isPlaceholder, required this.isOpen, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isOpen ? const Color(0xFF2751E0) : const Color(0xFFDDDDDD)),
        ),
        child: Row(children: [
          Expanded(
            child: Text(label, style: TextStyle(
              fontFamily: _font,
              color: isPlaceholder ? const Color(0xFFBBBBBB) : Colors.black,
              fontSize: 14, fontWeight: FontWeight.w400,
            )),
          ),
          AnimatedRotation(
            turns: isOpen ? 0.5 : 0,
            duration: const Duration(milliseconds: 200),
            child: const Icon(Icons.keyboard_arrow_down_rounded, size: 22, color: Color(0xFF888888)),
          ),
        ]),
      ),
    );
  }
}

// ── 드롭다운 메뉴 ────────────────────────────────────────
class _DropdownMenu extends StatelessWidget {
  final List<String> items;
  final ValueChanged<int> onSelect;
  const _DropdownMenu({required this.items, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDDDDDD)),
        boxShadow: const [BoxShadow(color: Color(0x12000000), blurRadius: 8, offset: Offset(0, 4))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: items.asMap().entries.map((e) {
          final isLast = e.key == items.length - 1;
          return GestureDetector(
            onTap: () => onSelect(e.key),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF2F2F2))),
              ),
              child: Text(e.value, style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 14, fontWeight: FontWeight.w400)),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Dashed 구분선 ────────────────────────────────────────
class _DashedDivider extends StatelessWidget {
  const _DashedDivider();
  @override
  Widget build(BuildContext context) => CustomPaint(size: const Size(double.infinity, 1), painter: _DashedLinePainter());
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = _dividerDash..strokeWidth = 1;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 0), Offset(x + 4, 0), paint);
      x += 7;
    }
  }
  @override
  bool shouldRepaint(_) => false;
}

// ─────────────────────────────────────────────────────────
// 카테고리 상세 섹션
//
// [버그 수정 노트]
// StatefulWidget으로 구현하여 charCount 상태를 내부에서 관리.
// 기존 StatelessWidget이면 부모(ReportScreenState)의 setState가
// 텍스트 입력마다 호출되어 _PhotoGrid까지 재빌드 → 썸네일 떨림 발생.
// charCount를 내부 상태로 격리하면 TextField 입력 시 이 위젯만 재빌드됨.
// ─────────────────────────────────────────────────────────
class _CategorySection extends StatefulWidget {
  final String categoryLabel;
  final ReportType? selectedType;
  final List<ReportType> reportTypes;
  final bool typeOpen;
  final VoidCallback onTypeTap;
  final ValueChanged<int> onTypeSelect;
  final List<String> photos;
  final VoidCallback onAddPhoto;
  final ValueChanged<int> onRemovePhoto;
  final TextEditingController textCtrl;

  const _CategorySection({
    required this.categoryLabel,
    required this.selectedType,
    required this.reportTypes,
    required this.typeOpen,
    required this.onTypeTap,
    required this.onTypeSelect,
    required this.photos,
    required this.onAddPhoto,
    required this.onRemovePhoto,
    required this.textCtrl,
  });

  @override
  State<_CategorySection> createState() => _CategorySectionState();
}

class _CategorySectionState extends State<_CategorySection> {
  int _charCount = 0;

  @override
  void initState() {
    super.initState();
    _charCount = widget.textCtrl.text.length;
    widget.textCtrl.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.textCtrl.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    setState(() => _charCount = widget.textCtrl.text.length);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 카테고리명
          Text(widget.categoryLabel, style: const TextStyle(fontFamily: _font, color: Colors.black, fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFE0E0E0)),
          const SizedBox(height: 12),

          // 보고 유형 드롭다운
          _DropdownTile(
            label: widget.selectedType?.label ?? '보고 유형 선택',
            isPlaceholder: widget.selectedType == null,
            isOpen: widget.typeOpen,
            onTap: widget.onTypeTap,
          ),
          if (widget.typeOpen) ...[
            const SizedBox(height: 4),
            _DropdownMenu(
              items: widget.reportTypes.map((t) => t.label).toList(),
              onSelect: widget.onTypeSelect,
            ),
          ],
          const SizedBox(height: 16),

          // 사진 추가
          _PhotoGrid(photos: widget.photos, onAdd: widget.onAddPhoto, onRemove: widget.onRemovePhoto),
          const SizedBox(height: 16),

          // 텍스트 입력 (charCount는 이 위젯 내부 상태로만 관리)
          _TextInputBox(controller: widget.textCtrl, charCount: _charCount),
        ],
      ),
    );
  }
}

// ── 사진 그리드 ──────────────────────────────────────────
class _PhotoGrid extends StatelessWidget {
  final List<String> photos;
  final VoidCallback onAdd;
  final ValueChanged<int> onRemove;
  const _PhotoGrid({required this.photos, required this.onAdd, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    const sz = 80.0;
    return Wrap(
      spacing: 8, runSpacing: 8,
      children: [
        if (photos.length < 5)
          GestureDetector(
            onTap: onAdd,
            child: Container(
              width: sz, height: sz,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFDADADA)),
              ),
              child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.camera_alt_outlined, size: 24, color: Colors.black),
                SizedBox(height: 4),
                Text('사진 추가', style: TextStyle(fontFamily: _font, color: Colors.black, fontSize: 10, fontWeight: FontWeight.w700)),
              ]),
            ),
          ),
        ...photos.asMap().entries.map((e) =>
            _PhotoThumb(dataUrl: e.value, onRemove: () => onRemove(e.key))),
      ],
    );
  }
}

// ── 사진 썸네일 (X버튼 포함) ─────────────────────────────
class _PhotoThumb extends StatelessWidget {
  final String dataUrl;
  final VoidCallback onRemove;
  const _PhotoThumb({required this.dataUrl, required this.onRemove});

  Uint8List? _decodeBytes() {
    try {
      final b64 = dataUrl.contains(',') ? dataUrl.split(',').last : dataUrl;
      return base64Decode(b64);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    const sz = 80.0;
    final bytes = _decodeBytes();
    return SizedBox(
      width: sz, height: sz,
      child: Stack(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: bytes != null
              ? Image.memory(bytes, width: sz, height: sz, fit: BoxFit.cover)
              : Container(width: sz, height: sz, color: const Color(0xFFEEEEEE),
                  child: const Icon(Icons.broken_image_outlined, size: 28, color: Color(0xFFAAAAAA))),
        ),
        // X 삭제 버튼 (팝업 없이 즉시 삭제)
        Positioned(
          top: 2, right: 2,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              width: 20, height: 20,
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, size: 13, color: Colors.white),
            ),
          ),
        ),
      ]),
    );
  }
}

// ── 텍스트 입력 박스 (50자 제한 + 카운터) ────────────────
class _TextInputBox extends StatelessWidget {
  final TextEditingController controller;
  final int charCount;
  const _TextInputBox({required this.controller, required this.charCount});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDDDDDD)),
      ),
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
        TextField(
          controller: controller,
          maxLength: 50,
          maxLines: 3, minLines: 3,
          buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
          keyboardType: TextInputType.multiline,
          style: const TextStyle(fontFamily: _font, fontSize: 14, color: Colors.black, height: 1.5),
          decoration: const InputDecoration(
            hintText: '내용은 50자 이내로 작성해 주세요',
            hintStyle: TextStyle(fontFamily: _font, color: Color(0xFFBBBBBB), fontSize: 14),
            border: InputBorder.none, isDense: true, contentPadding: EdgeInsets.zero,
          ),
        ),
        Text('$charCount/50', style: const TextStyle(fontFamily: _font, color: Color(0xFF9F9F9F), fontSize: 12)),
      ]),
    );
  }
}
