/// Service Mapper Utility
/// Maps frontend service IDs to backend numeric service IDs
/// This fixes the mismatch between frontend simple IDs and backend numeric IDs

import '../models/worker.dart';

class ServiceMapper {
  // Backend numeric service IDs from the database
  static const int homeCleaningId = 1;
  static const int cookingId = 3;
  static const int driverId = 5;
  static const int errandsId = 6;
  static const int laundryId = 7;
  static const int babysittingId = 8;
  static const int gardeningId = 9;
  static const int seniorCareId = 10;
  static const int shoppingId = 12;

  /// Map frontend service option ID to backend service ID
  static String mapToFrontendId(int backendId) {
    switch (backendId) {
      case homeCleaningId:
        return 'cleaning';
      case cookingId:
        return 'cooking';
      case driverId:
        return 'driver';
      case errandsId:
        return 'errands';
      case laundryId:
        return 'laundry';
      case babysittingId:
        return 'babysitting';
      case gardeningId:
        return 'gardening';
      case seniorCareId:
        return 'senior_care';
      case shoppingId:
        return 'shopping';
      default:
        return 'cleaning'; // Default fallback
    }
  }

  /// Map frontend service option ID to backend service IDs
  static List<int> mapToBackendIds(String frontendId) {
    switch (frontendId) {
      case 'maid':
        // Maid service can use any cleaning or cooking service
        return [homeCleaningId, cookingId];
      case 'cleaning':
        return [homeCleaningId];
      case 'cooking':
        return [cookingId];
      case 'driver':
        return [driverId];
      case 'errands':
        return [errandsId];
      case 'laundry':
        return [laundryId];
      case 'babysitting':
        return [babysittingId];
      case 'gardening':
        return [gardeningId];
      case 'senior_care':
        return [seniorCareId];
      case 'shopping':
        return [shoppingId];
      default:
        return [homeCleaningId, cookingId];
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
