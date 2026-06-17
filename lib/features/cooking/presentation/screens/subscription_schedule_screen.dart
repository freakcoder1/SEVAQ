import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/subscription_schedule_state.dart';
import '../../domain/entities/subscription_config_state.dart';

class SubscriptionScheduleScreen extends ConsumerStatefulWidget {
  const SubscriptionScheduleScreen({super.key});

  @override
  ConsumerState<SubscriptionScheduleScreen> createState() => _SubscriptionScheduleScreenState();
}

class _SubscriptionScheduleScreenState extends ConsumerState<SubscriptionScheduleScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cookingProvider.select((s) => s.scheduleState));
    final configState = ref.watch(cookingProvider.select((s) => s.configState));
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
                'When would you like service to begin?',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 3,
                crossAxisSpacing: AppSpacing.sm,
                mainAxisSpacing: AppSpacing.sm,
                childAspectRatio: 1.8,
                children: [
                  _buildStartDateCard(
                    context,
                    'Today',
                    Icons.today,
                    state.startDate == StartDateOption.today,
                    () => notifier.setStartDate(StartDateOption.today),
                  ),
                  _buildStartDateCard(
                    context,
                    'Tomorrow',
                    Icons.calendar_today,
                    state.startDate == StartDateOption.tomorrow,
                    () => notifier.setStartDate(StartDateOption.tomorrow),
                  ),
                  _buildStartDateCard(
                    context,
                    'Choose Date',
                    Icons.date_range,
                    state.startDate == StartDateOption.custom,
                    () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        notifier.setCustomDate(picked);
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Preferred Cooking Time',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: AppSpacing.sm,
                mainAxisSpacing: AppSpacing.sm,
                childAspectRatio: 1.8,
                children: [
                  for (final tw in TimeWindows.all)
                    _buildTimeWindowCard(
                      context,
                      tw.label,
                      tw.range,
                      state.timeWindow?.label == tw.label,
                      () => notifier.setTimeWindow(tw),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildScheduleSummary(context, configState, state),
              const SizedBox(height: AppSpacing.xl),
              _buildGuaranteeSection(context),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Continue',
                isLoading: false,
                isEnabled: state.canContinue,
                onPressed: () {
                  // Navigate to review
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStartDateCard(
    BuildContext context,
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primaryGreen : AppColors.textSecondary,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeWindowCard(
    BuildContext context,
    String label,
    String range,
    bool isSelected,
    VoidCallback onTap,
  ) {
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
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                range,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isSelected ? AppColors.primaryGreen : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleSummary(
    BuildContext context,
    SubscriptionConfigState configState,
    SubscriptionScheduleState scheduleState,
  ) {
    final startDateText = _getStartDateText(scheduleState);
    final timeText = scheduleState.timeWindow != null
        ? '${scheduleState.timeWindow!.label} (${scheduleState.timeWindow!.range})'
        : '';

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
            'Service Starts:',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '$startDateText\n$timeText',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _getStartDateText(SubscriptionScheduleState state) {
    switch (state.startDate) {
      case StartDateOption.today:
        return 'Today';
      case StartDateOption.tomorrow:
        return 'Tomorrow';
      case StartDateOption.custom:
        if (state.customDate != null) {
          return '${state.customDate!.month}/${state.customDate!.day}/${state.customDate!.year}';
        }
        return 'Choose Date';
    }
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