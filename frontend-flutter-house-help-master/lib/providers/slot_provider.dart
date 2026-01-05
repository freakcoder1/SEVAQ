import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/slot.dart';

class SlotProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Slot> _slots = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Slot> get slots => _slots;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  SlotProvider();

  Future<void> fetchSlots() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('slots');
      if (response != null) {
        _slots = (response as List).map((i) => Slot.fromJson(i)).toList();
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

  Future<void> fetchSlotsForWorker(String workerId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get('slots/worker/$workerId');
      if (response != null) {
        _slots = (response as List).map((i) => Slot.fromJson(i)).toList();
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

  Future<void> fetchAvailableSlots(String workerId, DateTime date) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.get(
        'slots/worker/$workerId/available?date=${date.toIso8601String()}',
      );
      if (response != null) {
        _slots = (response as List).map((i) => Slot.fromJson(i)).toList();
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

  void clearSlots() {
    _slots = [];
    notifyListeners();
  }
}
