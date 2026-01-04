import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeProvider with ChangeNotifier {
  bool _isDarkMode = false;
  final _storage = FlutterSecureStorage();

  bool get isDarkMode => _isDarkMode;

  ThemeProvider() {
    _loadThemeFromStorage();
  }

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    _saveThemeToStorage();
    notifyListeners();
  }

  Future<void> _loadThemeFromStorage() async {
    String? theme = await _storage.read(key: 'theme');
    if (theme == 'dark') {
      _isDarkMode = true;
    } else {
      _isDarkMode = false;
    }
    notifyListeners();
  }

  Future<void> _saveThemeToStorage() async {
    await _storage.write(key: 'theme', value: _isDarkMode ? 'dark' : 'light');
  }
}