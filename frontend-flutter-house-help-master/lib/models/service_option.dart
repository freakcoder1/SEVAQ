import 'package:flutter/material.dart';

/// Service option model for the Service Clarification Page
/// Represents the different types of help users can select
class ServiceOption {
  final String id;
  final String name;
  final String description;
  final IconData icon;
  final ServiceType type;

  const ServiceOption({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.type,
  });

  /// Predefined service options for the clarification page
  static const List<ServiceOption> options = [
    ServiceOption(
      id: 'maid',
      name: 'Maid / House Help',
      description: 'Ongoing daily household assistance',
      icon: Icons.home_repair_service,
      type: ServiceType.maid,
    ),
    ServiceOption(
      id: 'cleaning',
      name: 'Home Cleaning',
      description: 'Used for one-time or periodic cleaning',
      icon: Icons.cleaning_services,
      type: ServiceType.cleaning,
    ),
    ServiceOption(
      id: 'cooking',
      name: 'Cooking Help',
      description: 'Used for daily meal preparation or kitchen assistance',
      icon: Icons.restaurant,
      type: ServiceType.cooking,
    ),
  ];

  /// Get reassurance badge for this service option
  /// Only Maid/House Help gets the green recommendation badge
  String getReassuranceBadge() {
    switch (type) {
      case ServiceType.maid:
        return '🟢 Typically assigned for regular household needs';
      case ServiceType.cleaning:
        return 'Used for one-time or periodic cleaning';
      case ServiceType.cooking:
        return 'Used for daily meal preparation or kitchen assistance';
      default:
        return 'Trusted service option';
    }
  }

  /// Get contextual follow-up question for this service type
  String getContextualQuestion() {
    switch (type) {
      case ServiceType.cleaning:
        return 'Anything specific we should know? (Optional)';
      case ServiceType.cooking:
        return 'Any dietary preferences? (Optional)';
      case ServiceType.maid:
        return 'How often do you need help? (Optional)';
      default:
        return 'Anything else we should know? (Optional)';
    }
  }

  /// Get contextual follow-up options for this service type
  List<String> getContextualOptions() {
    switch (type) {
      case ServiceType.cleaning:
        return [
          'Full home',
          'Kitchen focus',
          'Bathroom focus',
          'Just a touch-up',
        ];
      case ServiceType.cooking:
        return [
          'Vegetarian',
          'Non-vegetarian',
          'Indian cuisine',
          'Continental',
        ];
      case ServiceType.maid:
        return ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];
      default:
        return ['Other'];
    }
  }
}

/// Service type enum for categorization
enum ServiceType { cleaning, cooking, maid, errands }
