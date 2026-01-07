import 'package:flutter/material.dart';
import '../models/recommendation.dart';

class MemorySection extends StatelessWidget {
  final UserHistory userHistory;
  final VoidCallback onRepeatBooking;

  const MemorySection({
    Key? key,
    required this.userHistory,
    required this.onRepeatBooking,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!userHistory.hasFavoriteWorker && !userHistory.hasRecentBooking) {
      return SizedBox();
    }

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.purple[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.purple[200]!),
      ),
      child: Row(
        children: [
          // Icon
          Icon(Icons.favorite, color: Colors.purple[700], size: 24),

          SizedBox(width: 12),

          // Content
          Expanded(child: _buildMemoryContent()),

          // Action Button
          _buildRepeatButton(),
        ],
      ),
    );
  }

  Widget _buildMemoryContent() {
    if (userHistory.hasFavoriteWorker) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Book the same professional again',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              fontSize: 14,
            ),
          ),
          SizedBox(height: 4),
          Text(
            '${userHistory.favoriteWorker!.user.firstName} - ${userHistory.favoriteWorker!.rating.toStringAsFixed(1)}★ (${userHistory.favoriteWorker!.reviewCount} reviews)',
            style: TextStyle(
              color: Colors.purple[700],
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
    } else if (userHistory.hasRecentBooking) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Repeat your last booking',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              fontSize: 14,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Last booked: ${userHistory.lastBookingText}',
            style: TextStyle(
              color: Colors.purple[700],
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
    } else {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your booking history',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              fontSize: 14,
            ),
          ),
          SizedBox(height: 4),
          Text(
            '${userHistory.totalBookings} total bookings',
            style: TextStyle(
              color: Colors.purple[700],
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      );
    }
  }

  Widget _buildRepeatButton() {
    return ElevatedButton(
      onPressed: onRepeatBooking,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.purple[600],
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
      child: Text(
        userHistory.hasFavoriteWorker
            ? 'Book ${userHistory.favoriteWorker!.user.firstName}'
            : 'Repeat booking',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
