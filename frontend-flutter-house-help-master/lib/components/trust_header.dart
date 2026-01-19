import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/system_status_provider.dart';
import '../theme.dart';

class TrustHeader extends StatelessWidget {
  final String location;

  const TrustHeader({Key? key, required this.location}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final systemStatus = Provider.of<SystemStatusProvider>(context);

    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location with subtle verification
          Row(
            children: [
              Icon(
                Icons.location_on,
                color: theme.colorScheme.secondary,
                size: 16,
              ),
              SizedBox(width: 8),
              Text(
                location,
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.check_circle, color: Colors.green, size: 16),
            ],
          ),

          SizedBox(height: 8),

          // System status - CRITICAL
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: systemStatus.isHealthy
                  ? theme.colorScheme.primaryContainer
                  : theme.colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  systemStatus.isHealthy ? Icons.check_circle : Icons.warning,
                  color: systemStatus.isHealthy
                      ? theme.colorScheme.primary
                      : theme.colorScheme.error,
                  size: 16,
                ),
                SizedBox(width: 8),
                Text(
                  systemStatus.isHealthy
                      ? "All services on track"
                      : "Service adjustment needed",
                  style: TextStyle(
                    color: systemStatus.isHealthy
                        ? theme.colorScheme.primary
                        : theme.colorScheme.error,
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
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
