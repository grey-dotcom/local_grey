import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'camera_service_interface.dart';

/// iOS / Android 네이티브 카메라 서비스 스텁
///
/// [개발자 인수인계]
/// - camera 패키지(^0.11.0) 사용
/// - capture_provider.dart의 WebCameraService를 이 클래스로 교체
/// - iOS: Info.plist 카메라 권한 추가 필요 (README 참고)
/// - Android: AndroidManifest.xml 카메라 권한 추가 필요 (README 참고)
///
/// [현재 상태] 스텁 — Web 프로토타입 완성 후 네이티브 구현 예정
class NativeCameraService implements CameraServiceInterface {
  CameraController? _controller;
  List<CameraDescription> _cameras = [];

  @override
  bool get isActive => _controller?.value.isInitialized ?? false;

  @override
  Future<void> start() async {
    _cameras = await availableCameras();
    if (_cameras.isEmpty) throw Exception('사용 가능한 카메라 없음');

    final description = _cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => _cameras.first,
    );

    _controller = CameraController(
      description,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    await _controller!.initialize();
    debugPrint('[NativeCameraService] camera started: ${description.name}');
  }

  @override
  Future<Uint8List?> capture() async {
    if (_controller == null || !_controller!.value.isInitialized) return null;
    try {
      final xFile = await _controller!.takePicture();
      return await xFile.readAsBytes();
    } catch (e) {
      debugPrint('[NativeCameraService] capture error: $e');
      return null;
    }
  }

  @override
  Future<void> stop() async {
    await _controller?.dispose();
    _controller = null;
    debugPrint('[NativeCameraService] camera stopped');
  }

  /// CameraPreview 위젯 사용 시 필요
  CameraController? get controller => _controller;
}
