import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // SEVAQ BRAND COLORS - V1 SPECIFICATION

  // Core Neutrals (≥85% of any screen)
  static const Color charcoalBlack = Color(
    0xFF111111,
  ); // Primary text, headers, logo
  static const Color fogWhite = Color(0xFFF7F8F7); // Backgrounds, main surfaces
  static const Color stoneGray = Color(
    0xFFE6E8E7,
  ); // Secondary surfaces, borders, disabled states

  // Primary Accent (≈10% max) - Emerald Infrastructure Green
  // Reduced saturation by 4% for managed luxury feel
  static const Color emeraldGreen = Color(
    0xFF2A655A,
  ); // Primary CTA, active selection, system confidence signals (desaturated)
  static const Color emeraldGreenPressed = Color(
    0xFF18554B,
  ); // Hover/pressed state
  static const Color softGreen = Color(
    0xFFEAF4F1,
  ); // Soft green for backgrounds

  // Functional Colors (≤5% combined, state-only)
  static const Color warningColor = Color(0xFFD98C00); // Warning
  static const Color errorColor = Color(
    0xFFD64545,
  ); // Error / destructive actions
  static const Color successColor = Color(0xFF2E8B57); // Success

  // Theme Color Properties
  static const Color primaryColor = emeraldGreen;
  static const Color onPrimary = Colors.white;
  static const Color primaryContainer = softGreen;
  static const Color onPrimaryContainer = Color(
    0xFF111111,
  ); // Dark text on container

  // Secondary Colors (using core neutrals)
  static const Color secondaryColor = stoneGray;
  static const Color onSecondary = charcoalBlack;
  static const Color secondaryContainer = Color(0xFFF0F1EF); // Very light gray
  static const Color onSecondaryContainer = Color(0xFF333537); // Dark gray text

  // BACKGROUND & SURFACE
  static const Color backgroundColor = fogWhite;
  static const Color surfaceColor = Colors.white;
  static const Color surfaceVariant = stoneGray;
  static const Color onSurface = charcoalBlack;
  static const Color onSurfaceVariant = Color(0xFF5F6361); // Medium gray
  static const Color secondaryText = Color(0xFF8A8F8D); // Muted gray text

  // BACKWARD COMPATIBILITY ALIASES
  static const Color deepTeal = emeraldGreen; // Legacy alias
  static const Color textPrimary = charcoalBlack; // Legacy alias
  static const Color textSecondary = secondaryText; // Legacy alias
  static const Color muted = secondaryText; // Legacy alias
  static const Color background = backgroundColor; // Legacy alias
  static const Color surface = surfaceColor; // Legacy alias
  static const Color border = stoneGray; // Legacy alias

  // TONAL HIERARCHY - Phase 4 Refinement
  static const Color secondarySurface = Color(0xFFFAFAF8); // Secondary surfaces
  static const Color warmWhite = Color(0xFFF7F8F7); // Warmer background

  // ATMOSPHERIC GRADIENTS - Phase 4 Refinement
  static const RadialGradient heroDepthGradient = RadialGradient(
    center: Alignment.topRight,
    radius: 1.2,
    colors: [
      Color(0x33FFFFFF), // 20% white for depth
      Colors.transparent,
    ],
    stops: [0.0, 1.0],
  );

  static const RadialGradient operationalGlow = RadialGradient(
    center: Alignment.center,
    radius: 0.8,
    colors: [
      Color(0x1A1F6B5F), // 10% emerald glow
      Colors.transparent,
    ],
    stops: [0.0, 1.0],
  );

  // SHADOWS & DEPTH
  static const Color shadowColor = Colors.black;

  // ENHANCED SHADOWS - Phase 4 Refinement
  static List<BoxShadow> get cardShadowEnhanced => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.04),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> get heroShadowEnhanced => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.06),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];

  static List<BoxShadow> get floatingNavShadowEnhanced => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 28,
      offset: const Offset(0, 6),
    ),
  ];

  // GRADIENTS (Background Oxygen - <8% opacity)
  static const LinearGradient subtleBackgroundGradient = LinearGradient(
    colors: [
      Colors.transparent,
      Colors.black12, // <8% opacity
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // HERO GRADIENT - Subtle premium emerald (for operational status surface)
  // Very subtle tonal shift - elegant, calm, premium
  static const LinearGradient heroGradient = LinearGradient(
    colors: [
      Color(0xFF1D5247), // Deep muted emerald (top-left)
      Color(0xFF1F6B5F), // Primary emerald (bottom-right)
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 1.0],
  );

  // SHADOWS - Premium soft shadows (blur: 24, opacity: 0.04, y: 8)
  static const List<BoxShadow> cardShadow = [
    BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, 8)),
  ];

  static const List<BoxShadow> heroShadow = [
    BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, 8)),
  ];

  static const List<BoxShadow> floatingNavShadow = [
    BoxShadow(color: Colors.black12, blurRadius: 24, offset: Offset(0, 8)),
  ];

  // SPACING SYSTEM - V1 SPECIFICATION (4px base unit)
  // All spacing MUST derive from: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
  static const double spacing4 = 4.0;
  static const double spacing8 = 8.0;
  static const double spacing12 = 12.0;
  static const double spacing16 = 16.0;
  static const double spacing20 = 20.0;
  static const double spacing24 = 24.0;
  static const double spacing32 = 32.0;
  static const double spacing40 = 40.0;
  static const double spacing48 = 48.0;
  static const double spacing64 = 64.0;

  // Helper method to create Google Fonts text styles
  static TextStyle _googleFontTextStyle({
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
  }) {
    return TextStyle(
      fontFamily: 'Inter',
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
  }

  static TextStyle _googleFontInterTextStyle({
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
  }) {
    return TextStyle(
      fontFamily: 'Inter',
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: ColorScheme(
        brightness: Brightness.light,
        primary: primaryColor,
        onPrimary: onPrimary,
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        secondary: secondaryColor,
        onSecondary: onSecondary,
        secondaryContainer: secondaryContainer,
        onSecondaryContainer: onSecondaryContainer,
        tertiary: stoneGray, // Using neutral as tertiary
        onTertiary: charcoalBlack,
        tertiaryContainer: stoneGray,
        onTertiaryContainer: charcoalBlack,
        error: errorColor,
        onError: Colors.white,
        errorContainer: Color(0xFFF5D6D4), // Light rust container
        onErrorContainer: Color(0xFF4C1510), // Dark rust text
        surface: surfaceColor,
        onSurface: onSurface,
        surfaceContainerHighest: stoneGray,
        onSurfaceVariant: onSurfaceVariant,
        outline: Color(0xFFA0A3A5), // Neutral outline
        outlineVariant: Color(0xFFC5C7C4), // Subtle outline
        shadow: charcoalBlack,
        scrim: Colors.black,
        inverseSurface: Color(0xFF222426),
        onInverseSurface: fogWhite,
        inversePrimary: Color(0xFF8FB8B8), // Light teal for inverse
        surfaceTint: primaryColor,
      ),
      textTheme: TextTheme(
        // V1 Spec: Display Large - 48px, w700, -2% letter spacing
        displayLarge: _googleFontTextStyle(
          fontSize: 48,
          fontWeight: FontWeight.w700,
          color: onSurface,
        ),
        displayMedium: _googleFontTextStyle(
          fontSize: 45,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        // V1 Spec: Display Small - 36px, w700, -1% letter spacing
        displaySmall: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: onSurface,
        ),
        // V1 Spec: H1 - 36px, w700, -1% letter spacing
        headlineLarge: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: onSurface,
        ),
        // V1 Spec: H2 - 28px, w700
        headlineMedium: _googleFontTextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: onSurface,
        ),
        // V1 Spec: H3 - 22px, w600 (closest to w650)
        headlineSmall: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: onSurface,
        ),
        titleLarge: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w500,
          color: onSurface,
        ),
        titleMedium: _googleFontTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: onSurface,
        ),
        titleSmall: _googleFontTextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: onSurface,
        ),
        labelLarge: _googleFontInterTextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: onSurfaceVariant,
        ),
        labelMedium: _googleFontInterTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: onSurfaceVariant,
        ),
        labelSmall: _googleFontInterTextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: onSurfaceVariant,
        ),
        // V1 Spec: Body Large - 18px, w500
        bodyLarge: _googleFontInterTextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: onSurface,
        ),
        // V1 Spec: Body - 16px, w400 (closest to w450)
        bodyMedium: _googleFontInterTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        bodySmall: _googleFontInterTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceColor,
        elevation: 0,
        iconTheme: IconThemeData(color: onSurface),
        titleTextStyle: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w500,
          color: onSurface,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: onPrimary,
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: _googleFontTextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: onPrimary,
          ),
          // V1 Motion - Fast 120ms
          animationDuration: Duration(milliseconds: 120),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: secondaryColor,
          side: BorderSide(color: secondaryColor),
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: _googleFontTextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: secondaryColor,
          ),
          // V1 Motion - Fast 120ms
          animationDuration: Duration(milliseconds: 120),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: deepTeal,
          textStyle: _googleFontTextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: deepTeal,
          ),
          // V1 Motion - Fast 120ms
          animationDuration: Duration(milliseconds: 120),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: Color(0xFF71787E)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: Color(0xFF71787E)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        // Focus ring for accessibility
        focusColor: primaryColor.withValues(alpha: 0.25),
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ), // V1 Spec: Cards 24px
        margin: EdgeInsets.all(8),
        clipBehavior: Clip.antiAlias,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceVariant,
        selectedColor: primaryContainer,
        disabledColor: Color(0xFFA1A5A8),
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        labelStyle: _googleFontTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: onSurfaceVariant,
        ),
        secondaryLabelStyle: _googleFontTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: onPrimaryContainer,
        ),
        brightness: Brightness.light,
      ),
      // Custom animations for calm transitions
      pageTransitionsTheme: PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.fuchsia: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: Color(0xFF0F1419), // Dark background
      colorScheme: ColorScheme(
        brightness: Brightness.dark,
        primary: Color(0xFF9ECAFF),
        onPrimary: Color(0xFF003257),
        primaryContainer: Color(0xFF00497D),
        onPrimaryContainer: Color(0xFFD1E4FF),
        secondary: Color(0xFFBBC7DB),
        onSecondary: Color(0xFF253140),
        secondaryContainer: Color(0xFF3B4858),
        onSecondaryContainer: Color(0xFFD7E3F7),
        tertiary: Color(0xFFDEBCDF),
        onTertiary: Color(0xFF3B2948),
        tertiaryContainer: Color(0xFF523F5F),
        onTertiaryContainer: Color(0xFFF2DAFF),
        error: Color(0xFFFFB4AB),
        onError: Color(0xFF690005),
        errorContainer: Color(0xFF93000A),
        onErrorContainer: Color(0xFFFFDAD6),
        surface: Color(0xFF0F1419),
        onSurface: Color(0xFFE0E2E8),
        surfaceContainerHighest: Color(0xFF41484D),
        onSurfaceVariant: Color(0xFFC1C7CE),
        outline: Color(0xFF8B9198),
        outlineVariant: Color(0xFF41484D),
        shadow: Colors.black,
        scrim: Colors.black,
        inverseSurface: Color(0xFFE0E2E8),
        onInverseSurface: Color(0xFF2E3133),
        inversePrimary: Color(0xFF0061A4),
        surfaceTint: Color(0xFF9ECAFF),
      ),
      textTheme: TextTheme(
        // V1 Spec: Display Large - 48px, w700
        displayLarge: _googleFontTextStyle(
          fontSize: 48,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE0E2E8),
        ),
        displayMedium: _googleFontTextStyle(
          fontSize: 45,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        // V1 Spec: Display Small - 36px, w700
        displaySmall: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE0E2E8),
        ),
        // V1 Spec: H1 - 36px, w700
        headlineLarge: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE0E2E8),
        ),
        // V1 Spec: H2 - 28px, w700
        headlineMedium: _googleFontTextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE0E2E8),
        ),
        // V1 Spec: H3 - 22px, w600
        headlineSmall: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: Color(0xFFE0E2E8),
        ),
        titleLarge: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE0E2E8),
        ),
        titleMedium: _googleFontTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE0E2E8),
        ),
        titleSmall: _googleFontTextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE0E2E8),
        ),
        labelLarge: _googleFontInterTextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Color(0xFFC1C7CE),
        ),
        labelMedium: _googleFontInterTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Color(0xFFC1C7CE),
        ),
        labelSmall: _googleFontInterTextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: Color(0xFFC1C7CE),
        ),
        // V1 Spec: Body Large - 18px, w500
        bodyLarge: _googleFontInterTextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE0E2E8),
        ),
        // V1 Spec: Body - 16px, w400
        bodyMedium: _googleFontInterTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        bodySmall: _googleFontInterTextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Color(0xFF0F1419),
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFFE0E2E8)),
        titleTextStyle: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w500,
          color: Color(0xFFE0E2E8),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: _googleFontTextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.white,
          ),
          // V1 Motion - Fast 120ms
          animationDuration: Duration(milliseconds: 120),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF41484D),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: Color(0xFF8B9198)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: Color(0xFF8B9198)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16), // V1 Spec: Inputs 16px
          borderSide: BorderSide(color: Color(0xFF9ECAFF), width: 2),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        // Focus ring for accessibility
        focusColor: Color(0xFF9ECAFF).withValues(alpha: 0.25),
      ),
    );
  }
}
