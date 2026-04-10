import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_radius.dart';
import '../constants/app_spacing.dart';

/// A reusable status chip widget with consistent styling
class StatusChip extends StatelessWidget {
  final String status;
  final Color? color;
  final Color? surfaceColor;
  final double fontSize;
  final bool isCompact;

  const StatusChip({
    super.key,
    required this.status,
    this.color,
    this.surfaceColor,
    this.fontSize = 12,
    this.isCompact = false,
  });

  /// Create a status chip from booking status string
  factory StatusChip.fromBookingStatus(String status,
      {bool isCompact = false}) {
    return StatusChip(
      status: status,
      color: AppColors.getStatusColor(status),
      surfaceColor: AppColors.getStatusSurfaceColor(status),
      isCompact: isCompact,
    );
  }

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? AppColors.textSecondary;
    final chipSurface = surfaceColor ?? AppColors.surfaceVariant;
    final horizontalPadding = isCompact ? AppSpacing.sm : AppSpacing.smd;
    final verticalPadding = isCompact ? AppSpacing.xxs : AppSpacing.xs;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: chipSurface,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(
          color: chipColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Text(
        _formatStatus(status),
        style: TextStyle(
          color: chipColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  String _formatStatus(String status) {
    // Convert REQUESTED to Pending, CONFIRMED to Confirmed, etc.
    switch (status.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
      case 'REJECTED':
        return 'Cancelled';
      default:
        return status.split('_').map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1).toLowerCase();
        }).join(' ');
    }
  }
}
