import 'package:flutter/material.dart';
import '../theme.dart';

class ProactiveMessage extends StatelessWidget {
  final String message;
  final IconData? icon;
  final Color? backgroundColor;
  final VoidCallback? onTap;

  const ProactiveMessage({
    Key? key,
    required this.message,
    this.icon,
    this.backgroundColor,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 10,
        ), // Increased by 2px for better breathing room
        decoration: BoxDecoration(
          color: backgroundColor ?? AppTheme.secondarySurface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppTheme.cardShadow,
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 14, color: AppTheme.emeraldGreen),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Text(
                message,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: theme.colorScheme.onSurface,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
