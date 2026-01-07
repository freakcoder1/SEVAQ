import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../providers/auth_provider.dart';
import '../providers/review_provider.dart';

class SubmitReviewScreen extends StatefulWidget {
  final Worker worker;

  const SubmitReviewScreen({Key? key, required this.worker}) : super(key: key);

  @override
  _SubmitReviewScreenState createState() => _SubmitReviewScreenState();
}

class _SubmitReviewScreenState extends State<SubmitReviewScreen> {
  int _rating = 5;
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _submitReview() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please log in to submit a review')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final reviewData = {
        'rating': _rating,
        'comment': _commentController.text.trim(),
        'userId': user.id,
        'workerId': widget.worker.id,
      };

      final reviewProvider = Provider.of<ReviewProvider>(
        context,
        listen: false,
      );
      final result = await reviewProvider.submitReview(reviewData);

      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Review submitted successfully!')),
        );
        Navigator.pop(context);
      } else {
        throw Exception('Failed to submit review');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error submitting review: ${e.toString()}')),
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text('Write a Review')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Rate ${widget.worker.user.firstName ?? 'Worker'}',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Row(
              children: List.generate(
                5,
                (index) => IconButton(
                  onPressed: () {
                    setState(() => _rating = index + 1);
                  },
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: theme.colorScheme.secondary,
                    size: 40,
                  ),
                ),
              ),
            ),
            SizedBox(height: 24),
            Text(
              'Leave a comment (optional)',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Share your experience...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: theme.colorScheme.primary,
                    width: 2,
                  ),
                ),
              ),
            ),
            Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitReview,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Text(
                        'Submit Review',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
