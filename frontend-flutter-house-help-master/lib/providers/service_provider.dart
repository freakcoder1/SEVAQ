import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/service.dart';

class ServiceProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Service> _services = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Service> get services => _services;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasError => _errorMessage != null;

  Future<void> fetchServices() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.get('services');
      if (response != null) {
        _services = (response as List).map((i) => Service.fromJson(i)).toList();
      }
    } catch (e) {
      print('Error fetching services: $e');
      _errorMessage = 'Unable to fetch services. Please try again.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
