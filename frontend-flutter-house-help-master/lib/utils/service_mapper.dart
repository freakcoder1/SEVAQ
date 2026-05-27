/// Service Mapper Utility
/// Maps frontend service IDs to backend numeric service IDs
/// This fixes the mismatch between frontend simple IDs and backend numeric IDs

import '../models/worker.dart';

class ServiceMapper {
  // Backend numeric service IDs from the database
  // Current database IDs: 1 (Home Cleaning), 3 (Cooking)
  static const int homeCleaningId = 1; // ID 1 = Home Cleaning
  static const int cookingId = 3; // ID 3 = Cooking

  /// Map frontend service option ID to backend service ID
  static String mapToFrontendId(int backendId) {
    switch (backendId) {
      case homeCleaningId:
        return 'cleaning';
      case cookingId:
        return 'cooking';
      default:
        return 'cleaning'; // Default fallback
    }
  }

  /// Map frontend service option ID to backend service IDs
  static List<int> mapToBackendIds(String frontendId) {
    switch (frontendId) {
      case 'cleaning':
        // Use ID 1 (Home Cleaning) which exists in database
        return [homeCleaningId];
      case 'cooking':
        // Use ID 3 (Cooking) which exists in database
        return [cookingId];
      default:
        // Default to home cleaning (ID 1) as fallback
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
