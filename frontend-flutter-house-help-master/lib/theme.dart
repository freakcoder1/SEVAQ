import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF0061A4); // Modern Blue
  static const Color accentColor = Color(0xFF535F70); // Secondary Grey
  static const Color tertiaryColor = Color(0xFF6B5778); // Tertiary Purple
  static const Color backgroundColor = Color(0xFFFEFBFF); // Light Background
  static const Color surfaceColor = Color(0xFFFEFBFF); // Light Surface
  static const Color errorColor = Color(0xFFBA1A1A); // Error Red

  // Helper method to create Google Fonts text styles
  static TextStyle _googleFontTextStyle({
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
  }) {
    return TextStyle(
      fontFamily: 'Outfit',
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
        onPrimary: Colors.white,
        primaryContainer: Color(0xFFD1E4FF),
        onPrimaryContainer: Color(0xFF001D36),
        secondary: accentColor,
        onSecondary: Colors.white,
        secondaryContainer: Color(0xFFD7E3F7),
        onSecondaryContainer: Color(0xFF101C2B),
        tertiary: tertiaryColor,
        onTertiary: Colors.white,
        tertiaryContainer: Color(0xFFF2DAFF),
        onTertiaryContainer: Color(0xFF251431),
        error: errorColor,
        onError: Colors.white,
        errorContainer: Color(0xFFFFDAD6),
        onErrorContainer: Color(0xFF410002),
        surface: surfaceColor,
        onSurface: Color(0xFF1A1C1E),
        surfaceVariant: Color(0xFFDDE3EA),
        onSurfaceVariant: Color(0xFF41484D),
        outline: Color(0xFF71787E),
        outlineVariant: Color(0xFFC1C7CE),
        shadow: Colors.black,
        scrim: Colors.black,
        inverseSurface: Color(0xFF2E3133),
        onInverseSurface: Color(0xFFF0F0F4),
        inversePrimary: Color(0xFF9ECAFF),
        surfaceTint: primaryColor,
      ),
      textTheme: TextTheme(
        displayLarge: _googleFontTextStyle(fontSize: 57, fontWeight: FontWeight.w400),
        displayMedium: _googleFontTextStyle(fontSize: 45, fontWeight: FontWeight.w400),
        displaySmall: _googleFontTextStyle(fontSize: 36, fontWeight: FontWeight.w400),
        headlineLarge: _googleFontTextStyle(fontSize: 32, fontWeight: FontWeight.w400),
        headlineMedium: _googleFontTextStyle(fontSize: 28, fontWeight: FontWeight.w400),
        headlineSmall: _googleFontTextStyle(fontSize: 24, fontWeight: FontWeight.w400),
        titleLarge: _googleFontTextStyle(fontSize: 22, fontWeight: FontWeight.w500),
        titleMedium: _googleFontTextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        titleSmall: _googleFontTextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        labelLarge: _googleFontInterTextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        labelMedium: _googleFontInterTextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        labelSmall: _googleFontInterTextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        bodyLarge: _googleFontInterTextStyle(fontSize: 16, fontWeight: FontWeight.w400),
        bodyMedium: _googleFontInterTextStyle(fontSize: 14, fontWeight: FontWeight.w400),
        bodySmall: _googleFontInterTextStyle(fontSize: 12, fontWeight: FontWeight.w400),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceColor,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF1A1C1E)),
        titleTextStyle: _googleFontTextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w500,
          color: Color(0xFF1A1C1E),
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
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Color(0xFFDDE3EA),
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
        surfaceVariant: Color(0xFF41484D),
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
        displayLarge: _googleFontTextStyle(fontSize: 57, fontWeight: FontWeight.w400),
        displayMedium: _googleFontTextStyle(fontSize: 45, fontWeight: FontWeight.w400),
        displaySmall: _googleFontTextStyle(fontSize: 36, fontWeight: FontWeight.w400),
        headlineLarge: _googleFontTextStyle(fontSize: 32, fontWeight: FontWeight.w400),
        headlineMedium: _googleFontTextStyle(fontSize: 28, fontWeight: FontWeight.w400),
        headlineSmall: _googleFontTextStyle(fontSize: 24, fontWeight: FontWeight.w400),
        titleLarge: _googleFontTextStyle(fontSize: 22, fontWeight: FontWeight.w500),
        titleMedium: _googleFontTextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        titleSmall: _googleFontTextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        labelLarge: _googleFontInterTextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        labelMedium: _googleFontInterTextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        labelSmall: _googleFontInterTextStyle(fontSize: 11, fontWeight: FontWeight.w500),
        bodyLarge: _googleFontInterTextStyle(fontSize: 16, fontWeight: FontWeight.w400),
        bodyMedium: _googleFontInterTextStyle(fontSize: 14, fontWeight: FontWeight.w400),
        bodySmall: _googleFontInterTextStyle(fontSize: 12, fontWeight: FontWeight.w400),
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
          ),
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
      ),
    );
  }
}
