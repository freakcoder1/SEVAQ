import 'package:flutter/material.dart';
import '../theme.dart';
import 'custom_service_icons.dart';

class HouseholdSupport extends StatelessWidget {
  final List<String> services;
  final Function(String)? onServiceTap;

  const HouseholdSupport({Key? key, required this.services, this.onServiceTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Kitchen Support/Management',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 6),
        // 2-column support grid for all services (equal width)
        if (services.isNotEmpty)
          Wrap(
            spacing: 8,
            runSpacing: 4, // Reduced 50% for better ecosystem cohesion
            children: services.map((service) {
              return _buildSupportCard(context, service);
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildSupportCard(BuildContext context, String label) {
    final theme = Theme.of(context);
    // Width: (available width - gap) / 2
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth =
        (screenWidth - 48 - 8) / 2; // 24px padding each side + 8px gap

    return GestureDetector(
      onTap: () => onServiceTap?.call(label),
      child: Container(
        width: cardWidth,
        height: 104, // Balanced height for equal width cards
        padding: const EdgeInsets.fromLTRB(
          12,
          22,
          12,
          10,
        ), // Increased top padding by 8px to move content down
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadow,
          gradient: _getServiceGradient(label),
          border: Border.all(
            color: const Color(0xFFE6E8E7).withValues(alpha: 0.3),
            width: 0.5,
          ), // EXTREMELY subtle border tint for card separation
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Top: custom icon
                CustomServiceIcons.getServiceIcon(label, size: 20),
                const SizedBox(height: 4),
                // Bottom: title + subtitle
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(
                  height: 10,
                ), // Increased from 6 to 10 for better breathing room
                Text(
                  _getServiceSubtitle(label),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF606060).withValues(
                      alpha: 0.92,
                    ), // Increased 6-8% for better readability
                    height:
                        1.1, // Tighter line height for secondary descriptions
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            // Subtle operational glow indicator
            if (_isServiceActive(label))
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppTheme.emeraldGreen,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.emeraldGreen.withValues(alpha: 0.25),
                        blurRadius: 3,
                        spreadRadius: 0.5,
                      ),
                    ],
                  ),
                ),
              ),
            // Interaction affordance - subtle arrow
            Positioned(
              bottom: 8,
              right: 14, // Brought inward 6px for more custom feel
              child: Icon(
                Icons.arrow_forward_ios,
                size: 10,
                color: theme.colorScheme.onSurface.withValues(
                  alpha: 0.35,
                ), // Increased 10% for better visibility
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getServiceSubtitle(String service) {
    switch (service) {
      case 'Kitchen Operations':
        return 'Managed daily meal support';
      case 'Home Maintenance':
        return 'Managed cleaning support';
      default:
        return 'Service available';
    }
  }

  // Contextual gradients for each service type
  Gradient? _getServiceGradient(String service) {
    switch (service) {
      case 'Kitchen Operations':
        return LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, const Color(0xFFF0FDFA)],
        );
      case 'Home Maintenance':
        return LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, const Color(0xFFF5FDFA)],
        );
      default:
        return null;
    }
  }

  // Determine if service has active operations
  bool _isServiceActive(String service) {
    // This would be connected to actual state in production
    return false;
  }
}
