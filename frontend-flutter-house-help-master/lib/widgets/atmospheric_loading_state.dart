import 'package:flutter/material.dart';
import 'dart:math' as math;

/// Atmospheric loading state with fog gradients and particle effects
class AtmosphericLoadingState extends StatefulWidget {
  final String? message;
  final double opacity;

  const AtmosphericLoadingState({Key? key, this.message, this.opacity = 0.6})
    : super(key: key);

  @override
  State<AtmosphericLoadingState> createState() =>
      _AtmosphericLoadingStateState();
}

class _AtmosphericLoadingStateState extends State<AtmosphericLoadingState>
    with TickerProviderStateMixin {
  late AnimationController _fogController;
  late AnimationController _particleController;
  late Animation<double> _fogAnimation;
  late Animation<double> _particleAnimation;

  @override
  void initState() {
    super.initState();
    _fogController = AnimationController(
      duration: const Duration(seconds: 12),
      vsync: this,
    )..repeat(reverse: true);
    _fogAnimation = Tween<double>(begin: 0.3, end: 0.7).animate(
      CurvedAnimation(parent: _fogController, curve: Curves.easeInOutSine),
    );

    _particleController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
    _particleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _particleController, curve: Curves.linear),
    );
  }

  @override
  void dispose() {
    _fogController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: Listenable.merge([_fogAnimation, _particleAnimation]),
      builder: (context, child) {
        return Opacity(
          opacity: widget.opacity,
          child: Stack(
            children: [
              // Fog gradient background
              Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  gradient: isDark
                      ? LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            const Color(0xFF0A1A15).withValues(alpha: 0.9),
                            const Color(
                              0xFF153028,
                            ).withValues(alpha: _fogAnimation.value * 0.5),
                          ],
                        )
                      : LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            const Color(0xFFF6F7F5).withValues(alpha: 0.95),
                            const Color(
                              0xFFEAF4F1,
                            ).withValues(alpha: _fogAnimation.value * 0.3),
                          ],
                        ),
                ),
              ),
              // Particle fog effects
              Positioned.fill(
                child: CustomPaint(
                  painter: _ParticleFogPainter(
                    animationValue: _particleAnimation.value,
                    isDark: isDark,
                  ),
                ),
              ),
              // Content
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Foggy progress indicator
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            isDark
                                ? const Color(0xFF2A7A6A).withValues(alpha: 0.3)
                                : const Color(
                                    0xFF2A655A,
                                  ).withValues(alpha: 0.2),
                            Colors.transparent,
                          ],
                        ),
                      ),
                      child: const CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color(0xFF2A655A),
                        ),
                      ),
                    ),
                    if (widget.message != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        widget.message!,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Theme.of(
                            context,
                          ).colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Custom painter for particle fog effects
class _ParticleFogPainter extends CustomPainter {
  final double animationValue;
  final bool isDark;

  _ParticleFogPainter({required this.animationValue, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.fill
      ..blendMode = BlendMode.screen;

    final random = math.Random(42);
    final particleCount = 12;

    for (int i = 0; i < particleCount; i++) {
      final x =
          (random.nextDouble() * size.width * 0.8 + size.width * 0.1) +
          math.sin(animationValue * 2 * math.pi + i) * 20;
      final y =
          (random.nextDouble() * size.height * 0.8 + size.height * 0.1) +
          math.cos(animationValue * 2 * math.pi + i) * 20;
      final radius = 20 + random.nextDouble() * 40;
      final opacity =
          (0.05 + random.nextDouble() * 0.1) *
          (0.5 + 0.5 * math.sin(animationValue * math.pi + i));

      paint.color = (isDark ? const Color(0xFF2A7A6A) : const Color(0xFF2A655A))
          .withValues(alpha: opacity);

      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ParticleFogPainter old) {
    return old.animationValue != animationValue;
  }
}
