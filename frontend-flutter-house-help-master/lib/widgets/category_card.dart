import 'package:flutter/material.dart';

class CategoryCard extends StatelessWidget {
  final String category;
  final VoidCallback onTap;

  const CategoryCard({
    Key? key,
    required this.category,
    required this.onTap,
  }) : super(key: key);

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
  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return Colors.blue[600]!;
      case 'cooking':
        return Colors.orange[600]!;
      case 'electrician':
        return Colors.yellow[700]!;
      case 'plumber':
        return Colors.green[600]!;
      case 'caretaker':
        return Colors.purple[600]!;
      default:
        return Colors.grey[600]!;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getCategoryIcon(category),
                size: 32,
                color: _getCategoryColor(category),
              ),
              SizedBox(height: 8),
              Text(
                category,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
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