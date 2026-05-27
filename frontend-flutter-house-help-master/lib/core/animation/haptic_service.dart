import 'package:flutter/services.dart';

/// Haptic service for premium tactile feedback
class HapticService {
  /// Light impact for tabs, toggles, lightweight buttons
  static Future<void> lightTap() async {
    await HapticFeedback.lightImpact();
  }

  /// Medium impact for booking confirmation, operation assigned, support activated
  static Future<void> mediumImpact() async {
    await HapticFeedback.mediumImpact();
  }

  /// Heavy impact for service completion, critical alerts
  static Future<void> heavyImpact() async {
    await HapticFeedback.heavyImpact();
  }

  /// Selection click for selection changes
  static Future<void> selectionClick() async {
    await HapticFeedback.selectionClick();
  }

  /// Success pattern - double tap for operation completion
  static Future<void> successPattern() async {
    await HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 50));
    await HapticFeedback.lightImpact();
  }

  /// Warning pattern for service delay alerts
  static Future<void> warningPattern() async {
    for (int i = 0; i < 3; i++) {
      await HapticFeedback.lightImpact();
      await Future.delayed(const Duration(milliseconds: 100));
    }
  }

  /// Map interaction types to haptics
  static Future<void> trigger(HapticType type) async {
    switch (type) {
      case HapticType.tab:
      case HapticType.toggle:
      case HapticType.lightButton:
        await lightTap();
        break;
      case HapticType.bookingConfirm:
      case HapticType.operationAssigned:
      case HapticType.supportActivated:
        await mediumImpact();
        break;
      case HapticType.serviceCompleted:
      case HapticType.professionalArrived:
      case HapticType.paymentSuccess:
        await successPattern();
        break;
      case HapticType.serviceDelay:
      case HapticType.warning:
        await warningPattern();
        break;
    }
  }
}

enum HapticType {
  tab,
  toggle,
  lightButton,
  bookingConfirm,
  operationAssigned,
  supportActivated,
  serviceCompleted,
  professionalArrived,
  paymentSuccess,
  serviceDelay,
  warning,
}
