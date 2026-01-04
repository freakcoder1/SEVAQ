import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/slot.dart';

class SlotProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Slot> _slots = [];
  bool _isLoading = false;

  List<Slot> get slots => _slots;
  bool get isLoading => _isLoading;

  Future<void> fetchSlots() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.get('slots');
      if (response != null) {
        _slots = (response as List).map((i) => Slot.fromJson(i)).toList();
      }
    } catch (e) {
      print('Error fetching slots: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Method to filter slots by worker would be good usually, but backend might not support it yet
  // For now let's assume we fetch all and filter client side or implement backend filter
  List<Slot> getSlotsForWorker(String workerId) {
    return _slots.where((s) => s.workerId == workerId && !s.isBooked).toList();
  }
}
