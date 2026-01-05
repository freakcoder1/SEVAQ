import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class UserProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  UserProvider();

  void setUser(User user) {
    _currentUser = user;
    notifyListeners();
  }

  Future<void> fetchCurrentUser() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final token = await _apiService.getToken();
      if (token != null) {
        final response = await _apiService.get('auth/profile');
        if (response != null) {
          _currentUser = User.fromJson(response);
          notifyListeners();
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updateData) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.patch(
        'users/${_currentUser?.id}',
        updateData,
      );

      if (response != null) {
        _currentUser = User.fromJson(response);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearUser() {
    _currentUser = null;
    notifyListeners();
  }
}
