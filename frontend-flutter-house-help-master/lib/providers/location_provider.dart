import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import '../services/api_service.dart';
import '../models/location.dart';

class LocationProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  Location? _currentLocation;
  List<Location> _recentLocations = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _hasCompletedLocationSetup = false;
  bool _hasShownLocationPopup = false;
  dynamic _availabilityStatus;

  Location? get currentLocation => _currentLocation;
  List<Location> get recentLocations => _recentLocations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasCompletedLocationSetup => _hasCompletedLocationSetup;
  bool get hasShownLocationPopup => _hasShownLocationPopup;
  dynamic get availabilityStatus => _availabilityStatus;

  LocationProvider() {
    _loadLocationHistory();
  }

  Future<void> _loadLocationHistory() async {
    // Load recent locations from storage or API
    try {
      // This would typically load from local storage or API
      // For now, we'll just initialize with empty list
      _recentLocations = [];
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading location history: $e');
    }
  }

  Future<bool> requestLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _errorMessage = 'Location services are disabled.';
      notifyListeners();
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _errorMessage = 'Location permissions are denied';
        notifyListeners();
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _errorMessage =
          'Location permissions are permanently denied, we cannot request permissions.';
      notifyListeners();
      return false;
    }

    return true;
  }

  Future<void> getCurrentLocation() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: AndroidSettings(accuracy: LocationAccuracy.high),
      );

      // Convert Position to Location
      final placemarks = await geocoding.placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      _currentLocation = Location(
        address: placemarks.isNotEmpty
            ? placemarks.first.toString()
            : 'Lat: ${position.latitude}, Lng: ${position.longitude}',
        latitude: position.latitude,
        longitude: position.longitude,
        city: placemarks.isNotEmpty ? placemarks.first.locality : null,
        state: placemarks.isNotEmpty
            ? placemarks.first.administrativeArea
            : null,
        country: placemarks.isNotEmpty ? placemarks.first.country : null,
      );

      // Add to recent locations
      _recentLocations.add(_currentLocation!);
      if (_recentLocations.length > 10) {
        _recentLocations.removeAt(0);
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> checkServiceAvailability(
    double lat,
    double lng, [
    double radius = 5.0,
  ]) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.checkServiceAvailability(
        lat,
        lng,
        radius,
      );
      _isLoading = false;
      notifyListeners();
      return response != null && response['available'] == true;
    } catch (e) {
      _errorMessage = 'Error checking service availability';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<List<dynamic>> getAvailableServices(
    double lat,
    double lng, [
    double radius = 5.0,
  ]) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.getAvailableServices(lat, lng, radius);
      _isLoading = false;
      notifyListeners();
      return response ?? [];
    } catch (e) {
      _errorMessage = 'Error fetching available services';
      _isLoading = false;
      notifyListeners();
      return [];
    }
  }

  Future<void> addToWaitlist(
    double lat,
    double lng,
    int estimatedWaitTime,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.addToWaitlist(lat, lng, estimatedWaitTime);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error adding to waitlist';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updatePreferredLocation(
    String userId,
    double lat,
    double lng,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.updatePreferredLocation(userId, lat, lng);
      _hasCompletedLocationSetup = true;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Error updating preferred location';
      _isLoading = false;
      notifyListeners();
    }
  }

  bool needsLocationSetup() {
    return _currentLocation == null || _recentLocations.isEmpty;
  }

  void clearLocationData() {
    _currentLocation = null;
    _recentLocations.clear();
    _hasCompletedLocationSetup = false;
    notifyListeners();
  }

  void setLocationSetupComplete() {
    _hasCompletedLocationSetup = true;
    notifyListeners();
  }

  // Compatibility methods for existing code
  Location? get currentLocationData => _currentLocation;

  void markPopupShown() {
    _hasShownLocationPopup = true;
    notifyListeners();
  }

  void markLocationSetupComplete() {
    _hasCompletedLocationSetup = true;
    notifyListeners();
  }

  Future<void> refreshLocation() async {
    await getCurrentLocation();
  }

  Future<void> setManualLocation(Location location) async {
    _currentLocation = location;
    _recentLocations.add(location);
    if (_recentLocations.length > 10) {
      _recentLocations.removeAt(0);
    }
    _hasCompletedLocationSetup = true;
    notifyListeners();
  }

  Future<void> checkCurrentServiceAvailability() async {
    if (_currentLocation != null) {
      _availabilityStatus = await checkServiceAvailability(
        _currentLocation!.latitude ?? 0.0,
        _currentLocation!.longitude ?? 0.0,
        5.0,
      );
      notifyListeners();
    }
  }

  Future<List<dynamic>> searchLocations(String query) async {
    try {
      final locations = await geocoding.locationFromAddress(query);
      return locations
          .map((loc) => Location.fromGeocodingLocation(loc))
          .toList();
    } catch (e) {
      return [];
    }
  }
}
