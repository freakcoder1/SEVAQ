import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/ab_test.dart';
import '../utils/api.dart';

class ABTestingService {
  static final ABTestingService _instance = ABTestingService._internal();
  final Map<String, ABTest> _activeTests = {};
  final Map<String, String> _userVariants = {};

  factory ABTestingService() => _instance;

  ABTestingService._internal();

  /// Get the variant for a specific test for the current user
  Future<String> getVariant(String testName, String userId) async {
    // Check if we already have a variant for this user
    if (_userVariants.containsKey(testName)) {
      return _userVariants[testName]!;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedVariant = prefs.getString('ab_test_$testName');

      if (cachedVariant != null) {
        _userVariants[testName] = cachedVariant;
        return cachedVariant;
      }

      // Fetch variant from server
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/ab-testing/variant/$testName'),
        headers: await ApiConfig.getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final variant = data['variant'];

        // Cache the variant
        _userVariants[testName] = variant;
        await prefs.setString('ab_test_$testName', variant);

        return variant;
      }
    } catch (e) {
      print('Error getting AB test variant: $e');
    }

    // Default to control variant if something goes wrong
    return 'control';
  }

  /// Track an event for A/B testing
  Future<void> trackEvent(
    String testName,
    String eventName,
    Map<String, dynamic> properties,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/ab-testing/track'),
        headers: await ApiConfig.getAuthHeaders(),
        body: jsonEncode({
          'testName': testName,
          'eventName': eventName,
          'properties': properties,
        }),
      );

      if (response.statusCode != 200) {
        print('Failed to track AB test event: ${response.statusCode}');
      }
    } catch (e) {
      print('Error tracking AB test event: $e');
    }
  }

  /// Get all active tests
  Future<List<ABTest>> getActiveTests() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/ab-testing/active'),
        headers: await ApiConfig.getAuthHeaders(),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final tests = (data['tests'] as List)
            .map((test) => ABTest.fromJson(test))
            .toList();

        // Cache active tests
        for (final test in tests) {
          _activeTests[test.name] = test;
        }

        return tests;
      }
    } catch (e) {
      print('Error getting active AB tests: $e');
    }

    return [];
  }

  /// Check if a test is active
  bool isTestActive(String testName) {
    return _activeTests.containsKey(testName);
  }

  /// Get test configuration
  ABTest? getTest(String testName) {
    return _activeTests[testName];
  }

  /// Clear cached variants (for testing purposes)
  Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    _userVariants.clear();

    // Clear all cached test variants
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith('ab_test_')) {
        await prefs.remove(key);
      }
    }
  }
}

/// Provider for A/B testing
class ABTestingProvider with ChangeNotifier {
  final ABTestingService _abTestingService = ABTestingService();
  final String _userId;
  Map<String, String> _variants = {};
  List<ABTest> _activeTests = [];

  ABTestingProvider(this._userId);

  Map<String, String> get variants => _variants;
  List<ABTest> get activeTests => _activeTests;

  /// Initialize A/B testing
  Future<void> initialize() async {
    try {
      _activeTests = await _abTestingService.getActiveTests();

      // Get variants for all active tests
      for (final test in _activeTests) {
        final variant = await _abTestingService.getVariant(test.name, _userId);
        _variants[test.name] = variant;
      }

      notifyListeners();
    } catch (e) {
      print('Error initializing AB testing: $e');
    }
  }

  /// Get variant for a specific test
  String getVariant(String testName) {
    return _variants[testName] ?? 'control';
  }

  /// Check if user is in a specific variant
  bool isInVariant(String testName, String variant) {
    return getVariant(testName) == variant;
  }

  /// Track an event
  Future<void> trackEvent(
    String testName,
    String eventName,
    Map<String, dynamic> properties,
  ) async {
    await _abTestingService.trackEvent(testName, eventName, properties);
  }

  /// Refresh test configuration
  Future<void> refreshTests() async {
    await initialize();
  }
}
