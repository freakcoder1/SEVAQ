import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // DEEP GREEN PRIMARY (Trust, Safety, Grounded)
  static const Color primaryColor = Color(0xFF2E7D32); // Deep Green
  static const Color onPrimary = Colors.white;
  static const Color primaryContainer = Color(0xFFE8F5E9); // Light Green
  static const Color onPrimaryContainer = Color(0xFF1B5E20); // Dark Green

  // SECONDARY GREY (Support, Calm)
  static const Color secondaryColor = Color(0xFF535F70); // Support Grey
  static const Color onSecondary = Colors.white;
  static const Color secondaryContainer = Color(0xFFE6E9ED); // Light Grey
  static const Color onSecondaryContainer = Color(0xFF3A4657); // Dark Grey

  // INFO BLUE (Information only, not primary)
  static const Color infoColor = Color(0xFF0061A4); // Blue for info
  static const Color onInfo = Colors.white;
  static const Color infoContainer = Color(0xFFE3F2FD); // Light Blue
  static const Color onInfoContainer = Color(0xFF0D47A1); // Dark Blue

  // BACKGROUND & SURFACE (Warm Neutrals)
  static const Color backgroundColor = Color(0xFFFEFBFF); // Warm White
  static const Color surfaceColor = Color(0xFFFEFBFF); // Warm Surface
  static const Color surfaceVariant = Color(0xFFF5F7FA); // Subtle Depth
  static const Color onSurface = Color(0xFF1A1C1E); // Dark Charcoal
  static const Color onSurfaceVariant = Color(0xFF41484D); // Medium Grey
  static const Color secondaryText = Color(0xFF6B7280); // Soft Grey

  // SEMANTIC COLORS
  static const Color successColor = Color(0xFF2E7D32); // Confident Green
  static const Color errorColor = Color(0xFFBA1A1A); // Clear Warning
  static const Color warningColor = Color(0xFFEF6C00); // Attention
  static const Color infoTextColor = Color(0xFF0277BD); // Guidance

  // ACCENT COLORS
  static const Color tertiaryColor = Color(0xFF6B5778); // Premium Purple

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
        tertiary: tertiaryColor,
        onTertiary: Colors.white,
        tertiaryContainer: Color(0xFFF2DAFF),
        onTertiaryContainer: Color(0xFF251431),
        error: errorColor,
        onError: Colors.white,
        errorContainer: Color(0xFFFFDAD6),
        onErrorContainer: Color(0xFF410002),
        surface: surfaceColor,
        onSurface: onSurface,
        surfaceContainerHighest: Color(0xFFDDE3EA),
        onSurfaceVariant: onSurfaceVariant,
        outline: Color(0xFF71787E),
        outlineVariant: Color(0xFFC1C7CE),
        shadow: shadowColor,
        scrim: Colors.black,
        inverseSurface: Color(0xFF2E3133),
        onInverseSurface: Color(0xFFF0F0F4),
        inversePrimary: Color(0xFF9ECAFF),
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
          foregroundColor: infoColor,
          textStyle: _googleFontTextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: infoColor,
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
        focusColor: primaryColor.withOpacity(0.25),
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
        focusColor: Color(0xFF9ECAFF).withOpacity(0.25),
      ),
    );
  }
}
