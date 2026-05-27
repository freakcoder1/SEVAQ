import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme.dart';
import 'custom_nav_icons.dart';
import '../core/animation/haptic_service.dart';

class FloatingNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const FloatingNavigation({
    Key? key,
    required this.currentIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(
        children: [
          // Backdrop blur layer
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
            child: Container(
              width: screenWidth - 32,
              height: 54, // Reduced 6px for more engineered feel
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(
                  alpha: 0.55,
                ), // Reduced translucency
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 28,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
            ),
          ),
          // Faint upper separator glow
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 0.5,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.3),
                    Colors.white.withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          // Navigation items
          Positioned.fill(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(context, 0, 'Home', 0),
                _buildNavItem(context, 1, 'Operations', 1),
                _buildNavItem(context, 2, 'Account', 2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    int iconIndex,
    String label,
    int index,
  ) {
    final isSelected = currentIndex == index;

    return GestureDetector(
      onTap: () {
        HapticService.lightTap();
        onTap(index);
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 5.5 : 0, // Reduced width by ~8%
          vertical: 3, // Reduced vertical padding
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.emeraldGreen.withValues(
                  alpha: 0.02,
                ) // Reduced 10% for softer blend into nav
              : Colors.transparent,
          borderRadius: BorderRadius.circular(
            6,
          ), // Reduced radius for precision
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Custom SevaQ iconography with morph scaling
            AnimatedScale(
              scale: isSelected ? 1.15 : 1.0,
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              child: _buildCustomIcon(iconIndex, isSelected, context),
            ),
            const SizedBox(height: 1), // Reduced spacing
            Text(
              label,
              style: TextStyle(
                fontSize: 9, // Reduced text size
                color: isSelected
                    ? AppTheme.emeraldGreen
                    : Theme.of(context).colorScheme.onSurfaceVariant.withValues(
                        alpha: 0.7,
                      ), // Increased 10% for better visibility
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomIcon(
    int iconIndex,
    bool isSelected,
    BuildContext context,
  ) {
    final color = isSelected
        ? AppTheme.emeraldGreen
        : Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7);

    switch (iconIndex) {
      case 0:
        return CustomNavIcons.home(color: color, size: 18);
      case 1:
        return CustomNavIcons.operations(color: color, size: 18);
      case 2:
        return CustomNavIcons.account(color: color, size: 18);
      default:
        return Icon(Icons.home, color: color, size: 18);
    }
  }
}
