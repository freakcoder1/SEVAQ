import 'package:flutter/material.dart';
import '../models/recommendation.dart';
import '../providers/location_provider.dart';

class TrustHeader extends StatelessWidget {
  final String location;
  final SystemStatusData systemStatus;
  final int availableWorkers;

  const TrustHeader({
    Key? key,
    required this.location,
    required this.systemStatus,
    required this.availableWorkers,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          // Left: Location Section
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, color: Colors.green[700], size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            location,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 2),
                          Text(
                            '📍 Your preferred zone',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Right: System Status
          _buildSystemStatusBadge(context),
        ],
      ),
    );
  }

  Widget _buildSystemStatusBadge(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: systemStatus.statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: systemStatus.statusColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            systemStatus.statusIcon,
            color: systemStatus.statusColor,
            size: 16,
          ),
          SizedBox(width: 6),
          Text(
            systemStatus.displayText,
            style: TextStyle(
              fontSize: 12,
              color: systemStatus.statusColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(width: 6),
          if (systemStatus.availableWorkers > 0)
            Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: systemStatus.statusColor.withOpacity(0.3),
                ),
              ),
              child: Text(
                '${systemStatus.availableWorkers} workers',
                style: TextStyle(
                  fontSize: 10,
                  color: systemStatus.statusColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
