import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Circular AQI indicator with animated gradient ring.
class AqiIndicator extends StatelessWidget {
  final int aqi;
  final double size;

  const AqiIndicator({
    super.key,
    required this.aqi,
    this.size = 100,
  });

  Color get _aqiColor {
    if (aqi <= 50) return AppColors.aqiGood;
    if (aqi <= 100) return AppColors.aqiModerate;
    if (aqi <= 200) return AppColors.aqiUnhealthy;
    return AppColors.aqiDangerous;
  }

  String get _aqiLabel {
    if (aqi <= 50) return 'Хорошо';
    if (aqi <= 100) return 'Умеренно';
    if (aqi <= 150) return 'Нездоровое';
    if (aqi <= 200) return 'Плохое';
    if (aqi <= 300) return 'Опасное';
    return 'Критичное';
  }

  @override
  Widget build(BuildContext context) {
    final progress = (aqi / 500).clamp(0.0, 1.0);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // ── Ring background ──
          CustomPaint(
            size: Size(size, size),
            painter: _AqiRingPainter(
              progress: progress,
              color: _aqiColor,
              trackColor: AppColors.steel,
            ),
          ),
          // ── Center content ──
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$aqi',
                style: AppTypography.heading.copyWith(
                  fontSize: size * 0.28,
                  color: _aqiColor,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'AQI',
                style: AppTypography.caption.copyWith(
                  fontSize: size * 0.1,
                  color: AppColors.ash,
                ),
              ),
              Text(
                _aqiLabel,
                style: AppTypography.caption.copyWith(
                  fontSize: size * 0.08,
                  color: _aqiColor.withAlpha(180),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AqiRingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color trackColor;

  _AqiRingPainter({
    required this.progress,
    required this.color,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 6;
    const strokeWidth = 6.0;

    // Track
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      progressPaint,
    );

    // Glow
    final glowPaint = Paint()
      ..color = color.withAlpha(40)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth + 8
      ..strokeCap = StrokeCap.round
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      glowPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _AqiRingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
