import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/capture_provider.dart';
import 'providers/report_provider.dart';
import 'screens/task_list_screen.dart';
import 'utils/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CaptureProvider()..loadTasks()),
        ChangeNotifierProvider(create: (_) => ReportProvider()),
      ],
      child: MaterialApp(
        title: 'Keeper Screenshot',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        home: const TaskListScreen(),
      ),
    );
  }
}
