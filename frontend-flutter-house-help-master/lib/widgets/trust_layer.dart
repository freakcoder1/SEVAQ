import 'package:flutter/material.dart';
import '../theme.dart';
import '../core/intelligence/contextual_message_service.dart';
import 'package:intl/intl.dart';

class TrustLayer extends StatefulWidget {
  final int professionalsNearby;
  final int avgResponseTime;

  const TrustLayer({
    Key? key,
    this.professionalsNearby = 12,
    this.avgResponseTime = 14,
  }) : super(key: key);

  @override
  _TrustLayerState createState() => _TrustLayerState();
}

class _TrustLayerState extends State<TrustLayer>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.7, end: 1.0).animate(
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

    return Container(
      height: 76, // Reduced from 82px
      padding: const EdgeInsets.fromLTRB(
        14,
        6,
        10,
        6,
      ), // Increased left padding by 4px for better breathing
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFFF5FAF8), const Color(0xFFF0F7F4)],
          stops: [0.0, 1.0],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          // Icon with subtle pulse animation
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: AppTheme.emeraldGreen.withValues(
                    alpha: 0.18 * _pulseAnimation.value,
                  ), // Increased 6-8% for stronger anchor point
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  Icons.verified,
                  color: AppTheme.emeraldGreen,
                  size: 14, // Increased 8-10% for better visual weight
                ),
              );
            },
          ),
          const SizedBox(width: 10),
          // Text column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Managed by SevaQ',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ContextualMessageService.getOperationsMessage(
                    activeOperations: 0,
                    backupProfessionals: 2,
                    avgResponseTime: widget.avgResponseTime,
                  ),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF6B6B6B),
                    letterSpacing: 0.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ContextualMessageService.getAvailabilityMessage(
                    professionalsNearby: widget.professionalsNearby,
                    avgResponseTime: widget.avgResponseTime,
                    backupProfessionals: 2,
                  ),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF6B6B6B).withValues(
                      alpha: 0.75,
                    ), // Increased 3-4% for better accessibility
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
