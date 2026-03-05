// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:typed_data';
import 'dart:async';
import 'camera_service_interface.dart';

class WebCameraService implements CameraServiceInterface {
  html.VideoElement? _video;
  html.MediaStream? _stream;

  @override
  bool get isActive => _stream != null && _video != null;

  @override
  Future<html.VideoElement> start({String facingMode = 'environment'}) async {
    await stop();
    _stream = await _getStream(facingMode);
    _video = html.VideoElement()
      ..autoplay = true
      ..muted = true
      ..setAttribute('playsinline', 'true')
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.objectFit = 'cover';
    _video!.srcObject = _stream;
    await _video!.play();
    if (_video!.videoWidth == 0) {
      final completer = Completer<void>();
      void onMeta(_) {
        if (!completer.isCompleted) completer.complete();
      }
      void onErr(_) {
        if (!completer.isCompleted) completer.completeError(Exception('VideoElement error'));
      }
      _video!.onLoadedMetadata.listen(onMeta);
      _video!.onError.listen(onErr);
      await completer.future.timeout(
        const Duration(seconds: 8),
        onTimeout: () => throw TimeoutException('카메라 메타데이터 로드 타임아웃'),
      );
    }
    return _video!;
  }

  void hideVideo() => _setVisibility('hidden');
  void showVideo() => _setVisibility('visible');

  void _setVisibility(String value) {
    if (_video == null) return;
    // video 자체 숨기기
    _video!.style.visibility = value;

    // CanvasKit에서 video는 flt-glass-pane의 shadowRoot 안에 있음.
    // _video.parent로는 shadow DOM 경계를 넘을 수 없으므로
    // document에서 shadow DOM을 직접 탐색.
    final glasspane = html.document.querySelector('flt-glass-pane');
    final shadow = glasspane?.shadowRoot;
    if (shadow == null) return;

    // flt-platform-view 전체를 숨겨야 빈 컨테이너가 남지 않음
    final pvList = shadow.querySelectorAll('flt-platform-view');
    for (final pv in pvList) {
      pv.style.visibility = value;
    }
  }

  @override
  Future<Uint8List?> capture({int quality = 92}) async {
    if (_video == null) return null;
    final canvas = html.CanvasElement(
      width: _video!.videoWidth,
      height: _video!.videoHeight,
    );
    canvas.context2D.drawImage(_video!, 0, 0);
    // quality: 0~100 정수 → 0.0~1.0 double로 변환 (/ 100은 double 나눗셈 필요)
    final dataUrl = canvas.toDataUrl('image/jpeg', quality / 100.0);
    final base64 = dataUrl.split(',').last;
    return _base64Decode(base64);
  }

  @override
  Future<void> stop() async {
    _stream?.getTracks().forEach((t) => t.stop());
    _video?.srcObject = null;
    _video?.remove();
    _stream = null;
    _video = null;
  }

  Future<html.MediaStream> _getStream(String facingMode) async {
    try {
      return await html.window.navigator.mediaDevices!.getUserMedia({
        'video': {
          'facingMode': facingMode,
          'width': {'ideal': 1920},
          'height': {'ideal': 1080},
        },
        'audio': false,
      });
    } catch (e) {
      final name = _errorName(e);
      if (name == 'NotAllowedError' || name == 'PermissionDeniedError') rethrow;
      if (name == 'NotFoundError' || name == 'OverconstrainedError') {
        return await html.window.navigator.mediaDevices!
            .getUserMedia({'video': true, 'audio': false});
      }
      rethrow;
    }
  }

  static String _errorName(Object e) {
    try {
      if (e is html.DomException) return e.name;
      final str = e.toString();
      if (str.contains('NotAllowedError')) return 'NotAllowedError';
      if (str.contains('PermissionDeniedError')) return 'PermissionDeniedError';
      if (str.contains('NotFoundError')) return 'NotFoundError';
      if (str.contains('OverconstrainedError')) return 'OverconstrainedError';
    } catch (_) {}
    return '';
  }

  static Uint8List _base64Decode(String base64) {
    final decoded = html.window.atob(base64);
    final bytes = Uint8List(decoded.length);
    for (var i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.codeUnitAt(i);
    }
    return bytes;
  }
}
