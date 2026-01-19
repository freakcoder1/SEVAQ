import 'package:flutter/material.dart';
import '../models/service_option.dart';

/// Contextual follow-up widget for the Service Clarification Page
/// Shows smart follow-up questions based on selected service
class ContextualFollowup extends StatelessWidget {
  final ServiceOption? selectedService;
  final String? followupResponse;
  final ValueChanged<String?> onFollowupChanged;

  const ContextualFollowup({
    Key? key,
    required this.selectedService,
    required this.followupResponse,
    required this.onFollowupChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (selectedService == null) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Follow-up question
        Text(
          selectedService!.getContextualQuestion(),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),

        const SizedBox(height: 16),

        // Follow-up options (chips)
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: selectedService!.getContextualOptions().map((option) {
            final isSelected = followupResponse == option;

            return FilterChip(
              label: Text(
                option,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              selected: isSelected,
              selectedColor: const Color(0xFF1976D2),
              backgroundColor: Colors.grey[100],
              checkmarkColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected ? Colors.transparent : Colors.grey[300]!,
                ),
              ),
              onSelected: (bool selected) {
                onFollowupChanged(selected ? option : null);
              },
            );
          }).toList(),
        ),

        const SizedBox(height: 16),

        // Optional text field for additional details
        TextField(
          decoration: InputDecoration(
            hintText: 'Tell us in your own words (optional)',
            hintStyle: TextStyle(color: Colors.black38, fontSize: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF1976D2)),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
          ),
          maxLines: 2,
          onChanged: (value) {
            // Only update if user is typing something new
            if (value.isNotEmpty &&
                !selectedService!.getContextualOptions().contains(value)) {
              onFollowupChanged(value);
            }
          },
        ),
      ],
    );
  }
}
