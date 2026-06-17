import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/subscription_config_state.dart' as config;
import '../../domain/entities/subscription_schedule_state.dart' as schedule;

class ReviewPlanScreen extends ConsumerStatefulWidget {
  const ReviewPlanScreen({super.key});

  @override
  ConsumerState<ReviewPlanScreen> createState() => _ReviewPlanScreenState();
}

class _ReviewPlanScreenState extends ConsumerState<ReviewPlanScreen> {
  @override
  Widget build(BuildContext context) {
    final configState = ref.watch(cookingProvider.select((s) => s.configState));
    final scheduleState = ref.watch(cookingProvider.select((s) => s.scheduleState));

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
                'Review your subscription before checkout.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildPlanSummary(context, configState, scheduleState),
              const SizedBox(height: AppSpacing.xl),
              _buildReassuranceBlock(context),
              const SizedBox(height: AppSpacing.xl),
              _buildPricingSummary(context),
              const SizedBox(height: AppSpacing.xl),
              _buildFlexibilitySection(context),
              const SizedBox(height: AppSpacing.xl),
              _buildGuaranteeSection(context),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Continue to Checkout',
                isLoading: false,
                isEnabled: true,
                onPressed: () {
                  // Navigate to checkout
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanSummary(
    BuildContext context,
    config.SubscriptionConfigState configState,
    schedule.SubscriptionScheduleState scheduleState,
  ) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Plan Summary',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to subscription config
                },
                child: const Text('Edit'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Persons: ${configState.persons}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          if (configState.selectedMeals.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Meals:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            for (final meal in configState.selectedMeals) ...[
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
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Service Starts: ${_getStartDateText(scheduleState)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          if (scheduleState.timeWindow != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Time: ${scheduleState.timeWindow!.label} (${scheduleState.timeWindow!.range})',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildReassuranceBlock(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF5F1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'You\'re all set.',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.primaryGreen,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'We\'ll match you with a verified cooking professional based on your preferences.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingSummary(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Monthly Subscription',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '₹X,XXX / month',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFlexibilitySection(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Flexible Subscription',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Pause when needed'),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Easily reschedule visits'),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Managed replacement support'),
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
          _buildCheckRow(context, 'Verified professionals'),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Managed replacements'),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Quality monitoring'),
        ],
      ),
    );
  }

  Widget _buildCheckRow(BuildContext context, String text) {
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

  String _getStartDateText(schedule.SubscriptionScheduleState state) {
    switch (state.startDate) {
      case schedule.StartDateOption.today:
        return 'Today';
      case schedule.StartDateOption.tomorrow:
        return 'Tomorrow';
      case schedule.StartDateOption.custom:
        if (state.customDate != null) {
          return '${state.customDate!.month}/${state.customDate!.day}/${state.customDate!.year}';
        }
        return 'Choose Date';
    }
  }
}

extension StringExtension on String {
  String capitalize() {
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}