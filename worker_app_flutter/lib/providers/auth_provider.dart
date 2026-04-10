import 'package:flutter/foundation.dart';
import '../models/worker.dart';
import '../services/api_service.dart';
import '../services/firebase_auth_service.dart';
import '../services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  Worker? _worker;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;

  Worker? get worker => _worker;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;
  bool get isAvailable => _worker?.isAvailable ?? false;

  // Check if worker is already logged in
  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _apiService.isLoggedIn();
      if (isLoggedIn) {
        await fetchWorkerProfile();
      }
      _isAuthenticated = isLoggedIn;
    } catch (e) {
      _error = e.toString();
      _isAuthenticated = false;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Register FCM token after successful login
  Future<void> _registerFcmTokenAfterLogin() async {
    try {
      final notificationService = NotificationService();
      // Retry registration after login when JWT token is available
      await notificationService.retryRegisterToken();
      debugPrint('FCM token registration triggered after login');
    } catch (e) {
      debugPrint('Error registering FCM token after login: $e');
    }
  }

  // Login with email and password (for workers)
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('auth/login', {
        'email': email,
        'password': password,
      });

      if (response != null && response['access_token'] != null) {
        await _apiService.saveToken(response['access_token']);
        await fetchWorkerProfile();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();

        // Register FCM token after successful login
        _registerFcmTokenAfterLogin();

        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Verify OTP using Firebase ID token (called from login screen)
  Future<bool> verifyOtpWithToken(String phone, String idToken) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Check if we should use dev bypass (for testing without Firebase)
      // This is automatically enabled in debug mode when Firebase fails
      // Support both 'dev_bypass' and 'dev_test_token' for backward compatibility
      final useDevBypass = idToken.isEmpty ||
          idToken == 'dev_bypass' ||
          idToken == 'dev_test_token';

      // Use dev token for development/testing - backend has bypass mode
      final tokenToSend = useDevBypass ? 'dev_test_token' : idToken;

      debugPrint(
          'DEBUG verifyOtpWithToken: phone=$phone, usingDevBypass=$useDevBypass');

      // Call the OTP verify-login endpoint with the ID token
      final response = await _apiService.post('auth/otp/verify-login', {
        'phone': phone,
        'idToken': tokenToSend,
      });

      if (response != null &&
          (response['access_token'] != null ||
              response['accessToken'] != null)) {
        // Handle both snake_case (access_token) and camelCase (accessToken)
        final token = response['access_token'] ?? response['accessToken'];
        await _apiService.saveToken(token as String);
        await fetchWorkerProfile();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        debugPrint('DEBUG verifyOtpWithToken: SUCCESS');

        // Register FCM token after successful login
        _registerFcmTokenAfterLogin();

        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        debugPrint('DEBUG verifyOtpWithToken: Invalid response');
        return false;
      }
    } catch (e) {
      debugPrint('DEBUG verifyOtpWithToken: Error - $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Verify OTP and login using Firebase
  Future<bool> verifyOtp(
      String phone, String verificationId, String smsCode) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Sign in with Firebase OTP
      final userCredential = await FirebaseAuthService.signInWithOTP(
        verificationId: verificationId,
        smsCode: smsCode,
      );

      // Get Firebase ID token
      final idToken = await userCredential.user?.getIdToken();
      if (idToken == null) {
        _error = 'Failed to get Firebase ID token';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      // Call the OTP verify-login endpoint with the ID token
      final response = await _apiService.post('auth/otp/verify-login', {
        'phone': phone,
        'idToken': idToken,
      });

      if (response != null &&
          (response['access_token'] != null ||
              response['accessToken'] != null)) {
        // Handle both snake_case (access_token) and camelCase (accessToken)
        final token = response['access_token'] ?? response['accessToken'];
        await _apiService.saveToken(token as String);
        await fetchWorkerProfile();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();

        // Register FCM token after successful login
        _registerFcmTokenAfterLogin();

        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Request OTP - send to Firebase
  Future<bool> requestOtp(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Firebase OTP is sent client-side
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Fetch worker profile
  Future<void> fetchWorkerProfile() async {
    try {
      final response = await _apiService.get('workers/me');
      debugPrint('fetchWorkerProfile response: $response');

      if (response != null) {
        final Map<String, dynamic> responseMap =
            Map<String, dynamic>.from(response);

        // Check if worker needs registration
        if (responseMap['needsRegistration'] == true) {
          debugPrint(
              'Worker profile not found - user needs to register as worker');
          _worker = null;
          notifyListeners();
          return;
        }

        // Handle both formats: {worker: {...}} or direct worker object
        if (responseMap.containsKey('worker')) {
          final workerData = responseMap['worker'];
          if (workerData != null) {
            _worker = Worker.fromJson(Map<String, dynamic>.from(workerData));
          }
        } else if (responseMap['id'] != null) {
          _worker = Worker.fromJson(responseMap);
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching worker profile: $e');
    }
  }

  // Toggle availability
  Future<bool> toggleAvailability() async {
    if (_worker == null) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.patch('workers/me/availability', {
        'isAvailable': !_worker!.isAvailable,
      });

      if (response != null && response['worker'] != null) {
        _worker = Worker.fromJson(response['worker']);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    await _apiService.clearToken();
    _worker = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  // Register worker profile for already authenticated user
  // POST /workers/me/register
  Future<bool> registerWorkerProfile({
    String? bio,
    List<String>? serviceIds,
    double? latitude,
    double? longitude,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      debugPrint('DEBUG registerWorkerProfile: Starting registration');

      final response = await _apiService.post('workers/me/register', {
        'bio': bio ?? '',
        'serviceIds': serviceIds ?? [],
        'latitude': latitude ?? 28.5804579,
        'longitude': longitude ?? 77.4392951,
      });

      debugPrint('DEBUG registerWorkerProfile: Response: $response');

      if (response != null && response['worker'] != null) {
        _worker =
            Worker.fromJson(Map<String, dynamic>.from(response['worker']));
        _isLoading = false;
        notifyListeners();
        debugPrint('DEBUG registerWorkerProfile: SUCCESS');
        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('DEBUG registerWorkerProfile: Error - $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register a new worker
  Future<bool> registerWorker({
    required String phone,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? address,
    List<String>? serviceCategories,
    Map<String, dynamic>? serviceArea,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Debug the payload being sent
      final payload = {
        'phone': phone,
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'address': address ?? '',
        'serviceCategories': serviceCategories ?? [],
        'serviceArea': serviceArea,
      };
      debugPrint('DEBUG registerWorker payload: $payload');

      final response = await _apiService.post('auth/workers/register', payload);

      if (response != null && response['access_token'] != null) {
        await _apiService.saveToken(response['access_token']);
        await fetchWorkerProfile();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();

        // Register FCM token after successful registration
        _registerFcmTokenAfterLogin();

        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Update worker's display name (firstName and lastName on user entity)
  Future<bool> updateWorkerName({
    required String firstName,
    required String lastName,
  }) async {
    if (_worker == null) return false;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.patch('workers/me/name', {
        'firstName': firstName,
        'lastName': lastName,
      });

      debugPrint('updateWorkerName response: $response');

      if (response != null) {
        // Update the worker profile with the new name
        await fetchWorkerProfile();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Invalid response from server';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('Error updating worker name: $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
