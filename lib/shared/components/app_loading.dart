import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class AppLoading extends StatelessWidget {
  final double size;
  final Color? color;
  final double strokeWidth;

  const AppLoading({
    this.size = 40,
    this.color,
    this.strokeWidth = 3,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        color: color ?? AppColors.primaryGreen,
      ),
    );
  }
}

class AppLoadingScreen extends StatelessWidget {
  final String? message;

  const AppLoadingScreen({
    this.message,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppLoading(),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}