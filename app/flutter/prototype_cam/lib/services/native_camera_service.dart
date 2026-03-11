// =============================================================================
// [개발자 인수인계] iOS / Android 네이티브 카메라 서비스 스텁
//
// ▶ 현재 상태: 미구현 스텁 — Web 프로토타입 완성 후 네이티브 구현 예정
//
// ▶ 네이티브 구현 시 작업 순서:
//   1. pubspec.yaml에 camera 패키지 추가:
//      dependencies:
//        camera: ^0.11.0
//
//   2. 아래 주석 해제 후 구현 완성
//
//   3. capture_provider.dart의 WebCameraService를 NativeCameraService로 교체
//
//   4. 플랫폼 권한 설정:
//      - iOS: ios/Runner/Info.plist에 카메라 권한 추가
//        <key>NSCameraUsageDescription</key>
//        <string>업무 촬영을 위해 카메라 접근이 필요합니다.</string>
//      - Android: android/app/src/main/AndroidManifest.xml에 추가
//        <uses-permission android:name="android.permission.CAMERA"/>
// =============================================================================

// 아래는 구현 예시 코드입니다. camera 패키지 추가 후 주석을 해제하세요.

/*
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'camera_service_interface.dart';

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
*/
