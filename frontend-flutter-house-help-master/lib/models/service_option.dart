import 'package:flutter/material.dart';

/// Service option model for the Service Clarification Page
/// Represents the different types of help users can select
class ServiceOption {
  final String id;
  final String name;
  final String description;
  final IconData icon;
  final ServiceType type;
  final double basePrice;

  const ServiceOption({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.type,
    required this.basePrice,
  });

  /// Predefined service options for the clarification page
  static const List<ServiceOption> options = [
    ServiceOption(
      id: 'maid',
      name: 'Maid / House Help',
      description: 'Ongoing household assistance',
      icon: Icons.person,
      type: ServiceType.maid,
      basePrice: 1500.0,
    ),
    ServiceOption(
      id: 'cleaning',
      name: 'Home Cleaning',
      description: 'Structured home cleanliness & maintenance',
      icon: Icons.cleaning_services,
      type: ServiceType.cleaning,
      basePrice: 500.0, // Matches Home Cleaning (ID: 1) base price
    ),
    ServiceOption(
      id: 'cooking',
      name: 'Cooking Help',
      description: 'Meal preparation & kitchen assistance',
      icon: Icons.restaurant,
      type: ServiceType.cooking,
      basePrice: 400.0, // Matches Cooking (ID: 3) base price
    ),
  ];

  /// Get reassurance badge for this service option
  /// Only Maid/House Help gets the green recommendation badge
  String getReassuranceBadge() {
    switch (type) {
      case ServiceType.maid:
        return '🟢 Optimized for ongoing household needs';
      case ServiceType.cleaning:
        return 'Structured home cleanliness & maintenance';
      case ServiceType.cooking:
        return 'Meal preparation & kitchen assistance';
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
enum ServiceType {
  cleaning,
  cooking,
  maid,
  errands,
  driving,
  laundry,
  childcare,
  gardening,
  care,
}
