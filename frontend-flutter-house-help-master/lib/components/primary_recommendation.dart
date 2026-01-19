import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/system_status_provider.dart';
import '../theme.dart';

class ServiceRecommendation {
  final String serviceName;
  final String eta;
  final String zoneReliability;
  final VoidCallback onProceed;

  ServiceRecommendation({
    required this.serviceName,
    required this.eta,
    required this.zoneReliability,
    required this.onProceed,
  });
}

class PrimaryRecommendation extends StatelessWidget {
  final ServiceRecommendation recommendation;

  const PrimaryRecommendation({Key? key, required this.recommendation})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final systemStatus = Provider.of<SystemStatusProvider>(context);

    return Container(
      height: 200,
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background gradient for depth
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary.withOpacity(0.1),
                    Colors.transparent,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),

          // Content
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reassurance badge
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    "Most reliable right now",
                    style: TextStyle(
                      color: theme.colorScheme.onSecondaryContainer,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),

                SizedBox(height: 16),

                // Service name
                Text(
                  recommendation.serviceName,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),

                SizedBox(height: 8),

                // ETA with reassurance
                Row(
                  children: [
                    Icon(
                      Icons.timer,
                      color: theme.colorScheme.secondary,
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      "${recommendation.eta} • ${recommendation.zoneReliability}",
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),

                Spacer(),

                // Primary CTA - ONLY ONE
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: recommendation.onProceed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      // Slow, confident animations
                      animationDuration: Duration(milliseconds: 350),
                    ),
                    child: Text(
                      "We'll handle this",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
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
