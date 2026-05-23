import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A glassmorphic panel with backdrop blur and chromatic aberration edges.
///
/// The chromatic aberration effect creates a subtle rainbow fringe around
/// the panel edges — red/magenta on one side, blue/cyan on the opposite,
/// simulating light splitting through a prism.
class GlassmorphicPanel extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final double blurSigma;
  final bool showChromaticAberration;
  final double? width;
  final double? height;

  const GlassmorphicPanel({
    super.key,
    required this.child,
    this.borderRadius = 24,
    this.padding = const EdgeInsets.all(24),
    this.blurSigma = 20,
    this.showChromaticAberration = true,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ── Chromatic aberration glow layers ──
        if (showChromaticAberration) ...[
          // Red/magenta shift (offset top-left)
          Positioned(
            left: -2,
            top: -2,
            right: 2,
            bottom: 2,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius + 2),
                border: Border.all(
                  color: AppColors.chromaRed,
                  width: 1.5,
                ),
              ),
            ),
          ),
          // Green shift (centered, slightly larger)
          Positioned(
            left: -1,
            top: 1,
            right: -1,
            bottom: -1,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius + 1),
                border: Border.all(
                  color: AppColors.chromaGreen,
                  width: 1,
                ),
              ),
            ),
          ),
          // Blue/cyan shift (offset bottom-right)
          Positioned(
            left: 2,
            top: 2,
            right: -2,
            bottom: -2,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius + 2),
                border: Border.all(
                  color: AppColors.chromaBlue,
                  width: 1.5,
                ),
              ),
            ),
          ),
          // Violet accent
          Positioned(
            left: 0,
            top: -1,
            right: 0,
            bottom: 1,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius + 1),
                border: Border.all(
                  color: AppColors.chromaViolet,
                  width: 0.8,
                ),
              ),
            ),
          ),
        ],
        // ── Main glass panel ──
        ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(
              sigmaX: blurSigma,
              sigmaY: blurSigma,
            ),
            child: Container(
              width: width,
              height: height,
              padding: padding,
              decoration: BoxDecoration(
                color: AppColors.glassBackground,
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(
                  color: AppColors.glassBorder,
                  width: 1,
                ),
              ),
              child: child,
            ),
          ),
        ),
      ],
    );
  }
}
