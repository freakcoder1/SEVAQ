import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    // Check server connectivity first
    final isServerAvailable = await _apiService.checkServerHealth();
    if (!isServerAvailable) {
      _errorMessage = 'Server is not available. Please check your internet connection and try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
    
    try {
      final response = await _apiService.post('auth/login', {
        'email': email,
        'password': password,
      });
      await _apiService.saveToken(response['access_token']);
      _user = User.fromJson(response['user']);
      // Store user ID for location services
      await _apiService.saveUserId(_user!.id.toString());
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    // Check server connectivity first
    final isServerAvailable = await _apiService.checkServerHealth();
    if (!isServerAvailable) {
      _errorMessage = 'Server is not available. Please check your internet connection and try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
    
    try {
      final response = await _apiService.post('auth/signup', {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
      });
      await _apiService.saveToken(response['access_token']);
      _user = User.fromJson(response['user']);
      // Store user ID for location services
      await _apiService.saveUserId(_user!.id.toString());
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.clearToken();
    await _apiService.clearUserId();
    _user = null;
    notifyListeners();
  }

  Future<bool> updateProfile(String firstName, String lastName, String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.patch('auth/profile', {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
      });
      _user = User.fromJson(response);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> checkAuth() async {
    final token = await _apiService.getToken();
    if (token != null) {
      try {
        // Check server connectivity first
        final isServerAvailable = await _apiService.checkServerHealth();
        if (!isServerAvailable) {
          // Server is not available, but we have a token
          // This might be an offline scenario, so we can still set the user
          // based on stored data if available, or just return
          return;
        }
        
        final response = await _apiService.get('auth/profile');
        _user = User.fromJson(response);
        // Store user ID for location services
        await _apiService.saveUserId(_user!.id.toString());
        notifyListeners();
      } catch (e) {
        // Token might be invalid, clear it
        await logout();
      }
    }
  }
}
