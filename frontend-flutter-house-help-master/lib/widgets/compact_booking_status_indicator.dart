import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../models/booking.dart';

/// Custom painter for animated wavy progress bar
class _AnimatedWavyProgressPainter extends CustomPainter {
  final double animationValue;
  final double progress;
  final Color color;
  final double strokeWidth;

  _AnimatedWavyProgressPainter({
    required this.animationValue,
    required this.progress,
    required this.color,
    this.strokeWidth = 3.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Draw background track
    final bgPaint = Paint()
      ..color = Colors.grey.shade200
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final waveLength = 15.0;
    final amplitude = 2.5;

    // Start drawing from left
    path.moveTo(0, size.height / 2);

    // Create squiggly line across the width with animation
    for (double x = 0; x < size.width; x += 1) {
      final y =
          size.height / 2 +
          amplitude *
              math.sin((x / waveLength + animationValue * 2 * math.pi) * 2);
      path.lineTo(x, y);
    }

    canvas.drawPath(path, bgPaint);

    // Draw progress portion with color
    if (progress > 0) {
      final progressPath = Path();
      final progressWidth = size.width * progress;

      progressPath.moveTo(0, size.height / 2);

      for (double x = 0; x < progressWidth; x += 1) {
        final y =
            size.height / 2 +
            amplitude *
                math.sin((x / waveLength + animationValue * 2 * math.pi) * 2);
        progressPath.lineTo(x, y);
      }

      canvas.drawPath(progressPath, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _AnimatedWavyProgressPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.progress != progress ||
        oldDelegate.color != color;
  }
}

/// A compact booking status indicator for the Home Screen
/// Shows a simplified progress view that fits better in limited space
/// with animated wavy progress bar
class CompactBookingStatusIndicator extends StatefulWidget {
  final BookingAssignmentState? currentState;
  final BookingStatus? bookingStatus;
  final VoidCallback? onTap;

  const CompactBookingStatusIndicator({
    Key? key,
    this.currentState,
    this.bookingStatus,
    this.onTap,
  }) : super(key: key);

  @override
  State<CompactBookingStatusIndicator> createState() =>
      _CompactBookingStatusIndicatorState();
}

class _CompactBookingStatusIndicatorState
    extends State<CompactBookingStatusIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  int _getCurrentIndex() {
    if (widget.currentState != null) {
      switch (widget.currentState!) {
        case BookingAssignmentState.pending:
          return 0;
        case BookingAssignmentState.assigned:
          return 1;
        case BookingAssignmentState.confirmed:
        case BookingAssignmentState.enRoute:
        case BookingAssignmentState.arrived:
          return 2;
        case BookingAssignmentState.inProgress:
          return 2;
        case BookingAssignmentState.completed:
          return 3;
        case BookingAssignmentState.cancelled:
          return 3;
      }
    }
    if (widget.bookingStatus != null) {
      switch (widget.bookingStatus!) {
        case BookingStatus.assignmentInProgress:
          return 0;
        case BookingStatus.scheduled:
          return 1;
        case BookingStatus.confirmed:
          return 2;
        case BookingStatus.inProgress:
          return 2;
        case BookingStatus.completed:
          return 3;
        case BookingStatus.cancelled:
          return 3;
      }
    }
    return 0;
  }

  Color _getStatusColor() {
    final currentIndex = _getCurrentIndex();
    // Use SEVAQ brand colors: Orange primary
    if (widget.bookingStatus == BookingStatus.cancelled) {
      return Colors.red;
    }
    if (currentIndex >= 3) {
      return Color(0xFF10B981); // Green for completed
    }
    if (currentIndex >= 2) {
      return Color(0xFFF97316); // Orange for confirmed (SEVAQ brand)
    }
    if (currentIndex >= 1) {
      return Color(0xFFF59E0B); // Amber for assigned
    }
    return Color(0xFF6B7280); // Gray for pending
  }

  String _getStatusText() {
    final currentIndex = _getCurrentIndex();
    if (widget.bookingStatus == BookingStatus.cancelled) {
      return 'Cancelled';
    }
    if (currentIndex >= 3) {
      return 'Completed';
    }
    if (currentIndex >= 2) {
      return 'Confirmed';
    }
    if (currentIndex >= 1) {
      return 'Assigned';
    }
    return 'Pending';
  }

  double _calculateProgress(int currentIndex) {
    // 4 steps: pending=0, assigned=1, confirmed=2, done=3
    if (currentIndex <= 0) return 0.0;
    if (currentIndex >= 3) return 1.0;
    return currentIndex / 3.0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex();
    final progress = _calculateProgress(currentIndex);
    final statusColor = _getStatusColor();
    final statusText = _getStatusText();

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header row: Status text + Progress percentage
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  statusText,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${(progress * 100).toInt()}%',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            // Animated wavy progress bar
            SizedBox(
              height: 20,
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return CustomPaint(
                    painter: _AnimatedWavyProgressPainter(
                      animationValue: _animationController.value,
                      progress: progress,
                      color: statusColor,
                      strokeWidth: 3.0,
                    ),
                    size: Size.infinite,
                  );
                },
              ),
            ),
            SizedBox(height: 8),
            // Minimal step indicators
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStepDot(
                  'Pending',
                  0,
                  currentIndex,
                  Icons.hourglass_empty,
                ),
                _buildStepDot('Assigned', 1, currentIndex, Icons.person),
                _buildStepDot('Confirmed', 2, currentIndex, Icons.check_circle),
                _buildStepDot('Done', 3, currentIndex, Icons.done_all),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepDot(
    String label,
    int stepIndex,
    int currentIndex,
    IconData icon,
  ) {
    final isCompleted = stepIndex < currentIndex;
    final isCurrent = stepIndex == currentIndex;
    final color = isCompleted || isCurrent
        ? _getStatusColor()
        : Colors.grey.shade400;

    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: isCompleted || isCurrent
                ? color.withOpacity(0.15)
                : Colors.grey.shade100,
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 1.5),
          ),
          child: Icon(isCompleted ? Icons.check : icon, size: 12, color: color),
        ),
        SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            color: isCompleted || isCurrent
                ? Colors.black87
                : Colors.grey.shade500,
            fontWeight: isCompleted || isCurrent
                ? FontWeight.w500
                : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
