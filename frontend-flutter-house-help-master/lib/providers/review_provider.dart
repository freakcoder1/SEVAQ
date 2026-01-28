import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/review.dart';

class ReviewProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Review> _reviews = [];
  bool _isLoading = false;

  List<Review> get reviews => _reviews;
  bool get isLoading => _isLoading;

  Future<void> fetchReviewsForWorker(int workerId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiService.get('reviews/worker/$workerId');
      if (response != null) {
        _reviews = (response as List).map((i) => Review.fromJson(i)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching reviews: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Review?> submitReview(Map<String, dynamic> reviewData) async {
    try {
      final response = await _apiService.post('reviews', reviewData);
      if (response != null) {
        final review = Review.fromJson(response);
        _reviews.add(review);
        notifyListeners();
        return review;
      }
    } catch (e) {
      debugPrint('Error submitting review: $e');
    }
    return null;
  }

  void clearReviews() {
    _reviews = [];
    notifyListeners();
  }
}
