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
      id: 'cleaning',
      name: 'Home Cleaning',
      description: 'Structured home cleanliness & maintenance',
      icon: Icons.cleaning_services,
      type: ServiceType.cleaning,
      basePrice: 49.0, // Matches Home Cleaning (ID: 1) base price ₹49/hr
    ),
    ServiceOption(
      id: 'cooking',
      name: 'Cooking Help',
      description: 'Meal preparation & kitchen assistance',
      icon: Icons.restaurant,
      type: ServiceType.cooking,
      basePrice: 149.0, // Matches Cooking Service (ID: 9) base price ₹149/hr
    ),
  ];

  /// Get reassurance badge for this service option
  String getReassuranceBadge() {
    switch (type) {
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
      default:
        return ['Other'];
    }
  }
}

/// Service type enum for categorization
enum ServiceType {
  cleaning,
  cooking,
  errands,
  driving,
  laundry,
  childcare,
  gardening,
  care,
}
