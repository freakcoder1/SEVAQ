import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeProvider with ChangeNotifier {
  bool _isDarkMode = false;
  bool _isInitialized = false;
  final _storage = FlutterSecureStorage();

  bool get isDarkMode => _isDarkMode;
  bool get isInitialized => _isInitialized;

  ThemeProvider() {
    _initializeTheme();
  }

  Future<void> _initializeTheme() async {
    try {
      String? theme = await _storage.read(key: 'theme');
      _isDarkMode = theme == 'dark';
      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      _isDarkMode = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    _saveThemeToStorage();
    notifyListeners();
  }

  Future<void> _saveThemeToStorage() async {
    await _storage.write(key: 'theme', value: _isDarkMode ? 'dark' : 'light');
  }
}
