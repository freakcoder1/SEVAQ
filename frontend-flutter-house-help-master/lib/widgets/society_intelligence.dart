import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:provider/provider.dart';
import '../theme.dart';
import '../providers/worker_provider.dart';

class SocietyIntelligence extends StatefulWidget {
  const SocietyIntelligence({Key? key}) : super(key: key);

  @override
  State<SocietyIntelligence> createState() => _SocietyIntelligenceState();
}

class _SocietyIntelligenceState extends State<SocietyIntelligence>
    with TickerProviderStateMixin {
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

    return Consumer<WorkerProvider>(
      builder: (context, workerProvider, child) {
        final nearbyCount = workerProvider.nearbyCount;
        final avgResponseTime = workerProvider.avgResponseTime;

        return Container(
          height: 100,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Row(
            children: [
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
                    const SizedBox(height: 6),
                    Text(
                      '$nearbyCount verified professionals nearby',
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '~$avgResponseTime min average arrival',
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 66,
                height: 66,
                child: AnimatedBuilder(
                  animation: Listenable.merge([_controller, _rotationController]),
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: _rotationController.value * 2 * math.pi * 0.1,
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
      },
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
      ..color = AppTheme.emeraldGreen.withValues(alpha: 0.82)
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.5;

    for (int i = 0; i < 8; i++) {
      final angle = (i / 8) * 2 * math.pi;
      final x = center.dx + radius * 0.8 * math.cos(angle);
      final y = center.dy + radius * 0.8 * math.sin(angle);

      final activeNodeIndex = (animationValue * 8).floor() % 8;
      final isActive = i == activeNodeIndex;
      final pulseScale = isActive
          ? 1.0 + 0.3 * math.sin(animationValue * 2 * math.pi * 4)
          : 1.0;
      final dotRadius = 2.9 * pulseScale;

      canvas.drawCircle(Offset(x, y), dotRadius, paint);
    }

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
