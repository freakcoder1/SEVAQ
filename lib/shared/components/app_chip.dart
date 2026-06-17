import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';

class AppChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  const AppChip({
    required this.label,
    this.isSelected = false,
    this.onTap,
    this.padding,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.chips),
      child: Container(
        padding: padding ?? const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppColors.primaryGreen 
              : AppColors.primaryGreenLight,
          borderRadius: BorderRadius.circular(AppRadius.chips),
        ),
        child: Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: isSelected 
                ? Colors.white 
                : AppColors.primaryGreen,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class AppChoiceChip extends StatelessWidget {
  final String label;
  final bool selected;
  final ValueChanged<bool?> onChanged;
  final EdgeInsetsGeometry? padding;

  const AppChoiceChip({
    required this.label,
    required this.selected,
    required this.onChanged,
    this.padding,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return ChoiceChip(
      label: Text(
        label,
        style: theme.textTheme.bodySmall?.copyWith(
          color: selected 
              ? Colors.white 
              : AppColors.primaryGreen,
          fontWeight: FontWeight.w500,
        ),
      ),
      selected: selected,
      onSelected: onChanged,
      backgroundColor: AppColors.primaryGreenLight,
      selectedColor: AppColors.primaryGreen,
      side: BorderSide.none,
      padding: padding ?? const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.chips),
      ),
    );
  }
}