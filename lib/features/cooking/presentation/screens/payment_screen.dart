import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/payment_state.dart' as payment;
import '../../domain/entities/checkout_state.dart' as checkout;

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cookingProvider.select((s) => s.paymentState));
    final notifier = ref.read(cookingProvider.notifier);

    if (state == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: Text('No payment data available')),
      );
    }

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
                'Payment',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Complete your subscription payment.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildOrderSummary(context, state),
              const SizedBox(height: AppSpacing.xl),
              _buildPaymentMethod(context, state),
              const SizedBox(height: AppSpacing.xl),
              _buildSecurityBlock(context),
              const SizedBox(height: AppSpacing.xl),
              if (state.status == payment.PaymentStatus.idle)
                AppButton(
                  text: 'Pay Now',
                  isLoading: false,
                  isEnabled: true,
                  onPressed: () => notifier.initiatePayment(),
                ),
              if (state.status == payment.PaymentStatus.processing)
                Column(
                  children: [
                    const CircularProgressIndicator(
                      color: AppColors.primaryGreen,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Processing payment...',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              if (state.status == payment.PaymentStatus.failed && state.error != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.error!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.red,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      text: 'Retry Payment',
                      isLoading: false,
                      isEnabled: true,
                      onPressed: () => notifier.initiatePayment(),
                    ),
                  ],
                ),
              if (state.status == payment.PaymentStatus.success)
                Column(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: AppColors.primaryGreen,
                      size: 48,
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'Payment successful.',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Redirecting...',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrderSummary(
    BuildContext context,
    payment.PaymentState state,
  ) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order #${state.orderId}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Amount Due',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '₹X,XXX',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethod(
    BuildContext context,
    payment.PaymentState state,
  ) {
    final methodText = state.paymentMethod == checkout.PaymentMethod.upi
        ? 'UPI'
        : 'Credit / Debit Card';
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Method',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            methodText,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityBlock(BuildContext context) {
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
            'Secure Payment',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.primaryGreen,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Your payment is processed securely through our payment partner.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}