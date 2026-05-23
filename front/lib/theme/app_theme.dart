import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_typography.dart';

/// Assembles the full ThemeData for the app.
class AppTheme {
  AppTheme._();

  static ThemeData get dark => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.voidBlack,
        canvasColor: AppColors.voidBlack,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.signalBlue,
          secondary: AppColors.deepSignal,
          surface: AppColors.deepCharcoal,
          error: AppColors.aqiDangerous,
          onPrimary: AppColors.white,
          onSecondary: AppColors.white,
          onSurface: AppColors.fog,
        ),
        textTheme: TextTheme(
          displayLarge: AppTypography.display,
          headlineLarge: AppTypography.headingLg,
          headlineMedium: AppTypography.heading,
          headlineSmall: AppTypography.headingSm,
          titleMedium: AppTypography.subheading,
          bodyLarge: AppTypography.body,
          bodyMedium: AppTypography.bodySm,
          labelLarge: AppTypography.button,
          labelSmall: AppTypography.caption,
        ),
        dividerColor: AppColors.gunmetal,
        cardColor: AppColors.deepCharcoal,
        iconTheme: const IconThemeData(color: AppColors.fog, size: 20),
        sliderTheme: SliderThemeData(
          activeTrackColor: AppColors.signalBlue,
          inactiveTrackColor: AppColors.steel,
          thumbColor: AppColors.signalBlue,
          overlayColor: AppColors.signalBlue.withAlpha(40),
          trackHeight: 4,
        ),
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.signalBlue;
            }
            return AppColors.pewter;
          }),
          trackColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppColors.signalBlue.withAlpha(80);
            }
            return AppColors.steel;
          }),
        ),
      );
}
