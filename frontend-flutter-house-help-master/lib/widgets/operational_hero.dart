import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme.dart';
import '../core/animation/haptic_service.dart';
import '../core/theme/dark_theme.dart';

class OperationalHero extends StatefulWidget {
  final VoidCallback? onRequestSupport;

  const OperationalHero({Key? key, this.onRequestSupport}) : super(key: key);

  @override
  State<OperationalHero> createState() => _OperationalHeroState();
}

class _OperationalHeroState extends State<OperationalHero>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _gradientController;
  late Animation<double> _gradientAnimation;
  late AnimationController _shadowController;
  late Animation<double> _shadowAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    // Gradient animation for subtle movement
    _gradientController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat(reverse: true);
    _gradientAnimation = Tween<double>(begin: -0.1, end: 0.1).animate(
      CurvedAnimation(parent: _gradientController, curve: Curves.easeInOut),
    );
    // Breathing ambient shadow animation
    _shadowController = AnimationController(
      duration: const Duration(seconds: 6),
      vsync: this,
    )..repeat(reverse: true);
    _shadowAnimation = Tween<double>(begin: 0.04, end: 0.06).animate(
      CurvedAnimation(parent: _shadowController, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _gradientController.dispose();
    _shadowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AnimatedBuilder(
      animation: Listenable.merge([_gradientAnimation, _shadowAnimation]),
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: isDark
                ? DarkTheme.heroGradient
                : LinearGradient(
                    colors: [
                      Color(0xFF1D5247), // Deep muted emerald (top-left)
                      Color(0xFF1F6B5F), // Primary emerald (bottom-right)
                    ],
                    begin: Alignment(
                      -0.5 + _gradientAnimation.value,
                      -0.5 + _gradientAnimation.value,
                    ),
                    end: Alignment(
                      0.5 + _gradientAnimation.value,
                      0.5 + _gradientAnimation.value,
                    ),
                  ),
            borderRadius: BorderRadius.circular(28), // EXACT: 28px radius
            boxShadow: isDark
                ? DarkTheme.cardShadow
                : [
                    BoxShadow(
                      color: Colors.black.withValues(
                        alpha: _shadowAnimation.value,
                      ), // Breathing shadow
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
          ),
          child: child,
        );
      },
      child: Stack(
        children: [
          // Brighter center lighting (foggy ambient light) - shifted top-left
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Container(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: Alignment(
                          -0.6,
                          -0.6,
                        ), // More upward-left, atmospheric
                        radius:
                            1.2 +
                            (_pulseAnimation.value * 0.05), // More diffused
                        colors: [
                          Color(
                            0x1AFFFFFF,
                          ), // 10% white (reduced 5% more for ambient feel)
                          Color(0x06FFFFFF), // 2% white for transition
                          Colors.transparent,
                        ],
                        stops: [0.0, 0.5, 1.0],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          // Organic clustered grain texture - atmospheric, not uniform
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: Opacity(
                opacity: 0.015, // 1.5% for organic feel
                child: CustomPaint(painter: _OrganicGrainPainter()),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              20,
              36,
              20,
              24,
            ), // Moved content block 16px downward for luxury spacing
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Pill
                Container(
                  height: 22, // Reduced 2px for sharper, more engineered feel
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                  ), // Increased by 2px for better balance
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(
                      alpha: 0.15,
                    ), // 100% visible - full opacity for elite quality
                    borderRadius: BorderRadius.circular(
                      12,
                    ), // EXACT: 12px radius
                  ),
                  child: Center(
                    child: Text(
                      'Reliable household support',
                      style: TextStyle(
                        fontSize: 11, // EXACT: 11px
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(
                  height: 52,
                ), // Increased to move headline down by ~10px more
                // Headline - 2 lines max
                Text(
                  'Managed support for your home.',
                  style: TextStyle(
                    fontSize: 26, // EXACT: 26px
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.15, // EXACT: 30px line height (1.15 * 26 = 30)
                    letterSpacing: -0.5, // Luxury density
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(
                  height: 18,
                ), // Increased 6px for better premium breathing
                // Subtitle - ONE line ONLY
                Text(
                  'Consistent household support.',
                  style: TextStyle(
                    fontSize: 15, // EXACT: 15px
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(
                      alpha: 0.85,
                    ), // Reduced to 85% for better hierarchy
                    height: 1.2,
                    letterSpacing: 0.25, // Luxury letter spacing
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(
                  height: 10,
                ), // Reduced from 20px to move CTA upward
                // CTA at bottom-left (inside padding) - Operational style
                // Glass blur layer behind CTA for dimensional depth
                Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    // Glass blur background - reduced 15% for engineered feel
                    Positioned.fill(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 6.8, sigmaY: 6.8),
                          child: Container(
                            color: Colors.white.withValues(alpha: 0.04),
                          ),
                        ),
                      ),
                    ),
                    // CTA button
                    ElevatedButton(
                      onPressed: () {
                        HapticService.lightTap();
                        widget.onRequestSupport?.call();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withValues(
                          alpha: 0.16,
                        ), // 16% white fill - more confident
                        foregroundColor: Colors.white.withValues(
                          alpha: 0.92,
                        ), // 92% text opacity - clearer
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18, // EXACT: 18px horizontal
                          vertical: 0,
                        ),
                        minimumSize: const Size(0, 36), // 36px height
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            20,
                          ), // EXACT: 20px radius
                          side: BorderSide(
                            color: const Color(0xFF8FB5A8).withValues(
                              alpha: 0.70,
                            ), // Increased 5% for clearer border
                            width: 1.2,
                          ),
                        ),
                        textStyle: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                        elevation: 0,
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.white.withValues(alpha: 0.18),
                              Colors.transparent,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          // Removed inner glow for precision elegance
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text('Start managed support'),
                            const SizedBox(width: 4),
                            // Optical centering - arrow is visually 1-2px low
                            Transform.translate(
                              offset: const Offset(0, -2),
                              child: Icon(
                                Icons.arrow_forward,
                                size: 14,
                                color: Colors.white.withValues(alpha: 0.95),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for noise texture
class _NoisePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    // Generate subtle noise pattern
    final random = DateTime.now().millisecondsSinceEpoch;
    for (int i = 0; i < 200; i++) {
      final x = (random * (i + 1) * 0.01) % size.width;
      final y = (random * (i + 7) * 0.01) % size.height;
      final radius = ((random * (i + 3) * 0.001) % 2) + 0.5;
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Organic clustered grain painter - atmospheric, not uniform
class _OrganicGrainPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final random = DateTime.now().millisecondsSinceEpoch;
    // Create clustered grain groups
    for (int cluster = 0; cluster < 15; cluster++) {
      final centerX = (random * (cluster + 1) * 0.001) % size.width;
      final centerY = (random * (cluster + 7) * 0.001) % size.height;

      // Each cluster has 8-15 particles
      final clusterSize = 8 + (cluster % 8);
      for (int i = 0; i < clusterSize; i++) {
        final x = centerX + ((random * (i + 1) * 0.0001) % 20) - 10;
        final y = centerY + ((random * (i + 3) * 0.0001) % 20) - 10;
        final radius = ((random * (i + 5) * 0.0001) % 1.5) + 0.3;
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
