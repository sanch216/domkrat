import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography scale inspired by Mapbox's Cera Pro usage.
/// Uses DM Sans (Google Fonts) as the primary substitute.
class AppTypography {
  AppTypography._();

  static String get _fontFamily => GoogleFonts.dmSans().fontFamily!;

  // ── Display ──
  static TextStyle display = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 68,
    fontWeight: FontWeight.w700,
    height: 1.0,
    letterSpacing: -1.36,
    color: AppColors.white,
  );

  // ── Heading Large ──
  static TextStyle headingLg = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 44,
    fontWeight: FontWeight.w700,
    height: 1.14,
    letterSpacing: -0.88,
    color: AppColors.white,
  );

  // ── Heading ──
  static TextStyle heading = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.25,
    color: AppColors.white,
  );

  // ── Heading Small ──
  static TextStyle headingSm = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.33,
    color: AppColors.white,
  );

  // ── Subheading ──
  static TextStyle subheading = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w500,
    height: 1.4,
    color: AppColors.fog,
  );

  // ── Body ──
  static TextStyle body = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.fog,
  );

  // ── Body Small ──
  static TextStyle bodySm = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.43,
    color: AppColors.ash,
  );

  // ── Caption ──
  static TextStyle caption = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w700,
    height: 1.6,
    letterSpacing: 1.0,
    color: AppColors.slate,
  );

  // ── Button ──
  static TextStyle button = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w500,
    height: 1.33,
    color: AppColors.white,
  );

  // ── Label ──
  static TextStyle label = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.33,
    color: AppColors.fog,
  );
}
