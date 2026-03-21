import 'package:flutter/material.dart';

class GradientHelper {
  // ✅ Acceptable: Very subtle background oxygen
  static BoxDecoration subtleBackgroundOxygen() {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          Colors.transparent,
          Colors.black.withValues(alpha: 0.05), // < 8% opacity
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ),
    );
  }

  // ✅ Acceptable: Very subtle depth gradients
  static BoxDecoration subtleDepthGradient(Color primaryColor) {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          primaryColor.withValues(alpha: 0.05), // < 8% opacity
          Colors.transparent,
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    );
  }

  // ✅ Acceptable: Card background gradients
  static BoxDecoration cardBackgroundGradient(Color surfaceColor) {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [surfaceColor, surfaceColor.withValues(alpha: 0.95)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ),
    );
  }

  // ❌ Not acceptable: Multiple hues, animation, emphasis
  // ❌ Not acceptable: Opacity > 8%
  // ❌ Not acceptable: Animated gradients

  // ✅ Acceptable: Static, single-hue gradients only
  static BoxDecoration staticSingleHueGradient(Color color) {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          color.withValues(alpha: 0.05), // Background oxygen level
          color.withValues(alpha: 0.02),
        ],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ),
    );
  }

  // ✅ Acceptable: Very subtle elevation gradients
  static BoxDecoration subtleElevationGradient() {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: [
          Colors.transparent,
          Colors.black.withValues(alpha: 0.03), // Very subtle shadow effect
        ],
        begin: Alignment.bottomCenter,
        end: Alignment.topCenter,
      ),
    );
  }
}
