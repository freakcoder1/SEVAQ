import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/service.dart';

class ServiceProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Service> _services = [];
  List<Service> _availableServices = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Service> get services => _services;
  List<Service> get availableServices => _availableServices;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  ServiceProvider();

  Future<void> fetchServices() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('services');
      if (response != null) {
        _services = (response as List).map((i) => Service.fromJson(i)).toList();
        notifyListeners();
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

  Future<void> fetchAvailableServices(
    double lat,
    double lng, [
    double radius = 5.0,
  ]) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.getAvailableServices(lat, lng, radius);
      if (response != null) {
        _availableServices = (response as List)
            .map((i) => Service.fromJson(i))
            .toList();
        notifyListeners();
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

  void clearServices() {
    _services = [];
    _availableServices = [];
    notifyListeners();
  }
}
