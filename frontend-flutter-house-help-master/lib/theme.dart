import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // SEVAQ BRAND COLORS - FINAL & CLOSED

  // Core Neutrals (≥85% of any screen)
  static const Color charcoalBlack = Color(
    0xFF111315,
  ); // Primary text, headers, logo
  static const Color fogWhite = Color(0xFFF6F7F5); // Backgrounds, main surfaces
  static const Color stoneGray = Color(
    0xFFE4E6E3,
  ); // Secondary surfaces, borders, disabled states

  // Primary Accent (≈10% max)
  static const Color deepTeal = Color(
    0xFF2A5C5C,
  ); // Primary CTA, active selection, system confidence signals

  // Functional Colors (≤5% combined, state-only)
  static const Color controlledAmber = Color(0xFFB58B2E); // Pending / warning
  static const Color deepRust = Color(
    0xFF8C3B2E,
  ); // Error / destructive actions
  static const Color successGreen = Color(
    0xFF3A6B5F,
  ); // Final confirmation only

  // Theme Color Properties
  static const Color primaryColor = deepTeal;
  static const Color onPrimary = Colors.white;
  static const Color primaryContainer = Color(
    0xFFD6E4E0,
  ); // Light teal container
  static const Color onPrimaryContainer = Color(
    0xFF1A3C3C,
  ); // Dark teal text on container

  // Secondary Colors (using core neutrals)
  static const Color secondaryColor = stoneGray;
  static const Color onSecondary = charcoalBlack;
  static const Color secondaryContainer = Color(0xFFF0F1EF); // Very light gray
  static const Color onSecondaryContainer = Color(0xFF333537); // Dark gray text

  // BACKGROUND & SURFACE
  static const Color backgroundColor = fogWhite;
  static const Color surfaceColor = fogWhite;
  static const Color surfaceVariant = stoneGray;
  static const Color onSurface = charcoalBlack;
  static const Color onSurfaceVariant = Color(0xFF4A4C4E); // Medium gray
  static const Color secondaryText = Color(0xFF6C6E70); // Soft gray text

  // SEMANTIC COLORS
  static const Color successColor = successGreen;
  static const Color errorColor = deepRust;
  static const Color warningColor = controlledAmber;
  static const Color infoTextColor = deepTeal; // Using primary for info

  // NO ACCENT COLORS - Only use deepTeal as primary accent

  // SHADOWS & DEPTH
  static const Color shadowColor = Colors.black;

  // GRADIENTS (Background Oxygen - <8% opacity)
  static const LinearGradient subtleBackgroundGradient = LinearGradient(
    colors: [
      Colors.transparent,
      Colors.black12, // <8% opacity
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

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
        displayLarge: _googleFontTextStyle(
          fontSize: 57,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        displayMedium: _googleFontTextStyle(
          fontSize: 45,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        displaySmall: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        headlineLarge: _googleFontTextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        headlineMedium: _googleFontTextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        headlineSmall: _googleFontTextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w400,
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
        bodyLarge: _googleFontInterTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: onSurface,
        ),
        bodyMedium: _googleFontInterTextStyle(
          fontSize: 14,
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
          // Slow, confident animations
          animationDuration: Duration(milliseconds: 350),
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
          // Slow, confident animations
          animationDuration: Duration(milliseconds: 350),
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
          // Slow, confident animations
          animationDuration: Duration(milliseconds: 350),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF71787E)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF71787E)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        // Focus ring for accessibility
        focusColor: primaryColor.withValues(alpha: 0.25),
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
        displayLarge: _googleFontTextStyle(
          fontSize: 57,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        displayMedium: _googleFontTextStyle(
          fontSize: 45,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        displaySmall: _googleFontTextStyle(
          fontSize: 36,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        headlineLarge: _googleFontTextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        headlineMedium: _googleFontTextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        headlineSmall: _googleFontTextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w400,
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
        bodyLarge: _googleFontInterTextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Color(0xFFE0E2E8),
        ),
        bodyMedium: _googleFontInterTextStyle(
          fontSize: 14,
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
          // Slow, confident animations
          animationDuration: Duration(milliseconds: 350),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFF41484D),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF8B9198)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF8B9198)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Color(0xFF9ECAFF), width: 2),
        ),
        contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        // Focus ring for accessibility
        focusColor: Color(0xFF9ECAFF).withValues(alpha: 0.25),
      ),
    );
  }
}
