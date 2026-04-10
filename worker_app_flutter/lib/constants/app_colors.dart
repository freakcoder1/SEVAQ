import 'package:flutter/material.dart';

/// Semantic color tokens for consistent theming across the app
class AppColors {
  AppColors._();

  // ==================== PRIMARY COLORS ====================

  /// Primary brand color - Green
  static const Color primary = Color(0xFF2E7D32);

  /// Darker variant for pressed states, app bar
  static const Color primaryDark = Color(0xFF1B5E20);

  /// Lighter variant for backgrounds, hover states
  static const Color primaryLight = Color(0xFF4CAF50);

  /// Surface tint for primary elements
  static const Color primarySurface = Color(0xFFE8F5E9);

  // ==================== ACCENT COLORS ====================

  /// Teal accent for highlights, links
  static const Color accent = Color(0xFF00BFA5);

  /// Surface tint for accent elements
  static const Color accentSurface = Color(0xFFE0F2F1);

  // ==================== STATUS COLORS ====================

  // Success
  static const Color success = Color(0xFF388E3C);
  static const Color successSurface = Color(0xFFE8F5E9);

  // Warning
  static const Color warning = Color(0xFFF57C00);
  static const Color warningSurface = Color(0xFFFFF3E0);

  // Error
  static const Color error = Color(0xFFD32F2F);
  static const Color errorSurface = Color(0xFFFFEBEE);

  // Info
  static const Color info = Color(0xFF1976D2);
  static const Color infoSurface = Color(0xFFE3F2FD);

  // Pending (orange)
  static const Color pending = Color(0xFFFF9800);
  static const Color pendingSurface = Color(0xFFFFF3E0);

  // In Progress (purple)
  static const Color inProgress = Color(0xFF7B1FA2);
  static const Color inProgressSurface = Color(0xFFF3E5F5);

  // Confirmed (blue)
  static const Color confirmed = Color(0xFF1976D2);
  static const Color confirmedSurface = Color(0xFFE3F2FD);

  // Completed (green)
  static const Color completed = Color(0xFF388E3C);
  static const Color completedSurface = Color(0xFFE8F5E9);

  // Cancelled/Rejected (red)
  static const Color cancelled = Color(0xFFD32F2F);
  static const Color cancelledSurface = Color(0xFFFFEBEE);

  // ==================== NEUTRAL COLORS ====================

  /// Background color for screens
  static const Color background = Color(0xFFF5F5F5);

  /// Surface color for cards, dialogs
  static const Color surface = Color(0xFFFFFFFF);

  /// Variant surface for subtle differentiation
  static const Color surfaceVariant = Color(0xFFFAFAFA);

  /// Border color for dividers, input fields
  static const Color border = Color(0xFFE0E0E0);

  /// Primary text color
  static const Color textPrimary = Color(0xFF212121);

  /// Secondary text color (labels, subtitles)
  static const Color textSecondary = Color(0xFF757575);

  /// Disabled text color
  static const Color textDisabled = Color(0xFFBDBDBD);

  /// Hint text color
  static const Color textHint = Color(0xFF9E9E9E);

  // ==================== GRADIENT COLORS ====================

  /// Primary gradient start
  static const Color gradientPrimaryStart = Color(0xFF2E7D32);

  /// Primary gradient end
  static const Color gradientPrimaryEnd = Color(0xFF4CAF50);

  /// Success gradient
  static const Color gradientSuccessStart = Color(0xFF388E3C);
  static const Color gradientSuccessEnd = Color(0xFF66BB6A);

  /// Warning gradient
  static const Color gradientWarningStart = Color(0xFFF57C00);
  static const Color gradientWarningEnd = Color(0xFFFFB74D);

  // ==================== SHADOW COLORS ====================

  /// Default shadow color
  static const Color shadow = Color(0x1F000000);

  /// Light shadow for subtle elevation
  static const Color shadowLight = Color(0x0F000000);

  /// Dark shadow for prominent elements
  static const Color shadowDark = Color(0x3F000000);

  // ==================== HELPER METHODS ====================

  /// Get color with opacity
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  /// Get status color based on booking status
  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'REQUESTED':
        return pending;
      case 'CONFIRMED':
        return confirmed;
      case 'IN_PROGRESS':
      case 'ACCEPTED':
        return inProgress;
      case 'COMPLETED':
        return completed;
      case 'CANCELLED':
      case 'REJECTED':
        return cancelled;
      default:
        return textSecondary;
    }
  }

  /// Get status surface color
  static Color getStatusSurfaceColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'REQUESTED':
        return pendingSurface;
      case 'CONFIRMED':
        return confirmedSurface;
      case 'IN_PROGRESS':
      case 'ACCEPTED':
        return inProgressSurface;
      case 'COMPLETED':
        return completedSurface;
      case 'CANCELLED':
      case 'REJECTED':
        return cancelledSurface;
      default:
        return surfaceVariant;
    }
  }
}
