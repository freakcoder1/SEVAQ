import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/confirmation_state.dart';

class ConfirmationScreen extends ConsumerWidget {
  const ConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(cookingProvider.select((s) => s.confirmationState));

    if (state == null) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: Text('No confirmation data available')),
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
              const Icon(
                Icons.check_circle,
                color: AppColors.primaryGreen,
                size: 64,
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'You\'re all set.',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Your monthly cooking subscription has been confirmed.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildSubscriptionDetails(context, state),
              const SizedBox(height: AppSpacing.xl),
              _buildWhatHappensNext(context),
              const SizedBox(height: AppSpacing.xl),
              _buildSupportSection(context),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Return Home',
                isLoading: false,
                isEnabled: true,
                onPressed: () {
                  // Navigate to home
                },
              ),
              const SizedBox(height: AppSpacing.lg),
              Center(
                child: TextButton(
                  onPressed: () {
                    // Navigate to subscription details
                  },
                  child: const Text('View Subscription'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubscriptionDetails(
    BuildContext context,
    ConfirmationState state,
  ) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Your Subscription',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Starts',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            state.startDate,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Time',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            state.timeWindow,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Reference',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            state.subscriptionId,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWhatHappensNext(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What Happens Next',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        _buildNextStepRow(context, 'Professional matching begins'),
        const SizedBox(height: AppSpacing.sm),
        _buildNextStepRow(context, 'Updates will appear in your app'),
        const SizedBox(height: AppSpacing.sm),
        _buildNextStepRow(context, 'Support is available whenever you need it'),
      ],
    );
  }

  Widget _buildNextStepRow(BuildContext context, String text) {
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

  Widget _buildSupportSection(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Need help?',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () {
              // Contact support
            },
            child: const Text('Contact Support'),
          ),
        ],
      ),
    );
  }
}