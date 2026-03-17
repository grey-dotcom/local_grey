import 'dart:convert';
import 'dart:math';
// ignore: avoid_web_libraries_in_flutter
import 'dart:ui_web' as ui_web;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart'; // WidgetsBinding.instance.addPostFrameCallback
import '../models/app_config.dart';
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
  AppConfig? _appConfig;
  bool _isLoading = true;
  String? _error;

  int _groupIndex = 0;
  int _itemIndex = 0;

  final Map<String, CaptureResult> _captures = {};

  bool _isContentsExpanded = false;
  bool _isCapturing = false;
  DateTime? _lastCaptureTime;
  bool _showCaptureBubble = false; // 촬영완료 말풍선 전용 플래그 — 소비 후 즉시 false

  // ── 촬영 완료 콜백 ──────────────────────────────────────
  // [▶ 개발자 인수인계]
  // 모든 필수 업무도안 촬영 완료 시 CaptureScreen이 화면을 종료하도록 트리거.
  // 촬영완료 버튼 제거 이후 모든 케이스에서 nowAllMandatoryDone이면 자동 pop으로 통합.
  // CaptureScreen의 didChangeDependencies에서 등록, dispose 시 해제.
  VoidCallback? onAllMandatoryComplete;

  final WebCameraService _cameraService = WebCameraService();
  CameraPermission _cameraPermission = CameraPermission.unknown;

  String? _viewId;
  bool _cameraReady = false;

  final ApiService _api = ApiService.instance;

  // ── Getters ──────────────────────────────────────────────
  List<TaskGroup> get groups => _groups;
  AppConfig? get appConfig => _appConfig;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get groupIndex => _groupIndex;
  int get itemIndex => _itemIndex;
  TaskGroup? get currentGroup => _groups.isEmpty ? null : _groups[_groupIndex];
  TaskItem? get currentItem => currentGroup?.items[_itemIndex];
  bool get isContentsExpanded => _isContentsExpanded;
  bool get isCapturing => _isCapturing;
  DateTime? get lastCaptureTime => _lastCaptureTime;
  bool get showCaptureBubble => _showCaptureBubble;
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

  /// 첫 번째 도안 여부 (순환 스와이프용)
  bool get isFirstItem => _groupIndex == 0 && _itemIndex == 0;

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

  /// 전체 도안 수 (모든 그룹 합산)
  int get totalItemCount =>
      _groups.fold(0, (sum, g) => sum + g.items.length);

  /// 현재 도안의 전체 flat index (1-based)
  int get currentItemGlobalIndex {
    int idx = 0;
    for (int g = 0; g < _groupIndex; g++) {
      idx += _groups[g].items.length;
    }
    return idx + _itemIndex + 1;
  }

  int get mandatoryDoneCount => _groups.fold(
      0,
      (sum, g) =>
          sum + g.mandatoryItems.where((i) => isItemCaptured(i.id)).length);

  int get mandatoryTotalCount =>
      _groups.fold(0, (sum, g) => sum + g.mandatoryItems.length);

  // ── 초기화 ─────────────────────────────────────────────────────────────────
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

      final configRaw = await rootBundle.loadString('assets/app_config.json');
      final configJson = json.decode(configRaw) as Map<String, dynamic>;
      final accessCode = (100000 + Random().nextInt(900000)).toString();
      _appConfig = AppConfig.fromJson(configJson, accessCode: accessCode);
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
    _cameraService.stop();
    notifyListeners();
    await _initCamera();
  }

  // ── 네비게이션 ─────────────────────────────────────────────────────────────
  void _navigateTo(int groupIdx, int itemIdx) {
    _groupIndex = groupIdx;
    _itemIndex = itemIdx;
    notifyListeners();
  }

  void jumpToItem(int groupIdx, int itemIdx) {
    if (groupIdx < 0 || groupIdx >= _groups.length) return;
    if (itemIdx < 0 || itemIdx >= _groups[groupIdx].items.length) return;
    _navigateTo(groupIdx, itemIdx);
  }

  // [정책] 순환 스와이프 — 마지막 도안에서 왼쪽 스와이프 → 첫 도안으로
  void goNextItemOrGroup() {
    if (_groups.isEmpty) return;
    if (currentGroup == null) return;
    if (_itemIndex < currentGroup!.items.length - 1) {
      _navigateTo(_groupIndex, _itemIndex + 1);
    } else if (_groupIndex < _groups.length - 1) {
      _navigateTo(_groupIndex + 1, 0);
    } else {
      _navigateTo(0, 0);
    }
  }

  // [정책] 순환 스와이프 — 첫 도안에서 오른쪽 스와이프 → 마지막 도안으로
  void goPrevItemOrGroup() {
    if (_groups.isEmpty) return;
    if (_itemIndex > 0) {
      _navigateTo(_groupIndex, _itemIndex - 1);
    } else if (_groupIndex > 0) {
      final prevGroup = _groups[_groupIndex - 1];
      _navigateTo(_groupIndex - 1, prevGroup.items.length - 1);
    } else {
      _navigateTo(_groups.length - 1, _groups.last.items.length - 1);
    }
  }

  // ── 촬영 ─────────────────────────────────────────────────────────────────
  Future<void> capture() async {
    if (_isCapturing || currentItem == null || !_cameraReady) return;

    _isCapturing = true;
    notifyListeners();

    final item = currentItem!;
    final group = currentGroup!;
    final capturedGroupIdx = _groupIndex;
    final capturedItemIdx = _itemIndex;
    final wasRecapture = isItemCaptured(item.id);

    try {
      final bytes = await _cameraService.capture();
      if (bytes == null) throw Exception('캡처 실패');

      _captures[item.id] =
          CaptureResult(bytes: bytes, status: UploadStatus.uploading);

      _lastCaptureTime = DateTime.now();
      _showCaptureBubble = true;

      // captures 반영 후 필수 완료 여부 체크
      final nowAllMandatoryDone = allMandatoryCaptured;

      _autoAdvance(
        capturedGroupIdx,
        capturedItemIdx,
        wasRecapture: wasRecapture,
        nowAllMandatoryDone: nowAllMandatoryDone,
      );

      _isCapturing = false;
      notifyListeners();

      // [정책] 모든 필수 촬영 완료 시 위치 무관하게 자동 pop.
      // 촬영완료 버튼 제거로 모든 종료 경로를 자동 pop으로 통합.
      // Case 1 (처음부터 순서대로), Case 2 (재촬영 후 완료),
      // Case 3 (중간부터 촬영 후 완료) 모두 동일하게 처리.
      if (nowAllMandatoryDone) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          onAllMandatoryComplete?.call();
        });
      }

      _uploadInBackground(bytes: bytes, itemId: item.id, groupId: group.id);
    } catch (e) {
      _isCapturing = false;
      _error = '촬영에 실패했습니다.';
      debugPrint('[CaptureProvider] capture error: $e');
      notifyListeners();
    }
  }

  // ── autoAdvance ───────────────────────────────────────────────────────────
  // Case 1 [촬영 후 필수 전체 완료]  → 마지막 도안 유지 후 자동 pop (capture()에서 발화)
  // Case 2 [재촬영 + 필수 미완료]    → 촬영 즉시 첫 미촬영 필수 도안으로 이동
  // Case 3 [일반 촬영 + 필수 미완료] → capturedIdx 이후 순방향 탐색 → wrap-around
  void _autoAdvance(
    int capturedGroupIdx,
    int capturedItemIdx, {
    required bool wasRecapture,
    required bool nowAllMandatoryDone,
  }) {
    // Case 1 — 필수 완료: 마지막 도안 유지 (pop은 capture()에서 처리)
    if (nowAllMandatoryDone) {
      _groupIndex = _groups.length - 1;
      _itemIndex = _groups.last.items.length - 1;
      return;
    }

    // Case 2 — 재촬영 + 필수 미완료: 첫 미촬영 필수 도안으로 이동
    if (wasRecapture && !nowAllMandatoryDone) {
      final target = firstUncapturedMandatory;
      if (target != null) {
        _groupIndex = target.groupIdx;
        _itemIndex = target.itemIdx;
        return;
      }
    }

    // Case 3 — 순방향 탐색
    for (int g = capturedGroupIdx; g < _groups.length; g++) {
      final startI = (g == capturedGroupIdx) ? capturedItemIdx + 1 : 0;
      for (int i = startI; i < _groups[g].items.length; i++) {
        if (!isItemCaptured(_groups[g].items[i].id)) {
          _groupIndex = g;
          _itemIndex = i;
          return;
        }
      }
    }

    // Case 3 — wrap-around: 처음부터 capturedIdx 직전까지
    for (int g = 0; g <= capturedGroupIdx; g++) {
      final endI =
          (g == capturedGroupIdx) ? capturedItemIdx : _groups[g].items.length;
      for (int i = 0; i < endI; i++) {
        if (!isItemCaptured(_groups[g].items[i].id)) {
          _groupIndex = g;
          _itemIndex = i;
          return;
        }
      }
    }

    // fallthrough: 선택 도안만 남은 상태 → 마지막 도안 유지
    _groupIndex = _groups.length - 1;
    _itemIndex = _groups.last.items.length - 1;
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

  // ── UI ─────────────────────────────────────────────────────────────────────
  void toggleContents() {
    _isContentsExpanded = !_isContentsExpanded;
    notifyListeners();
  }

  void consumeCaptureBubble() {
    if (_showCaptureBubble) {
      _showCaptureBubble = false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    onAllMandatoryComplete = null;
    _cameraService.stop();
    super.dispose();
  }
}
