import 'package:flutter/foundation.dart';
import '../models/earnings.dart';
import '../services/api_service.dart';

class EarningsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  Earnings? _earnings;
  bool _isLoading = false;
  String? _error;

  Earnings? get earnings => _earnings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchEarnings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('workers/me/earnings');
      if (response != null) {
        _earnings = Earnings.fromJson(response);
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Error fetching earnings: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
