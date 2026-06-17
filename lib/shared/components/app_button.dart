import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';

enum AppButtonStyle { primary, secondary }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final AppButtonStyle style;
  final bool isLoading;
  final bool isEnabled;

  const AppButton({
    required this.text,
    required this.onPressed,
    this.style = AppButtonStyle.primary,
    this.isLoading = false,
    this.isEnabled = true,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (style == AppButtonStyle.secondary) {
      return OutlinedButton(
        onPressed: isEnabled ? onPressed : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: isEnabled 
              ? AppColors.primaryGreen 
              : AppColors.textSecondary,
          side: BorderSide(
            color: isEnabled 
                ? AppColors.primaryGreen 
                : AppColors.border,
            width: 1.5,
          ),
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.buttons),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.base,
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primaryGreen,
                ),
              )
            : Text(
                text,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: isEnabled 
                      ? AppColors.primaryGreen 
                      : AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
      );
    }

    return ElevatedButton(
      onPressed: isEnabled ? onPressed : null,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryGreen,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppColors.border,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.buttons),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.base,
        ),
      ),
      child: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(
              text,
              style: theme.textTheme.labelLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
    );
  }
}