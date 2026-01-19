import 'package:flutter/material.dart';

class TrustFirstSuggestions extends StatelessWidget {
  final List<String> suggestions;
  final Function(String) onSuggestionTap;

  const TrustFirstSuggestions({
    Key? key,
    required this.suggestions,
    required this.onSuggestionTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) {
      return SizedBox();
    }

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Other options',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),

          SizedBox(height: 8),

          // Horizontal scroll for suggestions (max 2)
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: suggestions.length,
              itemBuilder: (context, index) {
                return _buildSuggestionChip(suggestions[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionChip(String suggestion) {
    return Container(
      margin: EdgeInsets.only(right: 8),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Text(
        suggestion,
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey[600],
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
