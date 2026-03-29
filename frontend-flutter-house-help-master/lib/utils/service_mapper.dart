/// Service Mapper Utility
/// Maps frontend service IDs to backend numeric service IDs
/// This fixes the mismatch between frontend simple IDs and backend numeric IDs

import '../models/worker.dart';

class ServiceMapper {
  // Backend numeric service IDs from the database
  // Current Railway database IDs: 2, 3, 4, 5, 12
  static const int homeCleaningId = 2; // ID 2 = Home Cleaning
  static const int deepCleaningId = 3; // ID 3 = Deep Cleaning
  static const int cookingId = 4; // ID 4 = Cooking
  static const int mealPreparationId = 5; // ID 5 = Meal Preparation
  static const int healthyMealsId = 12; // ID 12 = Healthy Meals

  /// Map frontend service option ID to backend service ID
  static String mapToFrontendId(int backendId) {
    switch (backendId) {
      case homeCleaningId:
      case deepCleaningId:
        return 'cleaning';
      case cookingId:
      case mealPreparationId:
      case healthyMealsId:
        return 'cooking';
      default:
        return 'cleaning'; // Default fallback
    }
  }

  /// Map frontend service option ID to backend service IDs
  static List<int> mapToBackendIds(String frontendId) {
    switch (frontendId) {
      case 'maid':
      case 'cleaning':
        // Use ID 2 (Home Cleaning) which exists in database
        return [homeCleaningId];
      case 'cooking':
        // Use ID 4 (Cooking) which exists in database
        return [cookingId];
      case 'deep_cleaning':
        // Use ID 3 (Deep Cleaning) which exists in database
        return [deepCleaningId];
      case 'meal_prep':
        // Use ID 5 (Meal Preparation) which exists in database
        return [mealPreparationId];
      case 'healthy_meals':
        // Use ID 12 (Healthy Meals) which exists in database
        return [healthyMealsId];
      default:
        // Default to home cleaning (ID 2) as fallback
        return [homeCleaningId];
    }
  }

  /// Check if a worker has services that match the frontend service ID
  static bool workerMatchesServiceId(Worker worker, String frontendServiceId) {
    final backendIds = mapToBackendIds(frontendServiceId);

    // Check if worker has any of the matching backend service IDs
    return worker.services.any((service) => backendIds.contains(service.id));
  }

  /// Get a representative backend service ID for a frontend service ID
  static int getRepresentativeBackendId(String frontendId) {
    final backendIds = mapToBackendIds(frontendId);
    return backendIds.isNotEmpty ? backendIds.first : homeCleaningId;
  }
}
