import 'package:flutter/material.dart';
import '../theme.dart';

class ActiveOperations extends StatefulWidget {
  final String operationTitle;
  final String assignedTo;
  final String eta;
  final String? timeWindow;
  final String? status;
  final VoidCallback? onTap;
  final VoidCallback? onViewAll;

  const ActiveOperations({
    Key? key,
    required this.operationTitle,
    required this.assignedTo,
    required this.eta,
    this.timeWindow,
    this.status,
    this.onTap,
    this.onViewAll,
  }) : super(key: key);

  @override
  State<ActiveOperations> createState() => _ActiveOperationsState();
}

class _ActiveOperationsState extends State<ActiveOperations>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2500), // 2.5s for breathing effect
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header with "View all" on right
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Active household operations',
              style: TextStyle(
                fontSize: 18, // Reduced from 20
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            if (widget.onViewAll != null)
              TextButton(
                onPressed: widget.onViewAll,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'See operations',
                  style: TextStyle(
                    fontSize: 13, // Reduced from 14
                    fontWeight: FontWeight.w500,
                    color: AppTheme.emeraldGreen,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 6), // Reduced from 8
        // Operation card - FULL WIDTH, reduced height
        Container(
          width: double.infinity,
          height: 108, // Reduced 10px for better density
          padding: const EdgeInsets.fromLTRB(
            18,
            14,
            18,
            16,
          ), // Reduced padding for better density
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(20), // EXACT: 20px radius
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // LEFT SIDE
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Status indicator - tiny operational node cluster
                    Row(
                      children: [
                        _buildNodeCluster(),
                        const SizedBox(width: 6),
                        Text(
                          widget.status ?? 'In progress',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.emeraldGreen.withValues(
                              alpha: 0.55,
                            ), // Lighter for secondary status
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    // ETA - PRIMARY focus (largest, boldest)
                    Text(
                      'Arriving in ${widget.eta}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(
                      height: 3,
                    ), // Reduced 2px for tighter hierarchy
                    // Service title - SECONDARY
                    Text(
                      widget.operationTitle,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.75,
                        ),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    // Human warmth - worker name - TERTIARY
                    Text(
                      'with ${widget.assignedTo}',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w400,
                        color: theme.colorScheme.onSurface.withValues(
                          alpha: 0.55,
                        ),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    // Micro operational module - route progress line
                    _buildRouteProgress(),
                  ],
                ),
              ),
              // RIGHT SIDE - Animated pulse indicator (moved 12px inward)
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _buildPulseIndicator(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPulseIndicator() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        // Breathing animation: scale 1→1.08, opacity 0.85→1.0
        final opacity = 0.85 + (0.15 * (_pulseAnimation.value - 1.0) / 0.08);
        return Container(
          width: 12, // Reduced 8% from 14px
          height: 12, // Reduced 8% from 14px
          decoration: BoxDecoration(
            color: AppTheme.emeraldGreen.withValues(
              alpha: opacity.clamp(0.85, 1.0),
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppTheme.emeraldGreen.withValues(
                  alpha: 0.108, // Reduced 10% opacity
                ),
                blurRadius: 1.6 * _pulseAnimation.value, // Reduced 20% blur
                spreadRadius:
                    0.32 * _pulseAnimation.value, // Reduced 20% spread
              ),
            ],
          ),
          child: Center(
            child: Container(
              width: 2.5, // Reduced from 3px
              height: 2.5, // Reduced from 3px
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      },
    );
  }

  // Tiny operational node cluster - more subtle than single dot
  Widget _buildNodeCluster() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return SizedBox(
          width: 12,
          height: 8,
          child: Stack(
            children: [
              // Node 1 (left)
              Positioned(
                left: 0,
                top: 0,
                child: Container(
                  width: 3,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppTheme.emeraldGreen.withValues(
                      alpha: 0.5,
                    ), // Reduced from 0.7
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              // Node 2 (center)
              Positioned(
                left: 4,
                top: 0,
                child: Transform.scale(
                  scale: 0.8 + (_pulseAnimation.value * 0.2),
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldGreen.withValues(
                        alpha: 0.8,
                      ), // Reduced from 1.0
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.emeraldGreen.withValues(
                            alpha: 0.15,
                          ), // Reduced from 0.2
                          blurRadius: 2, // Reduced from 3
                          spreadRadius: 0.3, // Reduced from 0.5
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              // Node 3 (right)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 3,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppTheme.emeraldGreen.withValues(
                      alpha: 0.3,
                    ), // Reduced from 0.5
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Micro operational module - route progress line
  Widget _buildRouteProgress() {
    return Container(
      width: double.infinity,
      height: 4, // Increased from 3px to 4px for more intentional feel
      decoration: BoxDecoration(
        color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(
          0.5,
        ), // Flatter end caps for precision
      ),
      child: Row(
        children: [
          // Progress fill (60% complete)
          Expanded(
            flex: 3,
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.emeraldGreen,
                borderRadius: BorderRadius.circular(0.5), // Flatter end caps
              ),
            ),
          ),
          // Remaining
          Expanded(flex: 2, child: Container()),
        ],
      ),
    );
  }
}
