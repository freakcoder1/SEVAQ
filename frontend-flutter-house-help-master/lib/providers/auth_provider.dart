import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import '../services/api_service.dart';
import '../services/navigation_service.dart';
import '../services/firebase_messaging_service.dart';
import '../models/user.dart';
import './booking_provider.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isInitialized = false;
  bool _needsProfileCompletion = false;

  // Static cache for authentication state
  // NOTE: Static variables are reset on Dart isolate restart (app resume)
  // So we also persist to SharedPreferences for true persistence
  static String? _cachedUserId;
  static String? _cachedToken;
  static User? _cachedUser;
  static bool _cacheLoaded = false;

  // Persistent cache keys
  static const String _TOKEN_KEY = 'jwt_token';
  static const String _REFRESH_TOKEN_KEY = 'refresh_token';
  static const String _USER_ID_KEY = 'user_id';
  static const String _CACHED_USER_KEY = 'cached_user';

  // Static SharedPreferences instance for synchronous access
  // This is set by main.dart before providers are created
  static SharedPreferences? prefsInstance;

  // Static instance for direct access (permanent fix for provider scope issues)
  // This allows screens to access AuthProvider without needing Provider.of(context)
  static AuthProvider? _instance;

  /// Set the static instance from main.dart - public setter
  static set instance(AuthProvider provider) {
    _instance = provider;
    debugPrint('AuthProvider.instance: Static instance set from main.dart');
  }

  static AuthProvider get instance {
    if (_instance == null) {
      debugPrint(
        'AuthProvider.instance: Instance not set from main.dart, checking static cache',
      );
      // If instance not set, check if we have cached auth state
      // This handles the case where screens access AuthProvider before it's fully initialized
      if (_cachedUserId != null || _cachedToken != null) {
        // We have cached auth data, create instance that will restore it
        _instance = AuthProvider._internal();
        debugPrint(
          'AuthProvider.instance: Created instance with cached auth state',
        );
      } else {
        debugPrint(
          'AuthProvider.instance: No cached auth, creating empty instance',
        );
        _instance = AuthProvider._internal();
      }
    }
    return _instance!;
  }

  // Private named constructor for static instance
  AuthProvider._internal() : super() {
    debugPrint('AuthProvider: _internal constructor called');
    // Restore auth state synchronously like the main constructor
    _restoreAuthStateSync();
  }

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get needsProfileCompletion => _needsProfileCompletion;

  void clearNeedsProfileCompletion() {
    _needsProfileCompletion = false;
    notifyListeners();
  }

  // Get user ID - prefer publicId (UUID) for modern APIs, fall back to id for legacy
  dynamic get userId {
    // Prefer publicId (UUID) for subscription and modern API operations
    if (_currentUser?.publicId != null && _currentUser!.publicId.isNotEmpty) {
      return _currentUser!.publicId;
    }
    // Fall back to cached userId from SharedPreferences
    if (_cachedUserId != null) {
      return _cachedUserId;
    }
    // Last resort: use id if available (legacy support)
    if (_currentUser?.id != null && _currentUser!.id != 0) {
      return _currentUser!.id;
    }
    return null;
  }

  // Also expose cachedUserId for direct access if needed
  static String? get cachedUserId => _cachedUserId;

  // Track if we've verified auth state at least once
  static bool _hasVerifiedAuth = false;

  // PRODUCTION FIX: Mutex lock to prevent race conditions during auth operations
  static bool _isAuthOperationInProgress = false;

  // Track if user refresh is in progress to prevent false negative in isAuthenticated
  static bool _isUserRefreshInProgress = false;

  AuthProvider() {
    debugPrint('AuthProvider: Constructor called');
    // Synchronously read from SharedPreferences to restore auth state
    // NOTE: This MUST be synchronous to work during app resume
    _restoreAuthStateSync();
    // Then asynchronously refresh
    _initializeAuth();
  }

  /// PRODUCTION FIX: Check if an auth operation is already in progress
  /// Prevents race conditions when multiple auth-related operations are triggered
  bool get _canPerformAuthOperation {
    if (_isAuthOperationInProgress) {
      debugPrint('AuthProvider: Auth operation already in progress, skipping');
      return false;
    }
    return true;
  }

  /// PRODUCTION FIX: Acquire auth operation lock
  void _acquireAuthLock() {
    _isAuthOperationInProgress = true;
    debugPrint('AuthProvider: Auth lock acquired');
  }

  /// PRODUCTION FIX: Release auth operation lock
  void _releaseAuthLock() {
    _isAuthOperationInProgress = false;
    debugPrint('AuthProvider: Auth lock released');
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
        final refreshToken = prefs.getString(_REFRESH_TOKEN_KEY);

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
              final refreshToken = prefs.getString(_REFRESH_TOKEN_KEY);

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
    debugPrint('AuthProvider: isAuthenticated called');
    debugPrint('AuthProvider: _cachedToken is null: ${_cachedToken == null}');
    debugPrint('AuthProvider: _cachedUser is null: ${_cachedUser == null}');
    debugPrint('AuthProvider: _currentUser is null: ${_currentUser == null}');
    debugPrint('AuthProvider: _cacheLoaded: $_cacheLoaded');

    // If we have cached token and user, user is authenticated
    if (_cachedToken != null && _cachedUser != null) {
      debugPrint('AuthProvider: isAuthenticated - returning TRUE (cached)');
      return true;
    }

    // If we have currentUser from a previous session, authenticated
    if (_currentUser != null) {
      debugPrint(
        'AuthProvider: isAuthenticated - returning TRUE (currentUser)',
      );
      return true;
    }

    // If we have token but no cached user, try to refresh from API
    if (_cachedToken != null && _cachedUser == null) {
      debugPrint(
        'AuthProvider: isAuthenticated - have token but no user, refreshing...',
      );
      // FIX: Return true if we have a token, even if user is being refreshed
      // This prevents the login screen from showing during refresh
      // The refresh will update the user data when complete
      if (!_isUserRefreshInProgress) {
        _isUserRefreshInProgress = true;
        _refreshUserFromApi()
            .then((_) {
              _isUserRefreshInProgress = false;
            })
            .catchError((_) {
              _isUserRefreshInProgress = false;
            });
      }
      return true; // Return true to prevent login screen during refresh
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
      final refreshToken = prefs.getString(_REFRESH_TOKEN_KEY);

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
    } on TokenExpiredException {
      debugPrint('AuthProvider: Token expired during _refreshUserFromApi');
      await handleTokenExpired();
    } catch (e) {
      debugPrint('AuthProvider: Error refreshing user: $e');
    }
  }

  Future<bool> login(
    String email,
    String password, {
    BuildContext? context,
  }) async {
    // PRODUCTION FIX: Prevent race conditions - skip if auth operation in progress
    if (!_canPerformAuthOperation) {
      debugPrint('AuthProvider: Login skipped - operation already in progress');
      return false;
    }

    _acquireAuthLock();
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      debugPrint('AuthProvider: login() - Starting login attempt for $email');
      final response = await _apiService.post('auth/login', {
        'email': email,
        'password': password,
      });

      debugPrint(
        'AuthProvider: login() - Response received: ${response != null}',
      );

      if (response != null) {
        final token = response['access_token'];
        final user = response['user'];

        debugPrint('AuthProvider: login() - token is null: ${token == null}');
        debugPrint('AuthProvider: login() - user is null: ${user == null}');

        if (token != null && user != null) {
          debugPrint('AuthProvider: Storing token and user data');
          debugPrint('AuthProvider: Token length: ${token.length}');
          debugPrint(
            'AuthProvider: Token starts with: ${token.substring(0, math.min(20, token.length))}...',
          );
          debugPrint('AuthProvider: User data received: $user');

          // First parse the user data
          try {
            _currentUser = User.fromJson(user);
            debugPrint(
              'AuthProvider: User parsed successfully: ${_currentUser?.email}',
            );
          } catch (e, stackTrace) {
            debugPrint('AuthProvider: ERROR parsing user: $e');
            debugPrint('AuthProvider: Stack trace: $stackTrace');
            _isLoading = false;
            _releaseAuthLock();
            notifyListeners();
            return false;
          }

          // IMPORTANT: Create fresh user from response BEFORE using it
          // This ensures publicId is available for userId getter
          final freshUser = User.fromJson(user);

          // Store in secure storage
          debugPrint('AuthProvider: Writing to secure storage...');
          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(
            key: 'user_id',
            value: user['publicId'] ?? user['id'].toString(),
          );
          // Store refresh token if available
          final refreshToken = response['refresh_token'];
          if (refreshToken != null) {
            await _storage.write(key: _REFRESH_TOKEN_KEY, value: refreshToken);
          }
          debugPrint('AuthProvider: Secure storage write complete');

          // Also save to SharedPreferences for synchronous restore on app resume
          debugPrint('AuthProvider: Writing to SharedPreferences...');
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_TOKEN_KEY, token);
          await prefs.setString(
            _USER_ID_KEY,
            user['publicId'] ?? user['id'].toString(),
          );
          // Cache the FRESH user with publicId, not the old cached one
          await prefs.setString(_CACHED_USER_KEY, freshUser.toJsonString());
          // Save refresh token to SharedPreferences
          if (refreshToken != null) {
            await prefs.setString(_REFRESH_TOKEN_KEY, refreshToken);
          }
          debugPrint('AuthProvider: SharedPreferences write complete');

          // Update static cache immediately
          debugPrint('AuthProvider: Updating static cache...');
          _cachedToken = token;
          _cachedUserId = user['publicId'] ?? user['id'].toString();
          _cachedUser = freshUser;
          _currentUser = freshUser;
          _cacheLoaded = true;
          _isLoading = false;

          debugPrint(
            'AuthProvider: Static cache updated - _cachedToken is null: ${_cachedToken == null}, _cachedUser is null: ${_cachedUser == null}',
          );

          // Fetch bookings after login
          if (context != null) {
            debugPrint('AuthProvider: Fetching bookings...');
            final bookingProvider = Provider.of<BookingProvider>(
              context,
              listen: false,
            );
            await bookingProvider.fetchBookings();
          }

          // Register FCM token after successful login - AWAIT THIS!
          debugPrint('AuthProvider: Registering FCM token after login');
          await FirebaseMessagingService.registerFcmToken();
          debugPrint('AuthProvider: FCM token registration completed');

          debugPrint('AuthProvider: Notifying listeners and returning true');
          notifyListeners();
          _releaseAuthLock();

          debugPrint('AuthProvider: login() - About to return true');
          return true;
        } else {
          debugPrint('AuthProvider: ERROR - token or user is null!');
        }
      } else {
        debugPrint('AuthProvider: ERROR - response is null!');
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      _releaseAuthLock();
      notifyListeners();
      return false;
    }

    _isLoading = false;
    _errorMessage = 'Invalid credentials';
    _releaseAuthLock();
    notifyListeners();
    return false;
  }

  Future<bool> register(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    // PRODUCTION FIX: Prevent race conditions - skip if auth operation in progress
    if (!_canPerformAuthOperation) {
      debugPrint(
        'AuthProvider: Register skipped - operation already in progress',
      );
      return false;
    }

    _acquireAuthLock();
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
        final refreshToken = response['refresh_token'];

        if (token != null && user != null) {
          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(key: 'user_id', value: user['id'].toString());
          if (refreshToken != null) {
            await _storage.write(key: _REFRESH_TOKEN_KEY, value: refreshToken);
          }

          // Also save to SharedPreferences for synchronous restore on app resume
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_TOKEN_KEY, token);
          await prefs.setString(
            _USER_ID_KEY,
            user['publicId'] ?? user['id'].toString(),
          );
          if (refreshToken != null) {
            await prefs.setString(_REFRESH_TOKEN_KEY, refreshToken);
          }
          _currentUser = User.fromJson(user);
          await prefs.setString(_CACHED_USER_KEY, _currentUser!.toJsonString());

          // Update static cache
          _cachedToken = token;
          _cachedUserId = user['publicId'] ?? user['id'].toString();
          _cachedUser = _currentUser;
          _cacheLoaded = true;

          _isLoading = false;
          _releaseAuthLock();
          notifyListeners();

          // Register FCM token after successful registration
          debugPrint('AuthProvider: Registering FCM token after registration');
          // ✅ FIX: Await FCM token registration BEFORE proceeding
          // This was previously a floating unawaited future that was killed on navigation
          await FirebaseMessagingService.registerFcmToken();

          return true;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      _releaseAuthLock();
      notifyListeners();
      return false;
    }

    _isLoading = false;
    _errorMessage = 'Registration failed';
    _releaseAuthLock();
    notifyListeners();
    return false;
  }

  /// PRODUCTION FIX: Silent auth state clear — no navigation.
  /// Call this from deep layers (ApiService) instead of logout().
  /// AuthWrapper will see _cachedToken=null and show LoginScreen naturally.
  void clearAuthState() {
    debugPrint('AuthProvider: clearAuthState called silently');
    _currentUser = null;
    _cachedToken = null;
    _cachedUserId = null;
    _cachedUser = null;
    _cacheLoaded = true; // Mark as "we checked, result is none"
    _isLoading = false;
    notifyListeners();
    // NOTE: No NavigationService call — AuthWrapper will redirect automatically
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _storage.delete(key: 'jwt_token');
      await _storage.delete(key: 'user_id');
      await _storage.delete(key: 'cached_user');
      await _storage.delete(key: _REFRESH_TOKEN_KEY);

      // Also clear from SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_TOKEN_KEY);
      await prefs.remove(_USER_ID_KEY);
      await prefs.remove(_CACHED_USER_KEY);
      await prefs.remove(_REFRESH_TOKEN_KEY);

      // Sign out from Firebase
      try {
        await firebase_auth.FirebaseAuth.instance.signOut();
        debugPrint('AuthProvider: Firebase signed out');
      } catch (e) {
        debugPrint(
          'AuthProvider: Firebase sign out error (can be ignored): $e',
        );
      }

      _currentUser = null;
      // Clear static cache
      _cachedToken = null;
      _cachedUserId = null;
      _cachedUser = null;
      _cacheLoaded = false;
      debugPrint('AuthProvider: User logged out');
      // Navigate to login screen
      NavigationService().navigateToLogin();
    } catch (e) {
      debugPrint('Error during logout: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Try to refresh the access token using the refresh token
  Future<bool> refreshAccessToken() async {
    try {
      // Get refresh token from storage
      final refreshToken = await _storage.read(key: _REFRESH_TOKEN_KEY);
      if (refreshToken == null) {
        debugPrint('AuthProvider: No refresh token found');
        return false;
      }

      // Call refresh endpoint
      final response = await _apiService.post('auth/refresh', {
        'refresh_token': refreshToken,
      });

      if (response != null && response['access_token'] != null) {
        final newAccessToken = response['access_token'];
        final newRefreshToken = response['refresh_token'];

        // Update stored tokens
        await _storage.write(key: _TOKEN_KEY, value: newAccessToken);
        if (newRefreshToken != null) {
          await _storage.write(key: _REFRESH_TOKEN_KEY, value: newRefreshToken);
        }

        // Update SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_TOKEN_KEY, newAccessToken);
        if (newRefreshToken != null) {
          await prefs.setString(_REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Update static cache
        _cachedToken = newAccessToken;

        debugPrint('AuthProvider: Token refreshed successfully');
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('AuthProvider: Error refreshing token: $e');
      return false;
    }
  }

  /// Handle TokenExpiredException by trying to refresh token first
  /// If refresh fails, clear auth state and redirect to login
  Future<void> handleTokenExpired() async {
    debugPrint('AuthProvider: Token expired, attempting to refresh...');

    // Try to refresh the token first
    final refreshed = await refreshAccessToken();
    if (refreshed) {
      debugPrint(
        'AuthProvider: Token refreshed successfully, no need to logout',
      );
      notifyListeners();
      return;
    }

    debugPrint(
      'AuthProvider: Token refresh failed, clearing session and redirecting to login',
    );

    // Clear all auth state
    _currentUser = null;
    _cachedToken = null;
    _cachedUserId = null;
    _cachedUser = null;
    _cacheLoaded = false;

    // Clear from secure storage
    try {
      await _storage.delete(key: 'jwt_token');
      await _storage.delete(key: 'user_id');
      await _storage.delete(key: 'cached_user');
      await _storage.delete(key: _REFRESH_TOKEN_KEY);
    } catch (e) {
      debugPrint('AuthProvider: Error clearing secure storage: $e');
    }

    // Clear from SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_TOKEN_KEY);
      await prefs.remove(_USER_ID_KEY);
      await prefs.remove(_CACHED_USER_KEY);
      await prefs.remove(_REFRESH_TOKEN_KEY);
    } catch (e) {
      debugPrint('AuthProvider: Error clearing SharedPreferences: $e');
    }

    // Notify listeners to update UI
    notifyListeners();

    // Navigate to login screen
    NavigationService().navigateToLogin();
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

  /// Login with Firebase phone authentication
  ///
  /// [phone] - Phone number in international format
  /// [idToken] - Firebase ID token
  ///
  /// Returns true if login successful
  Future<bool> loginWithFirebase({
    required String phone,
    required String idToken,
    String? firstName,
    String? lastName,
  }) async {
    // PRODUCTION FIX: Prevent race conditions - skip if auth operation in progress
    if (!_canPerformAuthOperation) {
      debugPrint(
        'AuthProvider: Firebase login skipped - operation already in progress',
      );
      return false;
    }

    _acquireAuthLock();
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post('auth/otp/verify-login', {
        'phone': phone,
        'idToken': idToken,
        if (firstName != null && firstName.trim().isNotEmpty)
          'firstName': firstName.trim(),
        if (lastName != null && lastName.trim().isNotEmpty)
          'lastName': lastName.trim(),
      });

      if (response != null) {
        final token = response['access_token'];
        final user = response['user'];

        if (token != null && user != null) {
          debugPrint('AuthProvider: Firebase login successful');
          debugPrint('AuthProvider: Token length: ${token.length}');

          _currentUser = User.fromJson(user);

          await _storage.write(key: 'jwt_token', value: token);
          await _storage.write(
            key: 'user_id',
            value: user['publicId'] ?? user['id'].toString(),
          );

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_TOKEN_KEY, token);
          await prefs.setString(
            _USER_ID_KEY,
            user['publicId'] ?? user['id'].toString(),
          );
          await prefs.setString(_CACHED_USER_KEY, _currentUser!.toJsonString());

          _cachedToken = token;
          _cachedUserId = user['publicId'] ?? user['id'].toString();
          _cachedUser = _currentUser;
          _cacheLoaded = true;

          // Check if profile needs completion
          _needsProfileCompletion = response['needsProfileCompletion'] == true;
          debugPrint(
            'AuthProvider: needsProfileCompletion: $_needsProfileCompletion',
          );

          _isLoading = false;

          // Register pending FCM token now that user is authenticated
          // This will send any stored pending FCM token to backend
          try {
            await FirebaseMessagingService.registerFcmToken();
            debugPrint(
              'AuthProvider: FCM token registered successfully after login',
            );
          } catch (e) {
            debugPrint('AuthProvider: Failed to register FCM token: $e');
          }

          _releaseAuthLock();
          notifyListeners();

          // Register FCM token after successful Firebase login
          debugPrint(
            'AuthProvider: Registering FCM token after Firebase login',
          );
          FirebaseMessagingService.registerFcmToken();

          return true;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      _releaseAuthLock();
      notifyListeners();
      return false;
    }

    _isLoading = false;
    _errorMessage = 'Firebase login failed';
    _releaseAuthLock();
    notifyListeners();
    return false;
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
