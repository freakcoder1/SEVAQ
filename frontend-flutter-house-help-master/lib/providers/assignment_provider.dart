import 'package:flutter/material.dart';
import '../models/worker.dart';
import '../models/service.dart';

/// Assignment State Provider
/// Manages assignment state across screen transitions
class AssignmentProvider with ChangeNotifier {
  Worker? _worker;
  Service? _service;
  DateTime? _startTime;
  DateTime? _endTime;
  double _amount = 0.0;
  bool _isAssignmentInProgress = false;

  Worker? get worker => _worker;
  Service? get service => _service;
  DateTime? get startTime => _startTime;
  DateTime? get endTime => _endTime;
  double get amount => _amount;
  bool get isAssignmentInProgress => _isAssignmentInProgress;

  void setAssignmentState({
    Worker? worker,
    Service? service,
    DateTime? startTime,
    DateTime? endTime,
    double? amount,
  }) {
    _worker = worker;
    _service = service;
    _startTime = startTime;
    _endTime = endTime;
    _amount = amount ?? _amount;
    notifyListeners();
  }

  void setAssignmentInProgress(bool inProgress) {
    _isAssignmentInProgress = inProgress;
    notifyListeners();
  }

  void resetAssignmentState() {
    _worker = null;
    _service = null;
    _startTime = null;
    _endTime = null;
    _amount = 0.0;
    _isAssignmentInProgress = false;
    notifyListeners();
  }

  bool get hasAssignmentState => _worker != null;
}
