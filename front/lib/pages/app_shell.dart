import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/sidebar_menu.dart';
import 'live_map_page.dart';
import 'edit_mode_page.dart';
import 'ai_assistant_page.dart';

/// Main application shell with collapsible sidebar and content area.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  final List<Widget> _pages = const [
    LiveMapPage(),
    EditModePage(),
    AiAssistantPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.voidBlack,
      body: Row(
        children: [
          // ── Sidebar ──
          SidebarMenu(
            selectedIndex: _selectedIndex,
            onItemSelected: (index) {
              setState(() => _selectedIndex = index);
            },
          ),
          // ── Content Area ──
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _pages[_selectedIndex],
            ),
          ),
        ],
      ),
    );
  }
}
