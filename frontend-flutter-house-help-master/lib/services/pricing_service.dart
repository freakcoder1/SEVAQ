import 'api_service.dart';

/// Pricing Service for Sevaq Subscription Plans
/// Implements exact pricing rules for Cleaning and Cooking services
class PricingService {
  static final PricingService _instance = PricingService._internal();
  factory PricingService() => _instance;
  PricingService._internal();

  final ApiService _apiService = ApiService();

  // Cleaning prices lookup table
  static const Map<int, int> _cleaningPrices = {1: 1999, 2: 2999, 3: 3999};

  // Full day cooking prices
  static const Map<int, int> _cookingFullDayPrices = {
    1: 4499,
    2: 6999,
    3: 9299,
    4: 11499,
    5: 13499,
    6: 15299,
  };

  // Meal plan prices by person count
  static const Map<int, Map<String, int>> _cookingMealPrices = {
    1: {
      'BF': 1299,
      'LUNCH': 1599,
      'DINNER': 1599,
      'BF_LUNCH': 2599,
      'LUNCH_DINNER': 2899,
    },
    2: {
      'BF': 1999,
      'LUNCH': 2499,
      'DINNER': 2499,
      'BF_LUNCH': 3999,
      'LUNCH_DINNER': 4499,
    },
    3: {
      'BF': 2599,
      'LUNCH': 3299,
      'DINNER': 3299,
      'BF_LUNCH': 5299,
      'LUNCH_DINNER': 5999,
    },
    4: {
      'BF': 3199,
      'LUNCH': 3999,
      'DINNER': 3999,
      'BF_LUNCH': 6499,
      'LUNCH_DINNER': 7299,
    },
    5: {
      'BF': 3699,
      'LUNCH': 4699,
      'DINNER': 4699,
      'BF_LUNCH': 7499,
      'LUNCH_DINNER': 8499,
    },
    6: {
      'BF': 4199,
      'LUNCH': 5299,
      'DINNER': 5299,
      'BF_LUNCH': 8499,
      'LUNCH_DINNER': 9599,
    },
  };

  /// Valid meal plan codes
  static const List<String> validMealPlans = [
    'BF',
    'LUNCH',
    'DINNER',
    'BF_LUNCH',
    'LUNCH_DINNER',
    'FULL_DAY',
  ];

  /// Calculate cleaning subscription price
  int calculateCleaningPrice(int bhkType) {
    if (!_cleaningPrices.containsKey(bhkType)) {
      throw ArgumentError('Invalid BHK type. Must be 1, 2, or 3.');
    }
    return _cleaningPrices[bhkType]!;
  }

  /// Calculate cooking subscription price
  int calculateCookingPrice(int persons, String mealPlan) {
    // Validate persons count
    if (persons < 1 || persons > 6) {
      throw ArgumentError(
        'Invalid number of persons. Must be an integer between 1 and 6.',
      );
    }

    // Validate meal plan
    if (!validMealPlans.contains(mealPlan)) {
      throw ArgumentError(
        'Invalid meal plan. Must be one of: ${validMealPlans.join(', ')}',
      );
    }

    // Handle full day plan
    if (mealPlan == 'FULL_DAY') {
      return _cookingFullDayPrices[persons]!;
    }

    // Handle individual meal plans
    return _cookingMealPrices[persons]![mealPlan]!;
  }

  /// Get cleaning price from backend API
  Future<int> fetchCleaningPrice(int bhkType) async {
    final response = await _apiService.get(
      'subscriptions/pricing/cleaning/$bhkType',
    );
    if (response != null && response['success'] == true) {
      return response['price'];
    }
    throw Exception(response?['message'] ?? 'Failed to fetch cleaning price');
  }

  /// Get cooking price from backend API
  Future<int> fetchCookingPrice(int persons, String mealPlan) async {
    final response = await _apiService.get(
      'subscriptions/pricing/cooking/$persons/$mealPlan',
    );
    if (response != null && response['success'] == true) {
      return response['price'];
    }
    throw Exception(response?['message'] ?? 'Failed to fetch cooking price');
  }
}
