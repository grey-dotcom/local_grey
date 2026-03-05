import 'dart:convert';
// ignore: avoid_web_libraries_in_flutter
import 'dart:ui_web' as ui_web;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../models/task_group.dart';
import '../models/task_item.dart';
import '../services/api_service.dart';
import '../services/camera_service.dart';

enum UploadStatus { idle, uploading, success, error }

class CaptureResult {
  final Uint8List bytes;
  final UploadStatus status;
  final String? errorMessage;
  final String? serverUrl;

  const CaptureResult({
    required this.bytes,
    this.status = UploadStatus.idle,
    this.errorMessage,
    this.serverUrl,
  });

  CaptureResult copyWith({
    UploadStatus? status,
    String? errorMessage,
    String? serverUrl,
  }) =>
      CaptureResult(
        bytes: bytes,
        status: status ?? this.status,
        errorMessage: errorMessage ?? this.errorMessage,
        serverUrl: serverUrl ?? this.serverUrl,
      );
}

enum CameraPermission { unknown, granted, denied }

class CaptureProvider extends ChangeNotifier {
  List<TaskGroup> _groups = [];
  bool _isLoading = true;
  String? _error;

  int _groupIndex = 0;
  int _itemIndex = 0;

  final Map<String, CaptureResult> _captures = {};

  bool _isContentsExpanded = false;
  bool _isCapturing = false;

  final WebCameraService _cameraService = WebCameraService();
  CameraPermission _cameraPermission = CameraPermission.unknown;

  String? _viewId;
  bool _cameraReady = false;

  final ApiService _api = ApiService.instance;

  // ── Getters ──────────────────────────────────────────────
  List<TaskGroup> get groups => _groups;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get groupIndex => _groupIndex;
  int get itemIndex => _itemIndex;
  TaskGroup? get currentGroup => _groups.isEmpty ? null : _groups[_groupIndex];
  TaskItem? get currentItem => currentGroup?.items[_itemIndex];
  bool get isContentsExpanded => _isContentsExpanded;
  bool get isCapturing => _isCapturing;
  CameraPermission get cameraPermission => _cameraPermission;
  bool get cameraReady => _cameraReady;
  String? get cameraViewId => _viewId;
  List<TaskItem> get currentItems => currentGroup?.items ?? [];
  CaptureResult? captureOf(String itemId) => _captures[itemId];
  CaptureResult? get currentCapture =>
      currentItem == null ? null : _captures[currentItem!.id];
  bool isItemCaptured(String itemId) => _captures.containsKey(itemId);

  /// 촬영 완료 도안 여부 — 셔터 버튼 UI 전환에만 사용
  bool get isRecaptureMode => currentCapture != null;

  /// 마지막 그룹의 마지막 도안 여부
  bool get isLastItem =>
      _groupIndex == _groups.length - 1 &&
      _itemIndex == (currentGroup?.items.length ?? 1) - 1;

  /// 필수 항목 전부 촬영 완료 여부 (업무완료 기준)
  bool get allMandatoryCaptured => _groups.every(
        (g) => g.mandatoryItems.every((i) => isItemCaptured(i.id)),
      );

  /// 모든 항목(필수+선택) 촬영 완료 여부
  bool get allCaptured => _groups.every(
        (g) => g.items.every((i) => isItemCaptured(i.id)),
      );

  /// 첫 번째 미촬영 필수 도안 위치. 없으면 null.
  ({int groupIdx, int itemIdx})? get firstUncapturedMandatory {
    for (int g = 0; g < _groups.length; g++) {
      final items = _groups[g].mandatoryItems;
      for (final item in items) {
        if (!isItemCaptured(item.id)) {
          final idx = _groups[g].items.indexOf(item);
          return (groupIdx: g, itemIdx: idx);
        }
      }
    }
    return null;
  }

  int get mandatoryDoneCount =>
      _groups.fold(0, (sum, g) => sum + g.mandatoryItems.where((i) => isItemCaptured(i.id)).length);

  int get mandatoryTotalCount =>
      _groups.fold(0, (sum, g) => sum + g.mandatoryItems.length);

  // ── 초기화 ───────────────────────────────────────────────
  Future<void> loadTasks() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final raw = await rootBundle.loadString('assets/task_data.json');
      final list = json.decode(raw) as List;
      _groups = list
          .map((e) => TaskGroup.fromJson(e as Map<String, dynamic>))
          .toList();
      _groupIndex = 0;
      _itemIndex = 0;
    } catch (e) {
      _error = '업무 데이터를 불러오지 못했습니다.';
      debugPrint('[CaptureProvider] loadTasks error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    await _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final videoEl = await _cameraService.start();
      _cameraPermission = CameraPermission.granted;
      _cameraReady = true;
      _viewId = 'cam-view-${DateTime.now().millisecondsSinceEpoch}';
      ui_web.platformViewRegistry.registerViewFactory(
        _viewId!,
        (int id) => videoEl,
      );
      debugPrint('[CaptureProvider] camera ready: $_viewId');
    } catch (e) {
      _cameraPermission = CameraPermission.denied;
      _cameraReady = false;
      _viewId = null;
      debugPrint('[CaptureProvider] camera init error: $e');
    }
    notifyListeners();
  }

  Future<void> requestCameraPermission() async {
    _cameraPermission = CameraPermission.unknown;
    _cameraReady = false;
    _viewId = null;
    notifyListeners();
    await _initCamera();
  }

  // ── 네비게이션 ────────────────────────────────────────────
  void _navigateTo(int groupIdx, int itemIdx) {
    _groupIndex = groupIdx;
    _itemIndex = itemIdx;
    _isContentsExpanded = false;
    notifyListeners();
  }

  void jumpToItem(int groupIdx, int itemIdx) {
    if (groupIdx < 0 || groupIdx >= _groups.length) return;
    if (itemIdx < 0 || itemIdx >= _groups[groupIdx].items.length) return;
    _navigateTo(groupIdx, itemIdx);
  }

  void goNextItemOrGroup() {
    if (currentGroup == null) return;
    if (_itemIndex < currentGroup!.items.length - 1) {
      _navigateTo(_groupIndex, _itemIndex + 1);
    } else if (_groupIndex < _groups.length - 1) {
      // 그룹 마지막 도안 → 다음 그룹 첫 도안
      _navigateTo(_groupIndex + 1, 0);
    }
  }

  void goPrevItemOrGroup() {
    if (_itemIndex > 0) {
      _navigateTo(_groupIndex, _itemIndex - 1);
    } else if (_groupIndex > 0) {
      // 그룹 첫 도안 → 이전 그룹 마지막 도안
      final prevGroup = _groups[_groupIndex - 1];
      _navigateTo(_groupIndex - 1, prevGroup.items.length - 1);
    }
  }

  // ── 촬영 ─────────────────────────────────────────────────
  /// 촬영 후 자동이동:
  /// - 현재 그룹에 미완료 도안 있으면 → 첫 미완료 도안
  /// - 없으면 → 다음 그룹 첫 도안 (마지막 그룹이면 그 자리 유지)
  Future<void> capture() async {
    if (_isCapturing || currentItem == null || !_cameraReady) return;

    _isCapturing = true;
    notifyListeners();

    final item = currentItem!;
    final group = currentGroup!;
    final capturedGroupIdx = _groupIndex;
    final capturedItemIdx = _itemIndex;

    try {
      final bytes = await _cameraService.capture();
      if (bytes == null) throw Exception('캡처 실패');

      _captures[item.id] =
          CaptureResult(bytes: bytes, status: UploadStatus.uploading);

      _autoAdvance(capturedGroupIdx, capturedItemIdx);
      _isCapturing = false;
      notifyListeners();

      _uploadInBackground(bytes: bytes, itemId: item.id, groupId: group.id);
    } catch (e) {
      _isCapturing = false;
      _error = '촬영에 실패했습니다.';
      debugPrint('[CaptureProvider] capture error: $e');
      notifyListeners();
    }
  }

  void _autoAdvance(int capturedGroupIdx, int capturedItemIdx) {
    // 촬영된 도안 다음부터 전체 순회하여 첫 미촬영 도안으로 이동
    // 이미 촬영된 도안은 건너뜀 (촬영 후 재촬영 화면 방지)
    for (int g = capturedGroupIdx; g < _groups.length; g++) {
      final startI = (g == capturedGroupIdx) ? capturedItemIdx + 1 : 0;
      for (int i = startI; i < _groups[g].items.length; i++) {
        if (!isItemCaptured(_groups[g].items[i].id)) {
          _groupIndex = g;
          _itemIndex = i;
          _isContentsExpanded = false;
          return;
        }
      }
    }
    // 이후 모든 도안 촬영 완료 → 마지막 그룹 마지막 도안으로 이동 (업무완료 버튼 노출)
    _groupIndex = _groups.length - 1;
    _itemIndex = _groups.last.items.length - 1;
    _isContentsExpanded = false;
  }

  Future<void> _uploadInBackground({
    required Uint8List bytes,
    required String itemId,
    required String groupId,
  }) async {
    try {
      final result = await _api.uploadCapture(
          bytes: bytes, itemId: itemId, groupId: groupId);
      if (_captures.containsKey(itemId)) {
        _captures[itemId] = _captures[itemId]!.copyWith(
          status: UploadStatus.success,
          serverUrl: result['url'] as String?,
        );
        notifyListeners();
      }
    } catch (e) {
      if (_captures.containsKey(itemId)) {
        _captures[itemId] = _captures[itemId]!.copyWith(
          status: UploadStatus.error,
          errorMessage: e.toString(),
        );
        notifyListeners();
      }
      debugPrint('[CaptureProvider] upload error: $e');
    }
  }

  // ── UI ───────────────────────────────────────────────────
  void toggleContents() {
    _isContentsExpanded = !_isContentsExpanded;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _cameraService.stop();
    super.dispose();
  }
}
