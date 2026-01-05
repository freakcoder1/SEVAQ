import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../providers/review_provider.dart';
import 'submit_review_screen.dart';

class ReviewsScreen extends StatefulWidget {
  final Worker worker;

  const ReviewsScreen({Key? key, required this.worker}) : super(key: key);

  @override
  _ReviewsScreenState createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  @override
  void initState() {
    super.initState();
    // Use WidgetsBinding.instance.addPostFrameCallback to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ReviewProvider>(
        context,
        listen: false,
      ).fetchReviewsForWorker(widget.worker.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Reviews for ${widget.worker.user.firstName}'),
      ),
      body: Consumer<ReviewProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }

          if (provider.reviews.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.rate_review,
                    size: 80,
                    color: theme.colorScheme.secondary.withAlpha(
                      (0.5 * 255).round(),
                    ),
                  ),
                  SizedBox(height: 16),
                  Text('No reviews yet', style: theme.textTheme.titleLarge),
                  SizedBox(height: 8),
                  Text(
                    'Be the first to leave a review!',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurface.withAlpha(
                        (0.7 * 255).round(),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: EdgeInsets.all(16),
            itemCount: provider.reviews.length,
            itemBuilder: (context, index) {
              final review = provider.reviews[index];
              return Card(
                margin: EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            child: Text(
                              review.user.firstName[0].toUpperCase(),
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${review.user.firstName} ${review.user.lastName}',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Row(
                                  children: List.generate(
                                    5,
                                    (starIndex) => Icon(
                                      starIndex < review.rating
                                          ? Icons.star
                                          : Icons.star_border,
                                      color: theme.colorScheme.secondary,
                                      size: 20,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (review.comment != null &&
                          review.comment!.isNotEmpty) ...[
                        SizedBox(height: 12),
                        Text(review.comment!, style: theme.textTheme.bodyLarge),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => SubmitReviewScreen(worker: widget.worker),
            ),
          );
        },
        child: Icon(Icons.add),
        tooltip: 'Write a review',
      ),
    );
  }
}
