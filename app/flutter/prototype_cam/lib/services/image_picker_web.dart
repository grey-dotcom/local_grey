// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:async';

/// Web 환경에서 이미지 파일을 선택하여 base64 data URL로 반환
Future<String?> pickImageWeb() async {
  final completer = Completer<String?>();

  final input = html.FileUploadInputElement()
    ..accept = 'image/*'
    ..click();

  input.onChange.listen((event) {
    final files = input.files;
    if (files == null || files.isEmpty) {
      completer.complete(null);
      return;
    }
    final file = files.first;
    final reader = html.FileReader();
    reader.readAsDataUrl(file);
    reader.onLoad.listen((_) {
      completer.complete(reader.result as String?);
    });
    reader.onError.listen((_) {
      completer.complete(null);
    });
  });

  // 파일 선택 창이 닫혔지만 onChange 안 불릴 경우 대비
  html.document.body?.onFocus.first.then((_) {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!completer.isCompleted) completer.complete(null);
    });
  });

  return completer.future;
}
