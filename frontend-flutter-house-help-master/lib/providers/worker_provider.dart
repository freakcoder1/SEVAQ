import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/worker.dart';

class WorkerProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Worker> _workers = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Worker> get workers => _workers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasError => _errorMessage != null;

  Future<void> fetchWorkers() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.get('workers');
      if (response != null) {
        _workers = (response as List).map((i) => Worker.fromJson(i)).toList();
        // Sort workers by rating descending
        _workers.sort((a, b) => b.rating.compareTo(a.rating));
      }
    } catch (e) {
      print('Error fetching workers: $e');
      _errorMessage = 'Unable to fetch workers. Please try again.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
