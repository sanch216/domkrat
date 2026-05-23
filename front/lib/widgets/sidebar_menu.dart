import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Collapsible sidebar menu with glassmorphic effect.
class SidebarMenu extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const SidebarMenu({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  State<SidebarMenu> createState() => _SidebarMenuState();
}

class _SidebarMenuState extends State<SidebarMenu>
    with SingleTickerProviderStateMixin {
  bool _expanded = true;
  late AnimationController _animController;
  late Animation<double> _widthAnimation;

  static const double _expandedWidth = 240;
  static const double _collapsedWidth = 72;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _widthAnimation = Tween<double>(
      begin: _expandedWidth,
      end: _collapsedWidth,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOutCubic,
    ));
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _expanded = !_expanded;
      if (_expanded) {
        _animController.reverse();
      } else {
        _animController.forward();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _widthAnimation,
      builder: (context, _) {
        return Stack(
          children: [
            // ── Chromatic aberration border layers ──
            Positioned(
              left: -2,
              top: -1,
              bottom: 1,
              child: Container(
                width: _widthAnimation.value + 4,
                decoration: BoxDecoration(
                  border: Border(
                    right: BorderSide(
                      color: AppColors.chromaRed,
                      width: 1.2,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 0,
              top: 1,
              bottom: -1,
              child: Container(
                width: _widthAnimation.value + 2,
                decoration: BoxDecoration(
                  border: Border(
                    right: BorderSide(
                      color: AppColors.chromaBlue,
                      width: 1.2,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: -1,
              top: 0,
              bottom: 0,
              child: Container(
                width: _widthAnimation.value + 3,
                decoration: BoxDecoration(
                  border: Border(
                    right: BorderSide(
                      color: AppColors.chromaGreen,
                      width: 0.8,
                    ),
                  ),
                ),
              ),
            ),
            // ── Main glass panel ──
            ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                child: Container(
                  width: _widthAnimation.value,
                  decoration: BoxDecoration(
                    color: AppColors.voidBlack.withAlpha(180),
                    border: Border(
                      right: BorderSide(
                        color: AppColors.glassBorder,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 16),
                      // ── Logo / Toggle ──
                      _buildHeader(),
                      const SizedBox(height: 32),
                      // ── Menu items ──
                      _buildMenuItem(0, Icons.map_outlined, 'Карта'),
                      _buildMenuItem(1, Icons.edit_outlined, 'Редактирование'),
                      _buildMenuItem(2, Icons.smart_toy_outlined, 'AI Помощник'),
                      const Spacer(),
                      // ── Bottom section ──
                      _buildMenuItem(-1, Icons.home_outlined, 'На главную'),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Logo icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.signalBlue,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.air,
              color: AppColors.white,
              size: 22,
            ),
          ),
          if (_expanded) ...[
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'DOMKRAT',
                style: AppTypography.caption.copyWith(
                  color: AppColors.white,
                  letterSpacing: 2,
                  fontSize: 13,
                ),
              ),
            ),
          ],
          const Spacer(),
          GestureDetector(
            onTap: _toggle,
            child: Icon(
              _expanded
                  ? Icons.chevron_left_rounded
                  : Icons.chevron_right_rounded,
              color: AppColors.fog,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(int index, IconData icon, String label) {
    final isSelected = index == widget.selectedIndex;
    final isHome = index == -1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            if (isHome) {
              Navigator.of(context).pushReplacementNamed('/');
            } else {
              widget.onItemSelected(index);
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(
              horizontal: _expanded ? 12 : 14,
              vertical: 12,
            ),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.signalBlue.withAlpha(25)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: isSelected
                  ? Border.all(
                      color: AppColors.signalBlue.withAlpha(60),
                      width: 1,
                    )
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: isSelected
                      ? AppColors.signalBlue
                      : (isHome ? AppColors.ash : AppColors.fog),
                  size: 22,
                ),
                if (_expanded) ...[
                  const SizedBox(width: 12),
                  Text(
                    label,
                    style: AppTypography.bodySm.copyWith(
                      color: isSelected
                          ? AppColors.white
                          : (isHome ? AppColors.ash : AppColors.fog),
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
