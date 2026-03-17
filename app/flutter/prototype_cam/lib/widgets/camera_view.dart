import 'package:flutter/material.dart';

/// HtmlElementView로 VideoElement를 Flutter 위젯으로 래핑
class CameraView extends StatelessWidget {
  final String viewId;
  const CameraView({super.key, required this.viewId});

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: viewId);
  }
}
