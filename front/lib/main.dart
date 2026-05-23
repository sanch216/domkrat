import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'pages/landing_page.dart';
import 'pages/app_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DomkratApp());
}

class DomkratApp extends StatelessWidget {
  const DomkratApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Domkrat — Чистый воздух для Бишкека',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      initialRoute: '/',
      routes: {
        '/': (context) => const LandingPage(),
        '/app': (context) => const AppShell(),
      },
    );
  }
}
