import 'package:flutter/material.dart';
import '../models/recommendation.dart';

class SmartSuggestions extends StatelessWidget {
  final List<Suggestion> suggestions;
  final Function(Suggestion) onSuggestionTap;

  const SmartSuggestions({
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
      margin: EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Smart suggestions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.black87,
            ),
          ),

          SizedBox(height: 12),

          // Horizontal scroll for suggestions
          SizedBox(
            height: 140, // Increased height to prevent overflow
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: suggestions.length,
              itemBuilder: (context, index) {
                return _buildSuggestionCard(suggestions[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionCard(Suggestion suggestion) {
    return Container(
      width: 280,
      margin: EdgeInsets.only(right: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: suggestion.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: suggestion.backgroundColor.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon and title
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: suggestion.iconColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  suggestion.icon,
                  color: suggestion.iconColor,
                  size: 24,
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 4),
                    Text(
                      suggestion.subtitle,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: 16),

          // Action button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => onSuggestionTap(suggestion),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: suggestion.iconColor),
                padding: EdgeInsets.symmetric(vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'View details',
                style: TextStyle(
                  color: suggestion.iconColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
