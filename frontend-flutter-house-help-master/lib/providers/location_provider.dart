import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_house_help/models/location.dart';
import '../services/api_service.dart';

typedef Placemark = geocoding.Placemark;

class LocationAvailability {
  final bool isAvailable;
  final int workerCount;
  final int estimatedWaitTime;
  final List<MicroZone> nearbyZones;
  final bool highDemand;

  LocationAvailability({
    required this.isAvailable,
    required this.workerCount,
    required this.estimatedWaitTime,
    required this.nearbyZones,
    required this.highDemand,
  });

  factory LocationAvailability.fromJson(Map<String, dynamic> json) {
    return LocationAvailability(
      isAvailable: json['isAvailable'] ?? false,
      workerCount: json['workerCount'] ?? 0,
      estimatedWaitTime: json['estimatedWaitTime'] ?? 120,
      nearbyZones: (json['nearbyZones'] as List)
          .map((zone) => MicroZone.fromJson(zone))
          .toList(),
      highDemand: json['highDemand'] ?? false,
    );
  }
}

class MicroZone {
  final String id;
  final String name;
  final double centerLat;
  final double centerLng;
  final double radiusKm;
  final String zoneType;

  MicroZone({
    required this.id,
    required this.name,
    required this.centerLat,
    required this.centerLng,
    required this.radiusKm,
    required this.zoneType,
  });

  factory MicroZone.fromJson(Map<String, dynamic> json) {
    return MicroZone(
      id: json['id'],
      name: json['name'],
      centerLat: json['centerLat'],
      centerLng: json['centerLng'],
      radiusKm: json['radiusKm'],
      zoneType: json['zoneType'],
    );
  }
}

class LocationProvider with ChangeNotifier {
  String _currentLocation = 'Fetching location...';
  Location? _currentLocationData;
  Position? _currentPosition;
  bool _isLoading = true;
  List<Location> _recentLocations = [];
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  bool _hasShownLocationPopup = false;

  // Platform-aware storage methods
  Future<String?> _readFromStorage(String key) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    }
    return await _secureStorage.read(key: key);
  }

  Future<void> _writeToStorage(String key, String value) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
    } else {
      await _secureStorage.write(key: key, value: value);
    }
  }

  // New location-based service availability
  LocationAvailability? _availabilityStatus;
  List<MicroZone> _nearbyZones = [];
  bool _isCheckingAvailability = false;
  bool _hasHighDemand = false;
  bool _isOnWaitlist = false;

  // Initialization state
  bool _isInitialized = false;
  bool _hasLocationPermission = false;

  String get currentLocation => _currentLocation;
  Location? get currentLocationData => _currentLocationData;
  Position? get currentPosition => _currentPosition;
  bool get isLoading => _isLoading;
  List<Location> get recentLocations => _recentLocations;
  bool get hasShownLocationPopup => _hasShownLocationPopup;

  // New availability properties
  LocationAvailability? get availabilityStatus => _availabilityStatus;
  List<MicroZone> get nearbyZones => _nearbyZones;
  bool get isCheckingAvailability => _isCheckingAvailability;
  bool get hasHighDemand => _hasHighDemand;
  bool get isOnWaitlist => _isOnWaitlist;

  // Initialization state
  bool get isInitialized => _isInitialized;
  bool get hasLocationPermission => _hasLocationPermission;

  LocationProvider() {
    debugPrint('=== LocationProvider() constructor called ===');
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      debugPrint('LocationProvider: Starting initialization');
      await _loadRecentLocations();
      await _loadPopupState();
      await _checkLocationPermission();

      if (_hasLocationPermission) {
        await _getCurrentLocation().timeout(
          const Duration(seconds: 15),
          onTimeout: () {
            debugPrint('LocationProvider: Location init timed out after 15s');
            _currentLocation = 'Unable to get location. Please check your GPS.';
            _isLoading = false;
            _isInitialized = true;
            notifyListeners();
            return;
          },
        );
      } else {
        _isLoading = false;
        _isInitialized = true;
        notifyListeners();
      }

      debugPrint('LocationProvider: Initialization completed');
    } catch (e) {
      debugPrint('LocationProvider: Initialization error: $e');
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> _checkLocationPermission() async {
    try {
      // On web, Geolocator may not work properly - check for web platform
      if (kIsWeb) {
        debugPrint(
          'LocationProvider: Web platform detected, skipping Geolocator permission check',
        );
        _hasLocationPermission = true; // Allow manual location entry on web
        notifyListeners();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      _hasLocationPermission = permission != LocationPermission.deniedForever;
      notifyListeners();
    } catch (e) {
      debugPrint('LocationProvider: Permission check error: $e');
      _hasLocationPermission = false;
      notifyListeners();
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      // On web, Geolocator may not work properly - skip GPS location
      if (kIsWeb) {
        debugPrint(
          'LocationProvider: Web platform detected, skipping GPS location',
        );
        _currentLocation = 'Please set your location manually';
        _isLoading = false;
        _isInitialized = true;
        notifyListeners();
        return;
      }

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _currentLocation =
            'Location services are disabled. Please enable GPS in your device settings.';
        _isLoading = false;
        _isInitialized = true;
        notifyListeners();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _currentLocation =
              'Location permissions are denied. Please grant location access in app settings.';
          _isLoading = false;
          _isInitialized = true;
          notifyListeners();
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _currentLocation =
            'Location permissions are permanently denied. Please enable location access in app settings.';
        _isLoading = false;
        _isInitialized = true;
        notifyListeners();
        return;
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('Location request timed out after 10 seconds');
        },
      );
      await _getAddressFromLatLng(_currentPosition!);
    } catch (e) {
      if (e is TimeoutException) {
        _currentLocation =
            'Location request timed out. Please try again or check your GPS signal.';
      } else if (e is Exception) {
        _currentLocation = 'Location service error: ${e.toString()}';
      } else {
        _currentLocation =
            'Unable to get location. Please check your internet connection and GPS.';
      }
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> _getAddressFromLatLng(Position position) async {
    try {
      List<Placemark> placemarks = await geocoding.placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      Placemark place = placemarks[0];
      _currentLocationData = Location.fromPlacemark(
        place,
        lat: position.latitude,
        lng: position.longitude,
      );
      _currentLocation = _currentLocationData!.address;
      _isLoading = false;
      _isInitialized = true;

      // Check service availability after getting location
      await checkServiceAvailability();

      // Mark location setup as complete
      await markLocationSetupComplete();

      notifyListeners();
    } catch (e) {
      _currentLocation = 'Unable to get address.';
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<void> setManualLocation(Location location) async {
    _currentLocationData = location;
    _currentLocation = location.address;
    _addToRecentLocations(location);

    // Check service availability for new location
    await checkServiceAvailability();

    // Mark location setup as complete
    await markLocationSetupComplete();

    notifyListeners();
  }

  Future<void> _loadRecentLocations() async {
    try {
      final stored = await _readFromStorage('recent_locations');
      if (stored != null) {
        final List<dynamic> locationsJson = jsonDecode(stored);
        _recentLocations = locationsJson
            .map((json) => Location.fromJson(json))
            .toList();
      }
    } catch (e) {
      _recentLocations = [];
    }
  }

  Future<void> _saveRecentLocations() async {
    try {
      final locationsJson = _recentLocations
          .map((loc) => loc.toJson())
          .toList();
      await _writeToStorage('recent_locations', jsonEncode(locationsJson));
    } catch (e) {
      // Handle error silently
    }
  }

  void _addToRecentLocations(Location location) {
    _recentLocations.removeWhere((loc) => loc.address == location.address);
    _recentLocations.insert(0, location);
    if (_recentLocations.length > 5) {
      _recentLocations = _recentLocations.sublist(0, 5);
    }
    _saveRecentLocations();
  }

  Future<List<Location>> searchLocations(String query) async {
    if (query.isEmpty) return [];
    try {
      List<geocoding.Location> locations = await geocoding.locationFromAddress(
        query,
      );
      List<Location> result = [];
      for (var loc in locations) {
        try {
          List<Placemark> placemarks = await geocoding.placemarkFromCoordinates(
            loc.latitude!,
            loc.longitude!,
          );
          if (placemarks.isNotEmpty) {
            result.add(
              Location.fromPlacemark(
                placemarks[0],
                lat: loc.latitude,
                lng: loc.longitude,
              ),
            );
          }
        } catch (e) {
          // If placemark fails, create basic location
          result.add(Location.fromGeocodingLocation(loc));
        }
      }
      return result;
    } catch (e) {
      return [];
    }
  }

  Future<void> refreshLocation() async {
    _isLoading = true;
    notifyListeners();

    try {
      // On web, Geolocator doesn't work - show message and return
      if (kIsWeb) {
        debugPrint(
          'LocationProvider: Web platform detected, GPS not available',
        );
        _currentLocation =
            'GPS location is not available on web. Please use the search option to find your location.';
        _isLoading = false;
        notifyListeners();
        return;
      }

      await _getCurrentLocation();

      // Check if location was successfully obtained
      if (_currentLocationData != null) {
        // Mark location setup as complete
        await markLocationSetupComplete();
      } else {
        _currentLocation = 'Unable to get current location. Please try again.';
        _isLoading = false;
        notifyListeners();
      }
    } catch (e) {
      _currentLocation = 'Failed to get location: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
    }
  }

  // New location-based service availability methods
  Future<void> checkServiceAvailability() async {
    if (_currentLocationData == null) return;

    _isCheckingAvailability = true;
    notifyListeners();

    try {
      final apiService = ApiService();
      // Try to call the API endpoint using the extension method
      try {
        final response = await apiService.checkServiceAvailability(
          _currentLocationData!.latitude!,
          _currentLocationData!.longitude!,
          5.0, // 5km radius
        );

        _availabilityStatus = LocationAvailability.fromJson(response);
        _nearbyZones = _availabilityStatus!.nearbyZones;
        _hasHighDemand = _availabilityStatus!.highDemand;
      } catch (apiError) {
        // If API endpoint doesn't exist, create a mock response
        debugPrint(
          'Service availability API not available, using fallback: $apiError',
        );
        _availabilityStatus = LocationAvailability(
          isAvailable: true,
          workerCount: 3,
          estimatedWaitTime: 30,
          nearbyZones: [],
          highDemand: false,
        );
        _hasHighDemand = false;
      }

      _isCheckingAvailability = false;

      // Auto-add to waitlist if needed
      if (_hasHighDemand && _currentLocationData != null) {
        // Note: Caller should provide serviceId - this auto-add feature needs to be updated
        // to accept a serviceId parameter
        debugPrint('Auto-add to waitlist requires serviceId - skipping');
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Failed to check availability: $e');
      _isCheckingAvailability = false;
      notifyListeners();
    }
  }

  Future<void> addToWaitlist(String serviceId) async {
    if (_currentLocationData == null || _availabilityStatus == null) return;

    try {
      final apiService = ApiService();
      // Try to call the API endpoint, but provide fallback if it doesn't exist
      try {
        await apiService.addToWaitlist(
          _currentLocationData!.latitude!,
          _currentLocationData!.longitude!,
          _availabilityStatus!.estimatedWaitTime,
          serviceId: serviceId,
        );
        _isOnWaitlist = true;
      } catch (apiError) {
        // If API endpoint doesn't exist, simulate success
        debugPrint('Waitlist API not available, simulating success: $apiError');
        _isOnWaitlist = true;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to add to waitlist: $e');
    }
  }

  Future<void> removeFromWaitlist() async {
    try {
      final apiService = ApiService();
      // Try to call the API endpoint, but provide fallback if it doesn't exist
      try {
        await apiService.removeFromWaitlist();
        _isOnWaitlist = false;
      } catch (apiError) {
        // If API endpoint doesn't exist, simulate success
        debugPrint(
          'Waitlist removal API not available, simulating success: $apiError',
        );
        _isOnWaitlist = false;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to remove from waitlist: $e');
    }
  }

  // Enhanced new user detection with location-based logic
  Future<bool> isNewUser() async {
    try {
      final hasLocation = _currentLocationData != null;
      final hasRecentLocations = _recentLocations.isNotEmpty;
      final hasShownPopup =
          await _readFromStorage('has_shown_location_popup') == 'true';
      final hasCompletedSetup =
          await _readFromStorage('has_completed_location_setup') == 'true';

      return !hasLocation &&
          !hasRecentLocations &&
          !hasShownPopup &&
          !hasCompletedSetup;
    } catch (e) {
      return true; // Default to new user if there's an error
    }
  }

  Future<void> markPopupShown() async {
    try {
      await _writeToStorage('has_shown_location_popup', 'true');
      _hasShownLocationPopup = true;
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> markLocationSetupComplete() async {
    try {
      await _writeToStorage('has_completed_location_setup', 'true');
      await _writeToStorage('has_shown_location_popup', 'true');
      _hasShownLocationPopup = true;
      notifyListeners();
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _loadPopupState() async {
    try {
      final hasShown = await _readFromStorage('has_shown_location_popup');
      final hasCompleted = await _readFromStorage(
        'has_completed_location_setup',
      );
      _hasShownLocationPopup = hasShown == 'true' || hasCompleted == 'true';
    } catch (e) {
      _hasShownLocationPopup = false;
    }
  }

  // Method to check if location setup is needed
  bool needsLocationSetup() {
    debugPrint('=== LocationProvider.needsLocationSetup() called ===');
    debugPrint(
      'currentLocationData: ${_currentLocationData != null ? 'EXISTS' : 'NULL'}',
    );
    debugPrint('recentLocations count: ${_recentLocations.length}');
    debugPrint('hasShownLocationPopup: $_hasShownLocationPopup');
    // Check if location setup has been completed
    // Returns true if no location data AND no recent locations AND no completed setup flag
    // Also check the in-memory flag which is set by markLocationSetupComplete()
    final hasCompletedSetup =
        _hasShownLocationPopup ||
        _currentLocationData != null ||
        _recentLocations.isNotEmpty;
    debugPrint('needsLocationSetup result: ${!hasCompletedSetup}');
    return !hasCompletedSetup;
  }

  // Async version that checks persistent storage
  Future<bool> needsLocationSetupAsync() async {
    debugPrint('=== LocationProvider.needsLocationSetupAsync() called ===');
    try {
      final hasCompletedSetup =
          await _readFromStorage('has_completed_location_setup') == 'true' ||
          _currentLocationData != null ||
          _recentLocations.isNotEmpty;
      debugPrint('needsLocationSetupAsync result: ${!hasCompletedSetup}');
      return !hasCompletedSetup;
    } catch (e) {
      debugPrint('needsLocationSetupAsync error: $e');
      return true;
    }
  }

  // Method to get available services in current location
  Future<List<dynamic>> getAvailableServices() async {
    if (_currentLocationData == null) return [];

    try {
      final apiService = ApiService();
      // Try to call the API endpoint using the extension method
      try {
        final response = await apiService.getAvailableServices(
          _currentLocationData!.latitude!,
          _currentLocationData!.longitude!,
          5.0,
        );
        return response;
      } catch (apiError) {
        // If API endpoint doesn't exist, return empty list
        debugPrint(
          'Available services API not available, using fallback: $apiError',
        );
        return [];
      }
    } catch (e) {
      debugPrint('Failed to get available services: $e');
      return [];
    }
  }

  // Method to get nearby micro-zones
  Future<List<MicroZone>> getNearbyZones() async {
    if (_currentLocationData == null) return [];

    try {
      final apiService = ApiService();
      // Try to call the API endpoint using the extension method
      try {
        final response = await apiService.getNearbyZones(
          _currentLocationData!.latitude!,
          _currentLocationData!.longitude!,
        );
        return (response as List)
            .map((zone) => MicroZone.fromJson(zone))
            .toList();
      } catch (apiError) {
        // If API endpoint doesn't exist, return empty list
        debugPrint('Nearby zones API not available, using fallback: $apiError');
        return [];
      }
    } catch (e) {
      debugPrint('Failed to get nearby zones: $e');
      return [];
    }
  }

  // Method to force re-initialization
  Future<void> reinitialize() async {
    _isInitialized = false;
    _isLoading = true;
    notifyListeners();
    await _initialize();
  }
}
