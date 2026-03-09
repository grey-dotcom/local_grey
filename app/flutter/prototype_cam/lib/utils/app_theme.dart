import 'package:flutter/material.dart';

class AppTheme {
  static const Color blue = Color(0xFF3B82F6);
  static const Color white = Color(0xFFFFFFFF);
  static const Color charcoal = Color(0xFF0F172A);
  static const Color gray = Color(0xFF64748B);
  static const Color lightGray = Color(0xFFF1F5F9);
  static const Color backgroundGray = Color(0xFFF8FAFC);

  static const String _font = 'Spoqa Han Sans Neo';

  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: _font,
      colorScheme: const ColorScheme.light(
        primary: blue,
        surface: white,
      ),
      scaffoldBackgroundColor: Colors.black,
      textTheme: const TextTheme(
        bodyLarge: TextStyle(fontFamily: _font, color: charcoal, fontSize: 16),
        bodyMedium: TextStyle(fontFamily: _font, color: charcoal, fontSize: 14),
        bodySmall: TextStyle(fontFamily: _font, color: gray, fontSize: 12),
      ),
    );
  }
}
