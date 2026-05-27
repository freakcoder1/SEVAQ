import 'package:flutter/material.dart';

/// Contextual message service for live household intelligence
class ContextualMessageService {
  /// Get contextual message based on time and household state
  static String getHeroMessage({
    required TimeOfDay currentTime,
    required int activeOperations,
    required int backupProfessionals,
  }) {
    final hour = currentTime.hour;

    if (hour >= 6 && hour < 10) {
      return 'Morning support ready for your household';
    } else if (hour >= 10 && hour < 14) {
      return 'Midday operations running smoothly';
    } else if (hour >= 14 && hour < 18) {
      return 'Afternoon support optimized for your routine';
    } else if (hour >= 18 && hour < 22) {
      return 'Evening support scheduled for your needs';
    } else {
      return 'Night operations stable and secure';
    }
  }

  /// Get contextual message for operations status
  static String getOperationsMessage({
    required int activeOperations,
    required int backupProfessionals,
    required int avgResponseTime,
  }) {
    if (activeOperations == 0) {
      return 'Your household operations are stable today';
    } else if (activeOperations == 1) {
      return '1 active operation in progress';
    } else {
      return '$activeOperations operations running smoothly';
    }
  }

  /// Get contextual message for professional availability
  static String getAvailabilityMessage({
    required int professionalsNearby,
    required int avgResponseTime,
    required int backupProfessionals,
  }) {
    if (backupProfessionals > 0) {
      return '$backupProfessionals backup household support available nearby';
    } else if (professionalsNearby > 10) {
      return 'Strong professional network in your area';
    } else {
      return '$professionalsNearby professionals nearby • $avgResponseTime min avg response';
    }
  }

  /// Get contextual message for service cards
  static String getServiceMessage({
    required String serviceName,
    required TimeOfDay currentTime,
    required bool hasActiveOperation,
  }) {
    final hour = currentTime.hour;

    if (serviceName == 'Cooking Assistance' ||
        serviceName == 'Kitchen Operations') {
      if (hour >= 17 && hour <= 19) {
        return 'Dinner prep support arriving before peak traffic';
      } else if (hour >= 6 && hour <= 9) {
        return 'Breakfast support optimized for morning routine';
      }
      return 'Kitchen support ready when you need it';
    }

    if (serviceName == 'Housekeeping' || serviceName == 'Home Maintenance') {
      if (hasActiveOperation) {
        return 'Deep clean in progress, maintaining your space';
      }
      return 'Home maintenance scheduled for optimal times';
    }

    return 'Reliable support for your household needs';
  }

  /// Get workload insight message
  static String getWorkloadInsight({
    required int weeklyServices,
    required int workloadReduction,
  }) {
    if (workloadReduction > 0) {
      return 'Household workload reduced by $workloadReduction% this week';
    } else if (weeklyServices > 0) {
      return '$weeklyServices services completed this week';
    }
    return 'Your household is running efficiently';
  }

  /// Get predictive message
  static String getPredictiveMessage({
    required String nextService,
    required int minutesUntilArrival,
  }) {
    if (minutesUntilArrival > 0 && minutesUntilArrival <= 30) {
      return 'Your $nextService support arrives in $minutesUntilArrival mins';
    }
    return 'Next service scheduled and confirmed';
  }
}
