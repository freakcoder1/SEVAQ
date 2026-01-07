import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/recommendation.dart';
import '../models/service.dart';
import '../models/worker.dart';
import '../providers/worker_provider.dart';
import '../providers/service_provider.dart';
import '../providers/location_provider.dart';
import '../providers/user_provider.dart';

class RecommendationProvider extends ChangeNotifier {
  Recommendation? _currentRecommendation;
  List<Suggestion> _suggestions = [];
  UserHistory? _userHistory;

  Recommendation? get currentRecommendation => _currentRecommendation;
  List<Suggestion> get suggestions => _suggestions;
  UserHistory? get userHistory => _userHistory;

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  // Generate recommendations based on real-time data
  Future<void> generateRecommendations({
    required WorkerProvider workerProvider,
    required ServiceProvider serviceProvider,
    required LocationProvider locationProvider,
    required UserProvider userProvider,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Get available workers and services
      final workers = workerProvider.workers;
      final services = serviceProvider.services;
      final userLocation = locationProvider.currentLocationData;
      final user = userProvider.currentUser;

      print('RecommendationProvider: Generating recommendations');
      print('Workers count: ${workers.length}');
      print('Services count: ${services.length}');
      print('User location: ${userLocation != null ? 'Available' : 'Null'}');
      print('User: ${user != null ? 'Available' : 'Null'}');

      if (workers.isEmpty || services.isEmpty || userLocation == null) {
        print('RecommendationProvider: Using fallback suggestions');
        _isLoading = false;
        _suggestions = _generateFallbackSuggestions(services);
        notifyListeners();
        return;
      }

      // Generate primary recommendation
      _currentRecommendation = _generatePrimaryRecommendation(
        workers: workers,
        services: services,
        userLocation: userLocation,
        user: user,
      );

      // Generate smart suggestions
      _suggestions = _generateSmartSuggestions(
        workers: workers,
        services: services,
        userLocation: userLocation,
        user: user,
      );

      // Generate user history
      _userHistory = _generateUserHistory(userProvider: userProvider);
    } catch (e) {
      _error = e.toString();
      _suggestions = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Recommendation _generatePrimaryRecommendation({
    required List<Worker> workers,
    required List<Service> services,
    required dynamic userLocation,
    required dynamic user,
  }) {
    // Sort workers by reliability (rating, review count)
    final availableWorkers = List<Worker>.from(workers);
    availableWorkers.sort((a, b) {
      final scoreA = (a.rating * 10) + (a.reviewCount * 0.1);
      final scoreB = (b.rating * 10) + (b.reviewCount * 0.1);
      return scoreB.compareTo(scoreA);
    });

    // Get most popular service category
    final popularService = services.isNotEmpty ? services.first : null;

    // Calculate estimated arrival time (simplified for now)
    final estimatedTime = availableWorkers.isNotEmpty ? 25 : 30;

    // Create recommendation
    return Recommendation(
      service: popularService ?? services.first,
      worker: availableWorkers.isNotEmpty
          ? availableWorkers.first
          : workers.first,
      estimatedArrivalTime: estimatedTime,
      reliabilityScore: 0.95, // High reliability for primary recommendation
      reasoning: 'Most reliable worker available in your area',
      title: 'Most reliable right now',
    );
  }

  List<Suggestion> _generateSmartSuggestions({
    required List<Worker> workers,
    required List<Service> services,
    required dynamic userLocation,
    required dynamic user,
  }) {
    final suggestions = <Suggestion>[];

    // 1. Usually booked at this time (based on time of day)
    final currentHour = DateTime.now().hour;
    final isEvening = currentHour >= 17 && currentHour <= 20;

    if (isEvening &&
        services.any((s) => s.category.toLowerCase().contains('cleaning'))) {
      suggestions.add(
        Suggestion.usuallyBooked(
          serviceType: 'Evening cleaning service',
          onTap: () => _handleSuggestionTap(SuggestionType.usuallyBooked),
        ),
      );
    }

    // 2. Repeat service (if user has booking history)
    if (user != null) {
      // For now, just use a generic repeat suggestion
      suggestions.add(
        Suggestion.repeatService(
          serviceName: 'Professional cleaning',
          lastBooked: '2 weeks ago',
          onTap: () => _handleSuggestionTap(SuggestionType.repeatService),
        ),
      );
    }

    // 3. Safe option (highly rated workers)
    final safeWorkers = workers.where((w) => w.rating >= 4.5).toList();
    if (safeWorkers.isNotEmpty) {
      suggestions.add(
        Suggestion.safeOption(
          serviceType: 'Professional service',
          onTap: () => _handleSuggestionTap(SuggestionType.safeOption),
        ),
      );
    }

    // 4. Fast booking option
    suggestions.add(
      Suggestion.highlyRated(
        serviceType: 'Quick service',
        rating: 4.8,
        onTap: () => _handleSuggestionTap(SuggestionType.fastBooking),
      ),
    );

    return suggestions.take(3).toList(); // Limit to 3 suggestions
  }

  UserHistory _generateUserHistory({required UserProvider userProvider}) {
    final user = userProvider.currentUser;
    if (user == null) {
      return UserHistory(totalBookings: 0);
    }

    // Create a mock user history based on available data
    return UserHistory(
      favoriteWorker: null, // Would come from booking history
      lastBookedService: null, // Would come from booking history
      lastBookingDate: DateTime.now().subtract(Duration(days: 15)),
      totalBookings: 3,
    );
  }

  List<Suggestion> _generateFallbackSuggestions(List<Service> services) {
    return [
      Suggestion.usuallyBooked(
        serviceType: services.isNotEmpty ? services.first.name : 'Cleaning',
        onTap: () => _handleSuggestionTap(SuggestionType.usuallyBooked),
      ),
      Suggestion.safeOption(
        serviceType: 'Professional service',
        onTap: () => _handleSuggestionTap(SuggestionType.safeOption),
      ),
    ];
  }

  void _handleSuggestionTap(SuggestionType type) {
    // Handle suggestion tap - this would navigate to appropriate screen
    // For now, just notify listeners
    notifyListeners();
  }

  // Helper methods
  double _calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const R = 6371; // Earth's radius in km
    final dLat = _deg2rad(lat2 - lat1);
    final dLon = _deg2rad(lon2 - lon1);
    final a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(_deg2rad(lat1)) *
            cos(_deg2rad(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  double _deg2rad(double deg) {
    return deg * (pi / 180);
  }

  int _calculateEstimatedArrivalTime(Worker worker, dynamic userLocation) {
    // Simplified calculation for now
    return 25; // Default 25 minutes
  }

  String _formatLastBooking(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      if (diff.inHours == 0) {
        return 'Today';
      }
      return '${diff.inHours} hours ago';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return DateFormat('MMM d').format(date);
    }
  }

  // Refresh recommendations
  Future<void> refreshRecommendations({
    required WorkerProvider workerProvider,
    required ServiceProvider serviceProvider,
    required LocationProvider locationProvider,
    required UserProvider userProvider,
  }) {
    return generateRecommendations(
      workerProvider: workerProvider,
      serviceProvider: serviceProvider,
      locationProvider: locationProvider,
      userProvider: userProvider,
    );
  }
}
