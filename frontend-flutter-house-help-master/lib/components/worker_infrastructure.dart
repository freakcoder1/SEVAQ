import 'package:flutter/material.dart';
import '../theme.dart';

class WorkerInfrastructure extends StatelessWidget {
  final String firstName;
  final String lastName;
  final bool isAvailable;
  final int yearsOfExperience;
  final int homesServedInArea;
  final int reliabilityStreak;
  final bool isVerified;
  final bool isTrained;
  final bool isFrequentInBuilding;
  final bool previouslyBooked;

  const WorkerInfrastructure({
    Key? key,
    required this.firstName,
    required this.lastName,
    required this.isAvailable,
    required this.yearsOfExperience,
    required this.homesServedInArea,
    required this.reliabilityStreak,
    required this.isVerified,
    required this.isTrained,
    required this.isFrequentInBuilding,
    required this.previouslyBooked,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Human anchor - ONLY ONE
          if (previouslyBooked)
            _buildHumanAnchor(context, "Previously booked by you"),
          if (!previouslyBooked && isFrequentInBuilding)
            _buildHumanAnchor(context, "Frequently assigned in your building"),
          if (!previouslyBooked && !isFrequentInBuilding)
            _buildHumanAnchor(context, "Commonly serves your area"),

          SizedBox(height: 12),

          // Infrastructure status
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: isAvailable
                      ? theme.colorScheme.primaryContainer
                      : theme.colorScheme.surfaceVariant,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isAvailable
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline,
                    width: 2,
                  ),
                ),
                child: Icon(
                  isAvailable ? Icons.check_circle : Icons.hourglass_empty,
                  color: isAvailable
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outline,
                  size: 32,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$firstName $lastName',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Infrastructure Status: ${isAvailable ? 'Available and on track' : 'Service adjustment needed'}',
                      style: TextStyle(
                        color: isAvailable
                            ? theme.colorScheme.primary
                            : theme.colorScheme.error,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: 16),

          // System metrics
          _buildMetricRow(context, 'Experience', '${yearsOfExperience} years'),
          _buildMetricRow(
            context,
            'Reliability',
            '${reliabilityStreak} consecutive on-time visits',
          ),
          _buildMetricRow(
            context,
            'Coverage',
            '${homesServedInArea} homes in your area',
          ),

          SizedBox(height: 16),

          // System backing
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.verified, color: theme.colorScheme.primary),
                SizedBox(width: 8),
                Text(
                  'Verified & trained by Sevaq • Continuously monitored',
                  style: TextStyle(
                    color: theme.colorScheme.onPrimaryContainer,
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

  Widget _buildHumanAnchor(BuildContext context, String text) {
    final theme = Theme.of(context);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.home, color: theme.colorScheme.secondary, size: 14),
          SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: theme.colorScheme.onSecondaryContainer,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricRow(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Container(
      margin: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
          Spacer(),
          Text(
            value,
            style: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
