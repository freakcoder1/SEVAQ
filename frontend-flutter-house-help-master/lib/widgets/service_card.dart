import 'package:flutter/material.dart';
import '../models/service.dart';
import '../core/theme/design_tokens.dart';

class ServiceCard extends StatelessWidget {
  final Service service;
  final VoidCallback onTap;

  const ServiceCard({Key? key, required this.service, required this.onTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: 0,
      color: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? DesignTokens.cardDark : DesignTokens.cardLight,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.3)
                    : Colors.black.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 4),
                spreadRadius: -4,
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Service Image/Icon
                Container(
                  height: 80,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: isDark
                        ? DesignTokens.surfaceDark.withValues(alpha: 0.3)
                        : DesignTokens.surfaceLight.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Icon(
                      _getServiceIcon(service.category),
                      size: 36,
                      color: isDark
                          ? DesignTokens.primary.withValues(alpha: 0.8)
                          : DesignTokens.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Service Name
                Text(
                  service.name,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurface,
                    letterSpacing: 0.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 4),

                // Category
                Text(
                  service.category,
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                const SizedBox(height: 8),

                // Price
                Row(
                  children: [
                    Text(
                      '₹${service.basePrice}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    const Spacer(),

                    // Fast booking badge
                    if (service.isFastBooking)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? DesignTokens.primaryContainerDark.withValues(
                                  alpha: 0.2,
                                )
                              : theme.colorScheme.primaryContainer.withValues(
                                  alpha: 0.15,
                                ),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.timer,
                              size: 12,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              '15-30 min',
                              style: TextStyle(
                                fontSize: 10,
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 4),

                // Availability indicator
                if (service.isAvailable)
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        size: 12,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Available',
                        style: TextStyle(
                          fontSize: 10,
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  )
                else
                  Row(
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 12,
                        color: Colors.orange.shade300,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Waitlist',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.orange.shade300,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getServiceIcon(String category) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return Icons.cleaning_services;
      case 'cooking':
        return Icons.restaurant;
      case 'electrician':
        return Icons.electrical_services;
      case 'plumber':
        return Icons.plumbing;
      case 'caretaker':
        return Icons.person;
      default:
        return Icons.category;
    }
  }
}
