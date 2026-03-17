import 'dart:convert';
import 'dart:math';
// ignore: avoid_web_libraries_in_flutter
import 'dart:ui_web' as ui_web;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import '../models/app_config.dart';
import '../models/task_group.dart';
import '../models/task_item.dart';
import '../services/api_service.dart';
import '../services/camera_service.dart';

// =============================================================================
// UploadStatus — 업로드 큐 상태값 5종
//
//  idle      : 미촬영 초기 상태 (사용 안 함 — 촬영 전은 _captures에 key 없음)
//  queued    : 촬영 완료, 업로드 대기 중
//              [BE 연동 #3] 큐 처리 주체(FE/BE) 확정 후 실제 큐 로직 구현
//  uploading : 서버로 전송 중
//  success   : 업로드 완료
//  error     : 업로드 실패 — 로컬 유지, 재시도 가능
//
// [App 연동] 오프라인 → queued 유지 → 네트워크 연결 시 uploading 전환
//            ConnectivityResult 감지는 네이티브 앱 구현 시 추가
// =============================================================================
enum UploadStatus { idle, queued, uploading, success, error }

class CaptureResult {
  final Uint8List bytes;
  final UploadStatus status;
  final String? errorMessage;
  final String? serverUrl;
  // [BE 연동 #6] 재시도 가능 여부 — isRetryable=true 시 재시도 버튼 노출
  final bool isRetryable;

  const CaptureResult({
    required this.bytes,
    this.status = UploadStatus.idle,
    this.errorMessage,
    this.serverUrl,
    this.isRetryable = true,
  });

  CaptureResult copyWith({
    UploadStatus? status,
    String? errorMessage,
    String? serverUrl,
    bool? isRetryable,
  }) =>
      CaptureResult(
        bytes: bytes,
        status: status ?? this.status,
        errorMessage: errorMessage ?? this.errorMessage,
        serverUrl: serverUrl ?? this.serverUrl,
        isRetryable: isRetryable ?? this.isRetryable,
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
  bool _showCaptureBubble = false;

  VoidCallback? onAllMandatoryComplete;

  // [Phase 1] 수행완료 자동 처리 플래그
  // [BE 연동 #4] completeRequested=true + allMandatoryUploadSuccess → 수행완료 API 호출
  bool _completeRequested = false;
  bool get completeRequested => _completeRequested;

  void setCompleteRequested(bool value) {
    _completeRequested = value;
    notifyListeners();
  }

  final WebCameraService _cameraService = WebCameraService();
  CameraPermission _cameraPermission = CameraPermission.unknown;

  String? _viewId;
  bool _cameraReady = false;

  final ApiService _api = ApiService.instance;

  // ── Getters ────────────────────────────────────────────────────────────────
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

  bool get isRecaptureMode => currentCapture != null;

  bool get isLastItem =>
      _groupIndex == _groups.length - 1 &&
      _itemIndex == (currentGroup?.items.length ?? 1) - 1;

  bool get isFirstItem => _groupIndex == 0 && _itemIndex == 0;

  bool get allMandatoryCaptured => _groups.every(
        (g) => g.mandatoryItems.every((i) => isItemCaptured(i.id)),
      );

  bool get allCaptured => _groups.every(
        (g) => g.items.every((i) => isItemCaptured(i.id)),
      );

  // [Phase 1] 필수 항목 중 업로드 진행 중인 항목 여부
  // → [수행완료] 버튼 disabled 판단에 사용
  bool get hasMandatoryUploading => _groups.any(
        (g) => g.mandatoryItems.any((i) {
          final c = _captures[i.id];
          return c != null &&
              (c.status == UploadStatus.uploading ||
                  c.status == UploadStatus.queued);
        }),
      );

  // [Phase 1] 필수 항목 중 업로드 에러 여부
  bool get hasMandatoryError => _groups.any(
        (g) => g.mandatoryItems.any((i) {
          final c = _captures[i.id];
          return c != null && c.status == UploadStatus.error;
        }),
      );

  // [Phase 1] 필수 항목 전부 업로드 success 여부
  // → [BE 연동 #4] 자동 수행완료 트리거 조건
  bool get allMandatoryUploadSuccess => _groups.every(
        (g) => g.mandatoryItems.every((i) {
          final c = _captures[i.id];
          return c != null && c.status == UploadStatus.success;
        }),
      );

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

  int get totalItemCount =>
      _groups.fold(0, (sum, g) => sum + g.items.length);

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

      // [BE 연동 #5] 화면 초기화 시 어드민 업로드 사진 상태 조회 (Phase 3)
      // await _loadServerCaptureStatus(taskId);
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

  // ── 촬영 ───────────────────────────────────────────────────────────────────
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

      // [BE 연동 #3] 동일 도안 재촬영 시 이전 업로드 무효화 주의
      // 실서버 연동 시 시퀀스 번호 기반 무효화 또는 BE 큐 취소 방식 선택 필요
      _captures[item.id] =
          CaptureResult(bytes: bytes, status: UploadStatus.uploading);

      _lastCaptureTime = DateTime.now();
      _showCaptureBubble = true;

      final nowAllMandatoryDone = allMandatoryCaptured;

      _autoAdvance(
        capturedGroupIdx,
        capturedItemIdx,
        wasRecapture: wasRecapture,
        nowAllMandatoryDone: nowAllMandatoryDone,
      );

      _isCapturing = false;
      notifyListeners();

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

  void _autoAdvance(
    int capturedGroupIdx,
    int capturedItemIdx, {
    required bool wasRecapture,
    required bool nowAllMandatoryDone,
  }) {
    if (nowAllMandatoryDone) {
      _groupIndex = _groups.length - 1;
      _itemIndex = _groups.last.items.length - 1;
      return;
    }

    if (wasRecapture && !nowAllMandatoryDone) {
      final target = firstUncapturedMandatory;
      if (target != null) {
        _groupIndex = target.groupIdx;
        _itemIndex = target.itemIdx;
        return;
      }
    }

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

        // [BE 연동 #4] 수행완료 자동 처리 트리거
        // if (_completeRequested && allMandatoryUploadSuccess) {
        //   await _triggerCompleteApi();
        //   notifyListeners();
        // }
      }
    } catch (e) {
      if (_captures.containsKey(itemId)) {
        final isRetryable = e is ApiException ? e.isRetryable : true;
        _captures[itemId] = _captures[itemId]!.copyWith(
          status: UploadStatus.error,
          errorMessage: e.toString(),
          isRetryable: isRetryable,
        );
        notifyListeners();
      }
      debugPrint('[CaptureProvider] upload error: $e');
    }
  }

  // [Phase 1] 재시도(재업로드)
  // [BE 연동 #3] 실서버 연동 시 endpoint 방식 확정 후 구현체 완성
  Future<void> retryUpload(String itemId) async {
    final current = _captures[itemId];
    if (current == null || current.status != UploadStatus.error) return;

    String? groupId;
    for (final g in _groups) {
      if (g.items.any((i) => i.id == itemId)) {
        groupId = g.id;
        break;
      }
    }
    if (groupId == null) return;

    _captures[itemId] = current.copyWith(
      status: UploadStatus.uploading,
      errorMessage: null,
    );
    notifyListeners();

    await _uploadInBackground(
      bytes: current.bytes,
      itemId: itemId,
      groupId: groupId,
    );
  }

  // [BE 연동 #4] 수행완료 API stub — Phase 3에서 연동 예정
  // Future<void> _triggerCompleteApi() async {
  //   // POST /api/v1/tasks/{taskId}/complete
  // }

  // ── UI ─────────────────────────────────────────────────────────────────────
  void toggleContents() {
    _isContentsExpanded = !_isContentsExpanded;
    notifyListeners();
  }

  // [버그 수정 #3] notifyListeners() 추가 — 말풍선 중복 발화 방지 보장
  void consumeCaptureBubble() {
    if (_showCaptureBubble) {
      _showCaptureBubble = false;
      notifyListeners();
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
