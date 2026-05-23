import 'dart:ui';

/// Mapbox-inspired dark color palette.
/// Void Black base with Signal Blue as the single chromatic accent.
class AppColors {
  AppColors._();

  // ── Neutral scale (dark → light) ──
  static const Color voidBlack = Color(0xFF0E1012);
  static const Color deepCharcoal = Color(0xFF15171B);
  static const Color gunmetal = Color(0xFF1C1F24);
  static const Color graphite = Color(0xFF23262D);
  static const Color steel = Color(0xFF333943);
  static const Color pewter = Color(0xFF444D5A);
  static const Color slate = Color(0xFF566171);
  static const Color ash = Color(0xFF8B96AA);
  static const Color fog = Color(0xFFA0AABA);
  static const Color silver = Color(0xFFBBC2CE);
  static const Color cloud = Color(0xFFD5DAE2);
  static const Color white = Color(0xFFFFFFFF);

  // ── Accent ──
  static const Color signalBlue = Color(0xFF007AFC);
  static const Color deepSignal = Color(0xFF0062CA);
  static const Color mapGreen = Color(0xFF228A56);

  // ── Semantic ──
  static const Color aqiGood = Color(0xFF4CAF50);
  static const Color aqiModerate = Color(0xFFFFC107);
  static const Color aqiUnhealthy = Color(0xFFFF9800);
  static const Color aqiDangerous = Color(0xFFE53935);

  // ── Surfaces ──
  static const Color surfaceVoidFloor = voidBlack;
  static const Color surfaceDeepPanel = deepCharcoal;
  static const Color surfaceRaised = gunmetal;
  static const Color surfaceOverlay = graphite;

  // ── Glassmorphism ──
  static const Color glassBackground = Color(0x2015171B);
  static const Color glassBorder = Color(0x30FFFFFF);

  // ── Chromatic aberration colors (for the rainbow edge effect) ──
  static const Color chromaRed = Color(0x40FF3386);
  static const Color chromaGreen = Color(0x4003E65B);
  static const Color chromaBlue = Color(0x40007AFC);
  static const Color chromaViolet = Color(0x406E60EE);
}
