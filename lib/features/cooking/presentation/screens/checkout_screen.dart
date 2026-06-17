import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/checkout_state.dart' as checkout;
import '../../domain/entities/subscription_config_state.dart' as config;
import '../../domain/entities/subscription_schedule_state.dart' as schedule;

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  @override
  Widget build(BuildContext context) {
    final checkoutState = ref.watch(cookingProvider.select((s) => s.checkoutState));
    final configState = ref.watch(cookingProvider.select((s) => s.configState));
    final scheduleState = ref.watch(cookingProvider.select((s) => s.scheduleState));
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
                'Checkout',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Complete your subscription setup.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildOrderSummary(context, configState, scheduleState),
              const SizedBox(height: AppSpacing.xl),
              _buildPricingSummary(context),
              const SizedBox(height: AppSpacing.xl),
              _buildReassuranceBlock(context),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Payment Method',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 1,
                mainAxisSpacing: AppSpacing.sm,
                childAspectRatio: 3.5,
                children: [
                  _buildPaymentMethodCard(
                    context,
                    'UPI',
                    Icons.payment,
                    true,
                    checkoutState.selectedPaymentMethod == checkout.PaymentMethod.upi,
                    () => notifier.setPaymentMethod(checkout.PaymentMethod.upi),
                  ),
                  _buildPaymentMethodCard(
                    context,
                    'Credit / Debit Card',
                    Icons.credit_card,
                    false,
                    checkoutState.selectedPaymentMethod == checkout.PaymentMethod.creditDebitCard,
                    () => notifier.setPaymentMethod(checkout.PaymentMethod.creditDebitCard),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildTrustSection(context),
              const SizedBox(height: AppSpacing.xl),
              if (checkoutState.error != null) ...[
                Text(
                  checkoutState.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
              AppButton(
                text: 'Complete Subscription',
                isLoading: checkoutState.isCreatingOrder,
                isEnabled: checkoutState.canComplete,
                onPressed: () {
                  notifier.createOrder();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrderSummary(
    BuildContext context,
    config.SubscriptionConfigState configState,
    schedule.SubscriptionScheduleState scheduleState,
  ) {
    final startDateText = _getStartDateText(scheduleState);
    final timeText = scheduleState.timeWindow?.label ?? '';

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary',
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
            'Start Date: $startDateText',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Time Window: $timeText',
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
            'Pricing Summary',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Monthly Subscription',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '₹X,XXX / month',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Setup Fee',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '₹XXX',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const Divider(),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Due Today',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '₹X,XXX',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.primaryGreen,
            ),
          ),
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
            "You're almost done.",
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.primaryGreen,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Your subscription will be activated after successful payment.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard(
    BuildContext context,
    String label,
    IconData icon,
    bool isRecommended,
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
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Row(
            children: [
              Icon(
                icon,
                color: isSelected ? AppColors.primaryGreen : AppColors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.lg),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isSelected ? AppColors.primaryGreen : AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              if (isRecommended)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadius.chips),
                  ),
                  child: Text(
                    'Recommended',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              if (isSelected) ...[
                const SizedBox(width: AppSpacing.sm),
                const Icon(
                  Icons.check_circle,
                  color: AppColors.primaryGreen,
                  size: 20,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrustSection(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Secure Payments',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildCheckRow(context, 'Secure payments'),
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