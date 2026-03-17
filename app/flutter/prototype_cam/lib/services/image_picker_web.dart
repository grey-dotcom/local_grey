// =============================================================================
// [개발자 인수인계] Web 이미지 파일 선택
//
// ▶ dart:html → package:web 마이그레이션 (Flutter 3.22+ / Dart 3.4+)
//   - html.FileUploadInputElement → web.HTMLInputElement (type='file')
//   - html.FileReader             → web.FileReader
//   - {'once': true} EventListenerOptions → web.AddEventListenerOptions
// =============================================================================

import 'dart:async';
import 'dart:js_interop';
import 'package:web/web.dart' as web;

/// Web 환경에서 이미지 파일을 선택하여 base64 data URL로 반환
Future<String?> pickImageWeb() async {
  final completer = Completer<String?>();

  // [개발자] FileUploadInputElement → HTMLInputElement(type='file')
  final input = web.HTMLInputElement()
    ..type = 'file'
    ..accept = 'image/*';

  input.click();

  input.addEventListener(
    'change',
    (web.Event event) {
      final files = input.files;
      if (files == null || files.length == 0) {
        if (!completer.isCompleted) completer.complete(null);
        return;
      }
      final file = files.item(0);
      if (file == null) {
        if (!completer.isCompleted) completer.complete(null);
        return;
      }

      final reader = web.FileReader();
      reader.readAsDataURL(file);

      reader.addEventListener(
        'load',
        (web.Event _) {
          if (!completer.isCompleted) {
            final result = reader.result;
            completer.complete(
              result.isA<JSString>() ? (result as JSString).toDart : null,
            );
          }
        }.toJS,
      );

      reader.addEventListener(
        'error',
        (web.Event _) {
          if (!completer.isCompleted) completer.complete(null);
        }.toJS,
      );
    }.toJS,
  );

  // 파일 선택 창이 닫혔지만 change 이벤트가 오지 않는 경우 대비
  // [개발자] {'once': true} → web.AddEventListenerOptions으로 전달
  web.window.addEventListener(
    'focus',
    (web.Event _) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (!completer.isCompleted) completer.complete(null);
      });
    }.toJS,
    web.AddEventListenerOptions(once: true),
  );

  return completer.future;
}
