import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/location.dart';

class LocationProvider with ChangeNotifier {
  static const String _LOCATION_DATA_KEY = 'location_data';
  static const String _LOCATION_SETUP_COMPLETE_KEY = 'location_setup_complete';

  // Persistent storage keys for static cache (stored in SharedPreferences)
  static const String _CACHED_LAT_KEY = 'cached_location_lat';
  static const String _CACHED_LNG_KEY = 'cached_location_lng';
  static const String _CACHED_ADDRESS_KEY = 'cached_location_address';
  static const String _CACHED_SETUP_KEY = 'cached_has_completed_setup';

  final ApiService _apiService = ApiService();

  Location? _currentLocation;
  List<Location> _recentLocations = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _hasCompletedLocationSetup = false;
  bool _hasShownLocationPopup = false;
  dynamic _availabilityStatus;

  // Ready flag - true when initial load from storage is complete
  bool _ready = false;
  bool get ready => _ready;

  Location? get currentLocation => _currentLocation;
  List<Location> get recentLocations => _recentLocations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasCompletedLocationSetup => _hasCompletedLocationSetup;
  bool get hasShownLocationPopup => _hasShownLocationPopup;
  dynamic get availabilityStatus => _availabilityStatus;

  // Pre-initialized SharedPreferences instance (passed from main.dart)
  final SharedPreferences? _prefs;

  // Static cache for synchronous access during app resume
  // CRITICAL: These persist in SharedPreferences across Flutter engine restarts
  static bool? _cachedHasCompletedLocationSetup = null;
  static Location? _cachedCurrentLocation = null;

  LocationProvider({SharedPreferences? prefs}) : _prefs = prefs {
    debugPrint(
      'LocationProvider: Constructor called with prefs: ${prefs != null}',
    );
    // IMMEDIATELY try to restore from persistent cache
    _restoreFromPersistentCache();
    // Then asynchronously refresh from SharedPreferences
    _loadFromPrefs();
  }

  void _restoreFromPersistentCache() {
    // Try to restore from static cache first (fastest path)
    if (_cachedHasCompletedLocationSetup == true &&
        _cachedCurrentLocation != null) {
      _hasCompletedLocationSetup = true;
      _currentLocation = _cachedCurrentLocation;
      _recentLocations = [_cachedCurrentLocation!];
      _ready = true;
      debugPrint('LocationProvider: Restored from static memory cache');
      return;
    }

    // If we have a pre-initialized SharedPreferences instance, use it synchronously
    if (_prefs != null) {
      try {
        // Check for legacy format
        final hasCompletedSetup =
            _prefs!.getBool(_LOCATION_SETUP_COMPLETE_KEY) ?? false;

        if (hasCompletedSetup) {
          final locationJson = _prefs!.getString(_LOCATION_DATA_KEY);
          if (locationJson != null) {
            try {
              final loadedLocation = Location.fromJson(
                jsonDecode(locationJson),
              );
              _currentLocation = loadedLocation;
              _recentLocations = [loadedLocation];
              _cachedCurrentLocation = loadedLocation;
              _hasCompletedLocationSetup = true;
              _cachedHasCompletedLocationSetup = true;
              _ready = true;
              debugPrint(
                'LocationProvider: Restored synchronously from passed prefs (legacy format)',
              );
              notifyListeners();
              return;
            } catch (e) {
              debugPrint('Error parsing saved location: $e');
            }
          }
        }

        // Check for new cache format
        final cachedSetup = _prefs!.getBool(_CACHED_SETUP_KEY) ?? false;
        if (cachedSetup) {
          final cachedLat = _prefs!.getDouble(_CACHED_LAT_KEY);
          final cachedLng = _prefs!.getDouble(_CACHED_LNG_KEY);
          final cachedAddress = _prefs!.getString(_CACHED_ADDRESS_KEY);

          if (cachedLat != null && cachedLng != null && cachedAddress != null) {
            final cachedLocation = Location(
              address: cachedAddress,
              latitude: cachedLat,
              longitude: cachedLng,
            );
            _currentLocation = cachedLocation;
            _recentLocations = [cachedLocation];
            _cachedCurrentLocation = cachedLocation;
            _hasCompletedLocationSetup = true;
            _cachedHasCompletedLocationSetup = true;
            _ready = true;
            debugPrint(
              'LocationProvider: Restored synchronously from passed prefs (cache format)',
            );
            notifyListeners();
            return;
          }
        }

        // Setup not completed yet
        _ready = true;
        debugPrint(
          'LocationProvider: No cached location found in passed prefs',
        );
        return;
      } catch (e) {
        debugPrint('LocationProvider: Error reading passed prefs: $e');
        _ready = true;
      }
    }

    // No pre-initialized prefs, waiting for async load
    debugPrint('LocationProvider: No prefs available, waiting for async load');
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // First check for legacy format
      final hasCompletedSetup =
          prefs.getBool(_LOCATION_SETUP_COMPLETE_KEY) ?? false;

      if (hasCompletedSetup) {
        _hasCompletedLocationSetup = true;

        final locationJson = prefs.getString(_LOCATION_DATA_KEY);
        if (locationJson != null) {
          try {
            final loadedLocation = Location.fromJson(jsonDecode(locationJson));
            _currentLocation = loadedLocation;
            _recentLocations = [loadedLocation];

            // Update static cache immediately
            _cachedHasCompletedLocationSetup = true;
            _cachedCurrentLocation = loadedLocation;
            _ready = true;

            debugPrint('LocationProvider: Loaded from prefs, ready=true');
            notifyListeners();
          } catch (e) {
            debugPrint('Error parsing saved location: $e');
            _ready = true; // Mark as ready even if parse fails
          }
        } else {
          _ready = true; // Mark as ready if no location found
        }
      } else {
        // Check if we have cached values in the new format
        final cachedSetup = prefs.getBool(_CACHED_SETUP_KEY) ?? false;
        if (cachedSetup) {
          final cachedLat = prefs.getDouble(_CACHED_LAT_KEY);
          final cachedLng = prefs.getDouble(_CACHED_LNG_KEY);
          final cachedAddress = prefs.getString(_CACHED_ADDRESS_KEY);

          if (cachedLat != null && cachedLng != null && cachedAddress != null) {
            final cachedLocation = Location(
              address: cachedAddress,
              latitude: cachedLat,
              longitude: cachedLng,
            );
            _currentLocation = cachedLocation;
            _recentLocations = [cachedLocation];
            _cachedCurrentLocation = cachedLocation;
            _hasCompletedLocationSetup = true;
            _cachedHasCompletedLocationSetup = true;
            _ready = true;
            debugPrint('LocationProvider: Restored from new cache format');
            notifyListeners();
            return;
          }
        }
        _ready = true; // Mark as ready if setup not completed
      }
    } catch (e) {
      debugPrint('LocationProvider: Error reading prefs: $e');
      _ready = true; // Mark as ready on error
    }
  }

  bool needsLocationSetup() {
    // Fast path: If we're ready and have a location, no setup needed
    if (_ready && _hasCompletedLocationSetup && _currentLocation != null) {
      return false;
    }

    // Check static cache first (fastest, survives hot reload but NOT cold restart)
    if (_cachedHasCompletedLocationSetup == true &&
        _cachedCurrentLocation != null) {
      // Restore state from static cache immediately
      _hasCompletedLocationSetup = true;
      _currentLocation = _cachedCurrentLocation;
      _recentLocations = [_cachedCurrentLocation!];
      _ready = true;
      debugPrint('LocationProvider: Restored from static cache');
      return false;
    }

    // If we have a pre-initialized SharedPreferences instance, check synchronously
    if (_prefs != null) {
      try {
        // Check for legacy format
        final hasCompletedSetup =
            _prefs!.getBool(_LOCATION_SETUP_COMPLETE_KEY) ?? false;

        if (hasCompletedSetup) {
          final locationJson = _prefs!.getString(_LOCATION_DATA_KEY);
          if (locationJson != null) {
            try {
              final loadedLocation = Location.fromJson(
                jsonDecode(locationJson),
              );
              _currentLocation = loadedLocation;
              _recentLocations = [loadedLocation];
              _cachedCurrentLocation = loadedLocation;
              _hasCompletedLocationSetup = true;
              _cachedHasCompletedLocationSetup = true;
              _ready = true;
              debugPrint(
                'LocationProvider: needsLocationSetup - restored from passed prefs',
              );
              notifyListeners();
              return false;
            } catch (e) {
              debugPrint('Error parsing saved location: $e');
            }
          }
        }

        // Check for new cache format
        final cachedSetup = _prefs!.getBool(_CACHED_SETUP_KEY) ?? false;
        if (cachedSetup) {
          final cachedLat = _prefs!.getDouble(_CACHED_LAT_KEY);
          final cachedLng = _prefs!.getDouble(_CACHED_LNG_KEY);
          final cachedAddress = _prefs!.getString(_CACHED_ADDRESS_KEY);

          if (cachedLat != null && cachedLng != null && cachedAddress != null) {
            final cachedLocation = Location(
              address: cachedAddress,
              latitude: cachedLat,
              longitude: cachedLng,
            );
            _currentLocation = cachedLocation;
            _recentLocations = [cachedLocation];
            _cachedCurrentLocation = cachedLocation;
            _hasCompletedLocationSetup = true;
            _cachedHasCompletedLocationSetup = true;
            _ready = true;
            debugPrint(
              'LocationProvider: needsLocationSetup - restored from cache format',
            );
            notifyListeners();
            return false;
          }
        }

        // Setup is needed - no valid location found
        return true;
      } catch (e) {
        debugPrint('LocationProvider: Error checking passed prefs: $e');
      }
    }

    // For now, if we have any cached value in memory, use it
    if (_currentLocation != null && _hasCompletedLocationSetup) {
      return false;
    }

    // Default: assume setup is needed if we can't confirm otherwise
    // This is conservative and prevents the loop by not navigating prematurely
    return true;
  }

  // Try to check setup status synchronously using SharedPreferences
  // This is a workaround for the async nature of SharedPreferences
  void _checkSetupSynchronously() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final hasCompletedSetup =
          prefs.getBool(_LOCATION_SETUP_COMPLETE_KEY) ?? false;

      if (hasCompletedSetup && !_hasCompletedLocationSetup) {
        final locationJson = prefs.getString(_LOCATION_DATA_KEY);
        if (locationJson != null) {
          try {
            final loadedLocation = Location.fromJson(jsonDecode(locationJson));
            _currentLocation = loadedLocation;
            _recentLocations = [loadedLocation];
            _cachedCurrentLocation = loadedLocation;
            debugPrint('LocationProvider: Async restore succeeded');
          } catch (e) {
            debugPrint('Error parsing saved location: $e');
          }
        }
        _hasCompletedLocationSetup = true;
        _cachedHasCompletedLocationSetup = true;
      }
      _ready = true;
      notifyListeners();
    } catch (e) {
      debugPrint('LocationProvider: Async check error: $e');
      _ready = true; // Mark as ready on error
      notifyListeners();
    }
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
    debugPrint('Location: start');
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
            ? _formatAddress(placemarks.first)
            : 'Lat: ${position.latitude}, Lng: ${position.longitude}',
        latitude: position.latitude,
        longitude: position.longitude,
        city: placemarks.isNotEmpty ? placemarks.first.locality : null,
        state: placemarks.isNotEmpty
            ? placemarks.first.administrativeArea
            : null,
        country: placemarks.isNotEmpty ? placemarks.first.country : null,
      );
      debugPrint('Location: set to $_currentLocation');

      // Add to recent locations
      _recentLocations.add(_currentLocation!);
      if (_recentLocations.length > 10) {
        _recentLocations.removeAt(0);
      }

      // Save location to SharedPreferences
      _saveLocationToPrefs();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      debugPrint('Location: error - $e');
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

  Future<void> _saveLocationToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (_currentLocation != null) {
      await prefs.setString(
        _LOCATION_DATA_KEY,
        jsonEncode(_currentLocation!.toJson()),
      );
    }
  }

  Future<void> _saveLocationSetupComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_LOCATION_SETUP_COMPLETE_KEY, true);
  }

  void clearLocationData() {
    _currentLocation = null;
    _recentLocations.clear();
    _hasCompletedLocationSetup = false;
    _cachedHasCompletedLocationSetup = false;
    _cachedCurrentLocation = null;
    _clearLocationPrefs();
    notifyListeners();
  }

  Future<void> _clearLocationPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_LOCATION_DATA_KEY);
    await prefs.remove(_LOCATION_SETUP_COMPLETE_KEY);
  }

  void setLocationSetupComplete() {
    _hasCompletedLocationSetup = true;
    _cachedHasCompletedLocationSetup = true;
    // Mark as ready immediately
    _ready = true;
    _saveLocationSetupComplete();
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
    _cachedHasCompletedLocationSetup = true;
    // Mark as ready immediately
    _ready = true;
    _saveLocationSetupComplete();
    notifyListeners();
  }

  Future<void> refreshLocation() async {
    // First check and request permissions
    final hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return; // Permission denied, don't try to get location
    }
    await getCurrentLocation();
  }

  Future<void> setManualLocation(Location location) async {
    _currentLocation = location;
    _cachedCurrentLocation = location;
    _recentLocations.add(location);
    if (_recentLocations.length > 10) {
      _recentLocations.removeAt(0);
    }
    _hasCompletedLocationSetup = true;
    _cachedHasCompletedLocationSetup = true;
    // Mark as ready immediately to prevent navigation loop
    _ready = true;
    // Save to SharedPreferences (both legacy and new format)
    await _saveLocationToPrefs();
    await _saveLocationSetupComplete();
    // Also save to new cache format for fast restore
    await _saveToCacheFormat();
    notifyListeners();
  }

  // Save location in cache format for fast synchronous restore
  Future<void> _saveToCacheFormat() async {
    final prefs = await SharedPreferences.getInstance();
    if (_currentLocation != null) {
      await prefs.setDouble(_CACHED_LAT_KEY, _currentLocation!.latitude!);
      await prefs.setDouble(_CACHED_LNG_KEY, _currentLocation!.longitude!);
      await prefs.setString(_CACHED_ADDRESS_KEY, _currentLocation!.address);
      await prefs.setBool(_CACHED_SETUP_KEY, true);
    }
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

  // Helper method to format address from placemark
  String _formatAddress(geocoding.Placemark placemark) {
    final parts = <String>[];

    // Add locality (city/town) if available
    if (placemark.locality != null && placemark.locality!.isNotEmpty) {
      parts.add(placemark.locality!);
    }

    // Add subLocality if available (neighborhood/area)
    if (placemark.subLocality != null && placemark.subLocality!.isNotEmpty) {
      parts.add(placemark.subLocality!);
    }

    // Add administrativeArea (state/province) if available
    if (placemark.administrativeArea != null &&
        placemark.administrativeArea!.isNotEmpty) {
      parts.add(placemark.administrativeArea!);
    }

    // Add country if available
    if (placemark.country != null && placemark.country!.isNotEmpty) {
      parts.add(placemark.country!);
    }

    // Return formatted address or fallback
    if (parts.isNotEmpty) {
      return parts.join(', ');
    }

    // Fallback to toString if no components found
    return placemark.toString();
  }
}
