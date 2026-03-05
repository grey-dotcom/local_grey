import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/capture_provider.dart';
import 'screens/capture_screen.dart';
import 'utils/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CaptureProvider()..loadTasks(),
      child: MaterialApp(
        title: 'Keeper Cam',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        // 반응형: 고정 프레임 없이 화면 100% 사용
        home: const CaptureScreen(),
      ),
    );
  }
}
