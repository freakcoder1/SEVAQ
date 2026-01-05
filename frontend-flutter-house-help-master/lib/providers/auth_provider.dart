import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    try {
      final token = await _storage.read(key: 'jwt_token');
      if (token != null) {
        final userId = await _storage.read(key: 'user_id');
        if (userId != null) {
          final response = await _apiService.get('users/$userId');
          if (response != null) {
            _currentUser = User.fromJson(response);
            notifyListeners();
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading current user: $e');
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
      final response = await _apiService.post('auth/register', {
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
      _currentUser = null;
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

  bool get isAuthenticated => _currentUser != null;

  // Compatibility methods for existing code
  User? get user => _currentUser;

  Future<void> checkAuth() async {
    await _loadCurrentUser();
  }

  Future<bool> signup(
    String email,
    String password,
    String firstName,
    String lastName,
  ) async {
    return await register(email, password, firstName, lastName);
  }
}
