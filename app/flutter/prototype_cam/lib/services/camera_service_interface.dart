import 'dart:typed_data';

/// 카메라 서비스 공통 인터페이스
/// - Web 구현: WebCameraService (dart:html + getUserMedia)
/// - Native 구현: NativeCameraService (camera 패키지)
///
/// capture_provider.dart는 이 인터페이스만 바라보므로
/// 플랫폼 전환 시 구현체 교체만으로 완료됨
abstract class CameraServiceInterface {
  /// 카메라 스트림 시작.
  /// Web: VideoElement 반환, Native: void 반환 (구현체별 상이)
  /// capture_provider는 WebCameraService를 직접 사용하므로 실제 타입 안전함.
  Future<dynamic> start();

  /// 현재 프레임을 JPEG bytes로 캡처
  Future<Uint8List?> capture();

  /// 카메라 중지 및 리소스 해제
  Future<void> stop();

  /// 스트림 활성 여부
  bool get isActive;
}
