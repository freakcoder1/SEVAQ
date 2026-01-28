import 'package:flutter/material.dart';
import '../models/recommendation.dart';
import '../models/service.dart';

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

    if (serviceName.contains('clean') || serviceName.contains('maid')) {
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
    final service = recommendation.service;
    final abstractCategory = _getAbstractServiceCategory(service);

    print(
      '🔍 DEBUG: TrustFirstRecommendation build called, onAccept callback: ${onAccept != null}',
    );

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Reassurance Badge
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: theme.colorScheme.primaryContainer),
            ),
            child: Text(
              'Recommended for your area',
              style: TextStyle(
                fontSize: 12,
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          SizedBox(height: 16),

          // Abstract Service Category (Option A)
          Text(
            abstractCategory,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
              letterSpacing: 0.5,
            ),
          ),

          SizedBox(height: 4),

          // System authority line
          Text(
            'Assigned & monitored by Sevaq',
            style: TextStyle(
              fontSize: 14,
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.w500,
            ),
          ),

          SizedBox(height: 12),

          // Confidence Line
          Text(
            'Arrives in ~30 mins · Reliable in your area',
            style: TextStyle(
              fontSize: 14,
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),

          SizedBox(height: 24),

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
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
                shadowColor: Colors.transparent,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'We’ll take care of this',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Footer removed to eliminate redundancy - only one system-ownership line remains
        ],
      ),
    );
  }
}
