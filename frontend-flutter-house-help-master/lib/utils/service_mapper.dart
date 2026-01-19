/// Service Mapper Utility
/// Maps frontend service IDs to backend UUID service IDs
/// This fixes the mismatch between frontend simple IDs and backend UUIDs

import '../models/worker.dart';

class ServiceMapper {
  // Backend UUID service IDs from the database
  static const String homeCleaningId = '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b';
  static const String deepCleaningId = 'e8003676-f554-41d0-b41e-a0fb5fec7c51';
  static const String cookingId = '7f8e4b5c-a883-4c6c-b348-f966508fd49d';
  static const String mealPreparationId =
      '6a7ae1cd-ba09-4970-8a2f-f911efcd196f';

  /// Map frontend service option ID to backend service ID
  static String mapToFrontendId(String backendId) {
    switch (backendId) {
      case homeCleaningId:
        return 'cleaning';
      case deepCleaningId:
        return 'cleaning';
      case cookingId:
        return 'cooking';
      case mealPreparationId:
        return 'cooking';
      default:
        return 'cleaning'; // Default fallback
    }
  }

  /// Map frontend service option ID to backend service IDs
  static List<String> mapToBackendIds(String frontendId) {
    switch (frontendId) {
      case 'maid':
        // Maid service can use any cleaning or cooking service
        return [homeCleaningId, deepCleaningId, cookingId, mealPreparationId];
      case 'cleaning':
        // Cleaning service uses cleaning-related backend services
        return [homeCleaningId, deepCleaningId];
      case 'cooking':
        // Cooking service uses cooking-related backend services
        return [cookingId, mealPreparationId];
      default:
        // Default fallback to all services
        return [homeCleaningId, deepCleaningId, cookingId, mealPreparationId];
    }
  }

  /// Check if a worker has services that match the frontend service ID
  static bool workerMatchesServiceId(Worker worker, String frontendServiceId) {
    final backendIds = mapToBackendIds(frontendServiceId);

    // Check if worker has any of the matching backend service IDs
    return worker.services.any((service) => backendIds.contains(service.id));
  }

  /// Get a representative backend service ID for a frontend service ID
  static String getRepresentativeBackendId(String frontendId) {
    final backendIds = mapToBackendIds(frontendId);
    return backendIds.isNotEmpty ? backendIds.first : homeCleaningId;
  }
}
