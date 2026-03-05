// [미사용 파일] capture_screen.dart의 _ShutterButton(private)으로 대체됨.
// 디자인 가이드 반영 후 제거 예정. 불필요하면 삭제 가능.
import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

class ShutterButton extends StatelessWidget {
  final bool isCapturing;
  final bool isRecapture;
  final VoidCallback? onPressed;

  const ShutterButton({
    super.key,
    required this.isCapturing,
    required this.isRecapture,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isCapturing ? null : onPressed,
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          border: Border.all(color: AppTheme.blue, width: 4),
          boxShadow: [
            BoxShadow(
              color: AppTheme.blue.withAlpha(60),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Center(
          child: isCapturing
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: AppTheme.blue,
                    strokeWidth: 2.5,
                  ),
                )
              : isRecapture
                  ? const Text(
                      '재촬영',
                      style: TextStyle(
                        color: AppTheme.blue,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    )
                  : Container(
                      width: 60,
                      height: 60,
                      decoration: const BoxDecoration(
                        color: AppTheme.blue,
                        shape: BoxShape.circle,
                      ),
                    ),
        ),
      ),
    );
  }
}
