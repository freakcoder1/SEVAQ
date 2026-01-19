import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isInitialized = false;

  // Static cache for authentication state
  // NOTE: Static variables are reset on Dart isolate restart (app resume)
  // So we also persist to SharedPreferences for true persistence
  static String? _cachedUserId;
  static String? _cachedToken;
  static User? _cachedUser;
  static bool _cacheLoaded = false;

  // Persistent cache keys
  static const String _TOKEN_KEY = 'jwt_token';
  static const String _USER_ID_KEY = 'user_id';
  static const String _CACHED_USER_KEY = 'cached_user';

  // Static SharedPreferences instance for synchronous access
  // This is set by main.dart before providers are created
  static SharedPreferences? prefsInstance;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Track if we've verified auth state at least once
  static bool _hasVerifiedAuth = false;

  AuthProvider() {
    debugPrint('AuthProvider: Constructor called');
    // Synchronously read from SharedPreferences to restore auth state
    // NOTE: This MUST be synchronous to work during app resume
    _restoreAuthStateSync();
    // Then asynchronously refresh
    _initializeAuth();
  }

  /// Synchronously restore auth state from SharedPreferences
  /// This is called immediately in constructor to handle app resume scenarios
  /// CRITICAL: Uses synchronous SharedPreferences instance that was pre-initialized in main.dart
  void _restoreAuthStateSync() {
    try {
      // Use the pre-initialized SharedPreferences instance if available
      // This is synchronous and fast because main.dart already called getInstance()
      final prefs = prefsInstance;
      if (prefs != null) {
        final token = prefs.getString(_TOKEN_KEY);
        final userId = prefs.getString(_USER_ID_KEY);
        final cachedUserJson = prefs.getString(_CACHED_USER_KEY);

        if (token != null && userId != null) {
          _cachedToken = token;
          _cachedUserId = userId;

          if (cachedUserJson != null) {
            try {
              _cachedUser = User.fromJsonString(cachedUserJson);
              _currentUser = _cachedUser;
              debugPrint(
                'AuthProvider: Restored auth state from prefs: ${_cachedUser?.email}',
              );
            } catch (e) {
              debugPrint('AuthProvider: Error parsing cached user: $e');
            }
          }
          _cacheLoaded = true;
          _hasVerifiedAuth = true;
        } else {
          _cacheLoaded = true;
          _hasVerifiedAuth = true;
        }
        notifyListeners();
      } else {
        // Fallback: Create new instance if pre-init not available
        SharedPreferences.getInstance()
            .then((prefs) {
              prefsInstance = prefs;
              final token = prefs.getString(_TOKEN_KEY);
              final userId = prefs.getString(_USER_ID_KEY);
              final cachedUserJson = prefs.getString(_CACHED_USER_KEY);

              if (token != null && userId != null) {
                _cachedToken = token;
                _cachedUserId = userId;

                if (cachedUserJson != null) {
                  try {
                    _cachedUser = User.fromJsonString(cachedUserJson);
                    _currentUser = _cachedUser;
                    debugPrint(
                      'AuthProvider: Restored auth state from prefs: ${_cachedUser?.email}',
                    );
                  } catch (e) {
                    debugPrint('AuthProvider: Error parsing cached user: $e');
                  }
                }
                _cacheLoaded = true;
                _hasVerifiedAuth = true;
              } else {
                _cacheLoaded = true;
                _hasVerifiedAuth = true;
              }
              notifyListeners();
            })
            .catchError((e) {
              debugPrint('AuthProvider: Error restoring auth state: $e');
              _cacheLoaded = true;
              _hasVerifiedAuth = true;
            });
      }
    } catch (e) {
      debugPrint('AuthProvider: Sync restore error: $e');
      _cacheLoaded = true;
      _hasVerifiedAuth = true;
    }
  }

  /// Synchronous check for authentication
  /// IMPORTANT: Returns false ONLY when we're sure user is NOT authenticated
  /// During loading phase, returns true to prevent navigation loop
  bool get isAuthenticated {
    // If we have cached token and user, user is authenticated
    if (_cachedToken != null && _cachedUser != null) {
      return true;
    }

    // If we have currentUser from a previous session, authenticated
    if (_currentUser != null) {
      return true;
    }

    // If we have token but no cached user, try to refresh from API
    if (_cachedToken != null && _cachedUser == null) {
      _refreshUserFromApi();
      // Return false during refresh to prevent premature navigation
      // AuthWrapper will re-check after refresh completes
      return false;
    }

    // No authentication data found
    debugPrint('AuthProvider: isAuthenticated - no auth data, returning false');
    return false;
  }

  /// One-time async initialization
  Future<void> _initializeAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_TOKEN_KEY);
      final userId = prefs.getString(_USER_ID_KEY);
      final cachedUserJson = prefs.getString(_CACHED_USER_KEY);

      _cachedToken = token;
      _cachedUserId = userId;

      if (token != null && userId != null && cachedUserJson != null) {
        _cachedUser = User.fromJsonString(cachedUserJson);
        _currentUser = _cachedUser;
        _cacheLoaded = true;
        debugPrint('AuthProvider: Initialized (async): ${_cachedUser?.email}');
      }

      // If we have token but no cached user, fetch from API
      if (token != null && userId != null && _cachedUser == null) {
        await _refreshUserFromApi();
      }
    } catch (e) {
      debugPrint('AuthProvider: Error during init: $e');
    } finally {
      _isLoading = false;
      _isInitialized = true;
      _hasVerifiedAuth = true;
      notifyListeners();
    }
  }

  Future<void> _refreshUserFromApi() async {
    try {
      final token = await _storage.read(key: _TOKEN_KEY);
      if (token == null) return;

      final userId = await _storage.read(key: _USER_ID_KEY);
      if (userId == null) return;

      final response = await _apiService.get('users/$userId');
      if (response != null) {
        _currentUser = User.fromJson(response);
        _cachedUser = _currentUser;
        // Update cached user in prefs
        await _storage.write(
          key: _CACHED_USER_KEY,
          value: _currentUser!.toJsonString(),
        );
        debugPrint(
          'AuthProvider: Refreshed user from API: ${_currentUser?.email}',
        );
      }
    } catch (e) {
      debugPrint('AuthProvider: Error refreshing user: $e');
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post('auth/login', {
        'email': email,
        'password': password,
      });

      if (response != null) {
        final token = response['access_token'];
        final user = response['user'];

        if (token != null && user != null) {
          debugPrint('AuthProvider: Storing token and user data');
          debugPrint('AuthProvider: Token length: ${token.length}');
          debugPrint(
            'AuthProvider: Token starts with: ${token.substring(0, math.min(20, token.length))}...',
          );
          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(key: 'user_id', value: user['id'].toString());

          _currentUser = User.fromJson(user);
          // Update static cache immediately
          _cachedToken = token;
          _cachedUserId = user['id'].toString();
          _cachedUser = _currentUser;
          _cacheLoaded = true;
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }

    _isLoading = false;
    _errorMessage = 'Invalid credentials';
    notifyListeners();
    return false;
  }

  Future<bool> register(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post('auth/signup', {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': 'user',
      });

      if (response != null) {
        final token = response['access_token'];
        final user = response['user'];

        if (token != null && user != null) {
          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(key: 'user_id', value: user['id'].toString());

          _currentUser = User.fromJson(user);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }

    _isLoading = false;
    _errorMessage = 'Registration failed';
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _storage.delete(key: 'jwt_token');
      await _storage.delete(key: 'user_id');
      await _storage.delete(key: 'cached_user');
      _currentUser = null;
      // Clear static cache
      _cachedToken = null;
      _cachedUserId = null;
      _cachedUser = null;
      _cacheLoaded = false;
    } catch (e) {
      debugPrint('Error during logout: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updateData) async {
    if (_currentUser == null) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.patch(
        'users/${_currentUser!.id}',
        updateData,
      );

      if (response != null) {
        _currentUser = User.fromJson(response);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error updating profile: $e');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Compatibility methods for existing code
  User? get user => _currentUser;

  Future<void> checkAuth() async {
    await _initializeAuth();
  }

  Future<bool> signup(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    return await register(email, password, firstName, lastName);
  }

  // Debug method to test API connectivity
  Future<void> testApiConnectivity() async {
    try {
      final response = await _apiService.checkServerHealth();
      debugPrint('API Health Check: $response');
    } catch (e) {
      debugPrint('API Health Check Failed: $e');
    }
  }

  /// Enhanced authentication check that considers initialization state
  /// This method is more reliable for navigation decisions
  bool get isFullyAuthenticated {
    // Must have both token and user data to be fully authenticated
    return _cachedToken != null && _cachedUser != null;
  }

  /// Check if authentication is in progress
  bool get isAuthInProgress {
    return _isLoading || (!_cacheLoaded && !_isInitialized);
  }
}
