import 'package:flutter/material.dart';

/// Reassurance strip widget for the Service Clarification Page
/// Provides trust reinforcement before the CTA
class ReassuranceStrip extends StatelessWidget {
  final String text;

  const ReassuranceStrip({
    Key? key,
    this.text =
        "We'll assign the right professional and monitor the visit end-to-end.",
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          // Subtle icon for reassurance
          Icon(
            Icons.shield_moon_outlined,
            size: 20,
            color: const Color(0xFF6C757D),
          ),

          const SizedBox(width: 12),

          // Reassurance text
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14,
                color: const Color(0xFF6C757D),
                fontStyle: FontStyle.italic,
                height: 1.4,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.left,
            ),
          ),
        ],
      ),
    );
  }
}
