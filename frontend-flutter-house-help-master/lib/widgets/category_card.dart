import 'package:flutter/material.dart';
import '../core/theme/design_tokens.dart';

class CategoryCard extends StatelessWidget {
  final String category;
  final VoidCallback onTap;

  const CategoryCard({Key? key, required this.category, required this.onTap})
    : super(key: key);

  // Map categories to icons
  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return Icons.cleaning_services;
      case 'cooking':
        return Icons.restaurant;
      case 'electrician':
        return Icons.electrical_services;
      case 'plumber':
        return Icons.plumbing;
      case 'caretaker':
        return Icons.person;
      default:
        return Icons.category;
    }
  }

  // Map categories to colors
  Color _getCategoryColor(String category, bool isDark) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return isDark ? const Color(0xFF4A90E6) : Colors.blue[600]!;
      case 'cooking':
        return isDark ? const Color(0xFFE68A4A) : Colors.orange[600]!;
      case 'electrician':
        return isDark ? const Color(0xFFE6C34A) : Colors.yellow[700]!;
      case 'plumber':
        return isDark ? const Color(0xFF4AE68A) : Colors.green[600]!;
      case 'caretaker':
        return isDark ? const Color(0xFFA64AE6) : Colors.purple[600]!;
      default:
        return isDark ? Colors.grey[500]! : Colors.grey[600]!;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: 0,
      color: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? DesignTokens.cardDark.withValues(alpha: 0.8)
                : DesignTokens.cardLight,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.3)
                    : Colors.black.withValues(alpha: 0.06),
                blurRadius: 18,
                offset: const Offset(0, 4),
                spreadRadius: -4,
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getCategoryIcon(category),
                size: 32,
                color: _getCategoryColor(category, isDark),
              ),
              const SizedBox(height: 8),
              Text(
                category,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
