import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../../../shared/components/app_chip.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/subscription_config_state.dart';

class SubscriptionConfigScreen extends ConsumerStatefulWidget {
  const SubscriptionConfigScreen({super.key});

  @override
  ConsumerState<SubscriptionConfigScreen> createState() => _SubscriptionConfigScreenState();
}

class _SubscriptionConfigScreenState extends ConsumerState<SubscriptionConfigScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cookingProvider.select((s) => s.configState));
    final notifier = ref.read(cookingProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Monthly Cooking Subscription',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Tell us about your household so we can recommend the right cooking support.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'How many people need meals?',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: AppSpacing.lg,
                mainAxisSpacing: AppSpacing.lg,
                childAspectRatio: 1.5,
                children: [
                  _buildPersonCard(context, 1, state.persons == 1, () => notifier.setPersons(1)),
                  _buildPersonCard(context, 2, state.persons == 2, () => notifier.setPersons(2)),
                  _buildPersonCard(context, 3, state.persons == 3, () => notifier.setPersons(3)),
                  _buildPersonCard(context, 4, state.persons == 4, () => notifier.setPersons(4)),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Which meals would you like covered?',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  AppChoiceChip(
                    label: 'Breakfast',
                    selected: state.selectedMeals.contains(MealType.breakfast),
                    onChanged: (selected) => notifier.toggleMeal(MealType.breakfast),
                  ),
                  AppChoiceChip(
                    label: 'Lunch',
                    selected: state.selectedMeals.contains(MealType.lunch),
                    onChanged: (selected) => notifier.toggleMeal(MealType.lunch),
                  ),
                  AppChoiceChip(
                    label: 'Dinner',
                    selected: state.selectedMeals.contains(MealType.dinner),
                    onChanged: (selected) => notifier.toggleMeal(MealType.dinner),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildPlanSummary(context, state),
              const SizedBox(height: AppSpacing.xl),
              _buildGuaranteeSection(context),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Continue',
                isLoading: false,
                isEnabled: state.canContinue,
                onPressed: () {
                  // Navigate to schedule
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPersonCard(BuildContext context, int count, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEAF5F1) : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.cards),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            count == 4 ? '4+' : '$count',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlanSummary(BuildContext context, SubscriptionConfigState state) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Plan Summary',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Persons: ${state.persons}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          if (state.selectedMeals.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Meals:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            for (final meal in state.selectedMeals) ...[
              const SizedBox(height: AppSpacing.xs),
              Row(
                children: [
                  const Icon(
                    Icons.check,
                    color: AppColors.primaryGreen,
                    size: 16,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    meal.name.capitalize(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildGuaranteeSection(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Service Guarantee',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildGuaranteeRow(context, 'Verified professionals'),
          const SizedBox(height: AppSpacing.sm),
          _buildGuaranteeRow(context, 'Managed replacements'),
          const SizedBox(height: AppSpacing.sm),
          _buildGuaranteeRow(context, 'Quality monitoring'),
        ],
      ),
    );
  }

  Widget _buildGuaranteeRow(BuildContext context, String text) {
    return Row(
      children: [
        const Icon(
          Icons.check,
          color: AppColors.primaryGreen,
          size: 16,
        ),
        const SizedBox(width: AppSpacing.sm),
        Text(
          text,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}