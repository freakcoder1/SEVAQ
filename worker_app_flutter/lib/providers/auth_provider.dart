import 'package:flutter/foundation.dart';
import '../models/worker.dart';
import '../services/api_service.dart';

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

  // Request OTP - kept for backward compatibility but not used in current UI
  Future<bool> requestOtp(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Firebase OTP is sent client-side, so we just return success
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

  // Verify OTP and login (for Firebase OTP verification)
  Future<bool> verifyOtp(String phone, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Call the OTP verify-login endpoint
      final response = await _apiService.post('auth/otp/verify-login', {
        'phone': phone,
        'idToken': otp, // Firebase idToken
      });

      if (response != null && response['accessToken'] != null) {
        await _apiService.saveToken(response['accessToken']);
        await fetchWorkerProfile();
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = 'Invalid OTP or phone number';
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

  // Fetch worker profile
  Future<void> fetchWorkerProfile() async {
    try {
      final response = await _apiService.get('workers/me');
      debugPrint('fetchWorkerProfile response: $response');
      if (response != null) {
        // Handle both formats: {worker: {...}} or direct worker object
        final Map<String, dynamic> responseMap =
            Map<String, dynamic>.from(response as Map);
        if (responseMap.containsKey('worker')) {
          _worker =
              Worker.fromJson(responseMap['worker'] as Map<String, dynamic>);
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

  // Register a new worker
  Future<bool> registerWorker({
    required String phone,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    List<String>? serviceCategories,
    Map<String, dynamic>? serviceArea,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('auth/workers/register', {
        'phone': phone,
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'serviceCategories': serviceCategories ?? [],
        'serviceArea': serviceArea,
      });

      if (response != null && response['access_token'] != null) {
        await _apiService.saveToken(response['access_token']);
        await fetchWorkerProfile();
        _isAuthenticated = true;
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
