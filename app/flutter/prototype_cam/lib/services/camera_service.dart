// =============================================================================
// [개발자 인수인계] Web 카메라 서비스
//
// ▶ dart:html → package:web 마이그레이션 (Flutter 3.22+ / Dart 3.4+)
//   dart:html은 Dart 3.x에서 deprecated되어 컴파일 불가.
//   package:web + dart:js_interop으로 동일 기능 구현.
//
// ▶ 주요 변경점:
//   - html.VideoElement      → web.HTMLVideoElement
//   - html.MediaStream       → web.MediaStream
//   - html.CanvasElement     → web.HTMLCanvasElement
//   - html.window.navigator  → web.window.navigator
//   - html.DomException      → web.DOMException
//   - .toDataUrl()           → .toDataURL()
//   - getUserMedia 옵션      → MediaStreamConstraints (package:web 타입)
//   - stream.getTracks()     → JSArray, 인덱스 [] 접근
// =============================================================================

import 'dart:async';
import 'dart:js_interop';
import 'dart:typed_data';
import 'package:web/web.dart' as web;
import 'camera_service_interface.dart';

class WebCameraService implements CameraServiceInterface {
  web.HTMLVideoElement? _video;
  web.MediaStream? _stream;

  @override
  bool get isActive => _stream != null && _video != null;

  @override
  Future<web.HTMLVideoElement> start({String facingMode = 'environment'}) async {
    await stop();
    _stream = await _getStream(facingMode);
    _video = web.HTMLVideoElement()
      ..autoplay = true
      ..muted = true
      ..setAttribute('playsinline', 'true')
      ..style.width = '100%'
      ..style.height = '100%'
      ..style.objectFit = 'cover';
    _video!.srcObject = _stream;
    await _video!.play().toDart;

    if (_video!.videoWidth == 0) {
      final completer = Completer<void>();
      late StreamSubscription metaSub;
      late StreamSubscription errSub;

      metaSub = _video!.onLoadedMetadata.listen((_) {
        if (!completer.isCompleted) {
          completer.complete();
          metaSub.cancel();
          errSub.cancel();
        }
      });
      errSub = _video!.onError.listen((_) {
        if (!completer.isCompleted) {
          completer.completeError(Exception('VideoElement error'));
          metaSub.cancel();
          errSub.cancel();
        }
      });

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
    _video!.style.visibility = value;

    // CanvasKit에서 video는 flt-glass-pane의 shadowRoot 안에 있음.
    // [개발자] shadow DOM 경계를 넘어 flt-platform-view 전체를 숨겨야 빈 컨테이너가 남지 않음.
    final glasspane = web.document.querySelector('flt-glass-pane');
    final shadow = glasspane?.shadowRoot;
    if (shadow == null) return;

    final pvList = shadow.querySelectorAll('flt-platform-view');
    for (int i = 0; i < pvList.length; i++) {
      final pv = pvList.item(i);
      if (pv != null) {
        (pv as web.HTMLElement).style.visibility = value;
      }
    }
  }

  @override
  Future<Uint8List?> capture({int quality = 92}) async {
    if (_video == null) return null;
    final canvas = web.HTMLCanvasElement()
      ..width = _video!.videoWidth
      ..height = _video!.videoHeight;
    canvas.context2D.drawImage(_video!, 0, 0);
    final dataUrl = canvas.toDataURL('image/jpeg', (quality / 100.0).toJS);
    final base64 = dataUrl.split(',').last;
    return _base64Decode(base64);
  }

  @override
  Future<void> stop() async {
    // [개발자] package:web에서 getTracks()는 JSArray — 인덱스 [] 접근 사용
    final tracks = _stream?.getTracks();
    if (tracks != null) {
      for (int i = 0; i < tracks.length; i++) {
        tracks[i].stop();
      }
    }
    _video?.srcObject = null;
    _video?.remove();
    _stream = null;
    _video = null;
  }

  Future<web.MediaStream> _getStream(String facingMode) async {
    try {
      return await _getUserMedia(facingMode: facingMode, ideal: true);
    } catch (e) {
      final name = _errorName(e);
      if (name == 'NotAllowedError' || name == 'PermissionDeniedError') rethrow;
      if (name == 'NotFoundError' || name == 'OverconstrainedError') {
        return await _getUserMedia(facingMode: facingMode, ideal: false);
      }
      rethrow;
    }
  }

  // [개발자] package:web에서 getUserMedia는 MediaStreamConstraints 타입을 받음.
  // JSObject로 직접 만들어 MediaStreamConstraints로 캐스팅해서 전달.
  Future<web.MediaStream> _getUserMedia({
    required String facingMode,
    required bool ideal,
  }) async {
    final JSObject rawConstraints;
    if (ideal) {
      rawConstraints = {
        'video': {
          'facingMode': facingMode,
          'width': {'ideal': 1920},
          'height': {'ideal': 1080},
        },
        'audio': false,
      }.jsify()! as JSObject;
    } else {
      rawConstraints = {
        'video': true,
        'audio': false,
      }.jsify()! as JSObject;
    }
    // package:web의 getUserMedia는 MediaStreamConstraints를 요구하므로 캐스팅
    final constraints = rawConstraints as web.MediaStreamConstraints;
    return await web.window.navigator.mediaDevices.getUserMedia(constraints).toDart;
  }

  static String _errorName(Object e) {
    try {
      if (e is web.DOMException) return e.name;
      final str = e.toString();
      if (str.contains('NotAllowedError')) return 'NotAllowedError';
      if (str.contains('PermissionDeniedError')) return 'PermissionDeniedError';
      if (str.contains('NotFoundError')) return 'NotFoundError';
      if (str.contains('OverconstrainedError')) return 'OverconstrainedError';
    } catch (_) {}
    return '';
  }

  static Uint8List _base64Decode(String base64) {
    // [개발자] package:web에서 atob은 web.window.atob()으로 호출
    final decoded = web.window.atob(base64);
    final bytes = Uint8List(decoded.length);
    for (var i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.codeUnitAt(i);
    }
    return bytes;
  }
}
