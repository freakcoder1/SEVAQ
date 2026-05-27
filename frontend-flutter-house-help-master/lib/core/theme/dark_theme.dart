import 'package:flutter/material.dart';

/// Dark theme for SevaQ - deep green-black for futuristic household infrastructure
class DarkTheme {
  static final ThemeData theme = ThemeData(
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF2A7A6A), // Muted emerald
      secondary: Color(0xFF3DB696),
      surface: Color(0xFF0A1A15), // Deep green-black
      onSurface: Color(0xFFE8F0ED),
      onPrimary: Colors.white,
    ),
    scaffoldBackgroundColor: const Color(0xFF0A1A15),
    cardColor: const Color(0xFF153028), // Fog gradient start
    canvasColor: const Color(0xFF0F251F), // Fog gradient end
  );

  // Dark theme gradients
  static const LinearGradient heroGradient = LinearGradient(
    colors: [
      Color(0xFF0D251F), // Deep muted emerald
      Color(0xFF12352A), // Richer teal
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Dark theme card gradient
  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF153028), Color(0xFF122822)],
    stops: [0.0, 1.0],
  );

  // Dark theme shadows
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.12),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  // Text styles for dark mode
  static TextStyle heroTitle = const TextStyle(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: Color(0xFFE8F0ED),
    height: 1.15,
    letterSpacing: -0.5,
  );

  static TextStyle sectionTitle = const TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: Color(0xFFE8F0ED),
    height: 1.2,
  );

  static TextStyle support = const TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: Color(0xFFB8C4C0),
    height: 1.2,
  );
}
