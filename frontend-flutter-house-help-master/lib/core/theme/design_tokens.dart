import 'package:flutter/material.dart';

/// Design tokens for SevaQ's design system
class DesignTokens {
  // Spacing system
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 12.0;
  static const double spacingLg = 16.0;
  static const double spacingXl = 24.0;
  static const double spacingXxl = 32.0;

  // Border radius system
  static const double radiusSm = 12.0;
  static const double radiusMd = 20.0;
  static const double radiusLg = 28.0;
  static const double radiusFull = 999.0;

  // Shadow system
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.04),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> subtleShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.02),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> ambientShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.03),
      blurRadius: 16,
      offset: const Offset(0, 6),
    ),
  ];

  // Typography scale
  static TextStyle heroTitle = const TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    height: 1.15,
    letterSpacing: -0.5,
  );

  static TextStyle sectionTitle = const TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  static TextStyle label = const TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  static TextStyle support = const TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.2,
  );

  static TextStyle metadata = const TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    height: 1.2,
  );

  // Opacity system
  static const double opacityHigh = 0.92;
  static const double opacityMedium = 0.75;
  static const double opacityLow = 0.52;
  static const double opacityMuted = 0.35;

  // Animation durations
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationStandard = Duration(milliseconds: 200);
  static const Duration durationSlow = Duration(milliseconds: 300);
  static const Duration durationHero = Duration(seconds: 6);
  static const Duration durationAmbient = Duration(seconds: 12);

  // Dark mode color tokens
  static const Color cardDark = Color(0xFF153028);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF0A1A15);
  static const Color surfaceLight = Color(0xFFF6F7F5);
  static const Color primary = Color(0xFF2A655A);
  static const Color primaryContainerDark = Color(0xFF1A4A3A);

  // Warmer gray-green for metadata/subtitles (more organic than neutral gray)
  static const Color metadataGrayGreen = Color(0xFF5A6B62);
}
