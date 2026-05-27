import 'package:flutter/material.dart';

/// Central motion controller for SevaQ's calm operational intelligence
class MotionController {
  // Timing constants for premium feel
  static const Duration heroGradient = Duration(seconds: 12);
  static const Duration heroGrain = Duration(seconds: 8);
  static const Duration heroBreathing = Duration(seconds: 6);
  static const Duration ctaHover = Duration(milliseconds: 150);
  static const Duration progressLine = Duration(milliseconds: 400);
  static const Duration etaMorph = Duration(milliseconds: 300);
  static const Duration statusCrossfade = Duration(milliseconds: 200);
  static const Duration navTransition = Duration(milliseconds: 200);
  static const Duration cardStagger = Duration(milliseconds: 100);

  // Curves for calm operational feel
  static const Curve standard = Curves.easeInOut;
  static const Curve emphasis = Curves.easeOutCubic;
  static const Curve subtle = Curves.easeInOutSine;

  /// Creates a gentle pulse animation for ambient effects
  static Animation<double> createPulseAnimation({
    required TickerProvider vsync,
    Duration duration = heroBreathing,
    double min = 0.0,
    double max = 1.0,
  }) {
    final controller = AnimationController(duration: duration, vsync: vsync);
    return Tween<double>(begin: min, end: max).animate(
      CurvedAnimation(parent: controller, curve: subtle),
    )..addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        controller.reverse();
      } else if (status == AnimationStatus.dismissed) {
        controller.forward();
      }
    });
  }

  /// Creates a slow gradient shift for environmental feel
  static Animation<double> createGradientAnimation({
    required TickerProvider vsync,
    Duration duration = heroGradient,
  }) {
    final controller = AnimationController(duration: duration, vsync: vsync);
    return Tween<double>(begin: -0.02, end: 0.02).animate(
      CurvedAnimation(parent: controller, curve: subtle),
    )..addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        controller.reverse();
      } else if (status == AnimationStatus.dismissed) {
        controller.forward();
      }
    });
  }
}
