import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../theme.dart';

class SocietyIntelligence extends StatefulWidget {
  const SocietyIntelligence({Key? key}) : super(key: key);

  @override
  State<SocietyIntelligence> createState() => _SocietyIntelligenceState();
}

class _SocietyIntelligenceState extends State<SocietyIntelligence>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _rotationController;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    )..repeat(reverse: true);
    _rotationController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      height: 100, // EXACT: 100px height (reduced from 120)
      padding: const EdgeInsets.all(
        16,
      ), // EXACT: 16px padding (reduced from 20)
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(
          20,
        ), // EXACT: 20px radius (reduced from 24)
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          // LEFT: Metrics
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Household support network',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 6), // Reduced from 8
                Text(
                  '12 verified professionals nearby',
                  style: TextStyle(
                    fontSize: 12, // Reduced from 13
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2), // Reduced from 4
                Text(
                  '~14 min average arrival',
                  style: TextStyle(
                    fontSize: 12, // Reduced from 13
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
          // RIGHT: Ambient operational visualization with rotation and sequential pulse
          SizedBox(
            width: 66, // Increased by 10% from 60
            height: 66, // Increased by 10% from 60
            child: AnimatedBuilder(
              animation: Listenable.merge([_controller, _rotationController]),
              builder: (context, child) {
                return Transform.rotate(
                  angle:
                      _rotationController.value *
                      2 *
                      math.pi *
                      0.1, // Slow 10% rotation
                  child: CustomPaint(
                    painter: _ActivityDotsPainter(
                      _controller.value,
                      _controller,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityDotsPainter extends CustomPainter {
  final double animationValue;
  final AnimationController? controller;

  _ActivityDotsPainter(this.animationValue, this.controller);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.emeraldGreen
          .withValues(alpha: 0.82) // Reduced 8% for better text hierarchy
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.5;

    // Draw 7-8 subtle activity dots with sequential pulse effect
    for (int i = 0; i < 8; i++) {
      final angle = (i / 8) * 2 * math.pi;
      final x = center.dx + radius * 0.8 * math.cos(angle);
      final y = center.dy + radius * 0.8 * math.sin(angle);

      // Sequential pulse: one node pulses at a time
      final activeNodeIndex = (animationValue * 8).floor() % 8;
      final isActive = i == activeNodeIndex;
      final pulseScale = isActive
          ? 1.0 + 0.3 * math.sin(animationValue * 2 * math.pi * 4)
          : 1.0;
      final dotRadius =
          2.9 * pulseScale; // Reduced 2-3% more for sophistication

      canvas.drawCircle(Offset(x, y), dotRadius, paint);
    }

    // Draw subtle connecting lines
    final linePaint = Paint()
      ..color = AppTheme.emeraldGreen.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;

    for (int i = 0; i < 8; i++) {
      final angle1 = (i / 8) * 2 * math.pi;
      final angle2 = ((i + 1) % 8 / 8) * 2 * math.pi;
      final x1 = center.dx + radius * 0.8 * math.cos(angle1);
      final y1 = center.dy + radius * 0.8 * math.sin(angle1);
      final x2 = center.dx + radius * 0.8 * math.cos(angle2);
      final y2 = center.dy + radius * 0.8 * math.sin(angle2);
      canvas.drawLine(Offset(x1, y1), Offset(x2, y2), linePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
