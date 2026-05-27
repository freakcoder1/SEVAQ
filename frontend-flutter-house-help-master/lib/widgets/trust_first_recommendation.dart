import 'package:flutter/material.dart';
import '../models/recommendation.dart';
import '../models/service.dart';
import '../core/theme/design_tokens.dart';

class TrustFirstRecommendation extends StatelessWidget {
  final Recommendation recommendation;
  final VoidCallback onAccept;

  const TrustFirstRecommendation({
    Key? key,
    required this.recommendation,
    required this.onAccept,
  }) : super(key: key);

  // Helper function to get abstract service category
  String _getAbstractServiceCategory(Service service) {
    final serviceName = service.name.toLowerCase();

    if (serviceName.contains('clean')) {
      return 'Household Help';
    } else if (serviceName.contains('cook') || serviceName.contains('meal')) {
      return 'Meal Preparation';
    } else if (serviceName.contains('errand') ||
        serviceName.contains('grocery')) {
      return 'Daily Errands';
    } else {
      return 'Home Services';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final service = recommendation.service;
    final abstractCategory = _getAbstractServiceCategory(service);

    print(
      '🔍 DEBUG: TrustFirstRecommendation build called, onAccept callback: ${onAccept != null}',
    );

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark
            ? DesignTokens.cardDark.withValues(alpha: 0.9)
            : DesignTokens.cardLight,
        borderRadius: BorderRadius.circular(24),
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
      child: SingleChildScrollView(
        physics: const NeverScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Reassurance Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isDark
                    ? DesignTokens.primaryContainerDark.withValues(alpha: 0.2)
                    : theme.colorScheme.primaryContainer.withValues(
                        alpha: 0.15,
                      ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? DesignTokens.primaryContainerDark.withValues(alpha: 0.3)
                      : theme.colorScheme.primaryContainer,
                ),
              ),
              child: Text(
                'Recommended for your area',
                style: TextStyle(
                  fontSize: 10,
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            SizedBox(height: 8),

            // Abstract Service Category (Option A)
            Text(
              abstractCategory,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.onSurface,
                letterSpacing: 0.3,
              ),
            ),

            SizedBox(height: 2),

            // System authority line
            Text(
              'Assigned & monitored by Sevaq',
              style: TextStyle(
                fontSize: 11,
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w500,
              ),
            ),

            SizedBox(height: 6),

            // Confidence Line
            Text(
              'Arrives in ~30 mins · Reliable in your area',
              style: TextStyle(
                fontSize: 10,
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),

            SizedBox(height: 10),

            // Primary CTA - ONLY ONE BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  print('🔍 DEBUG: TrustFirstRecommendation CTA clicked');
                  print('🔍 DEBUG: Calling onAccept callback');
                  try {
                    onAccept();
                    print('🔍 DEBUG: onAccept callback completed successfully');
                  } catch (e) {
                    print('🔍 DEBUG: Error in onAccept callback: $e');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(
                      12,
                    ), // Small pills per V1 spec
                  ),
                  elevation: 0,
                  shadowColor: Colors.transparent,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, size: 16),
                    SizedBox(width: 4),
                    Text(
                      "We'll take care of this",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
