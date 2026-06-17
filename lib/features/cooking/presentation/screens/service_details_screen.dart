import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/cooking_provider.dart';
import '../../domain/entities/service_details_state.dart';

class ServiceDetailsScreen extends ConsumerStatefulWidget {
  const ServiceDetailsScreen({super.key});

  @override
  ConsumerState<ServiceDetailsScreen> createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends ConsumerState<ServiceDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cookingProvider.select((s) => s.serviceState));
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
                'Kitchen Operations',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Professional cooking support tailored to your home.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Whether you need help occasionally or daily support, SevaQ provides verified cooking professionals with managed replacements and quality monitoring.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildServiceCard(
                context,
                selection: ServiceSelection.oneTime,
                title: 'One-Time Service',
                tagline: 'Perfect for occasional needs',
                points: ['Guests', 'Events', 'Busy days'],
                isSelected: state.selectedService == ServiceSelection.oneTime,
                onTap: () => notifier.selectService(ServiceSelection.oneTime),
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildServiceCard(
                context,
                selection: ServiceSelection.subscription,
                title: 'Monthly Subscription',
                tagline: 'Dedicated recurring cooking support',
                points: ['Daily meals', 'Family routines', 'Long-term support'],
                isSelected: state.selectedService == ServiceSelection.subscription,
                onTap: () => notifier.selectService(ServiceSelection.subscription),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildGuaranteeSection(context),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Continue',
                isLoading: false,
                isEnabled: state.canContinue,
                onPressed: () {
                  if (state.selectedService == ServiceSelection.oneTime) {
                    // Navigate to one-time schedule
                  } else if (state.selectedService == ServiceSelection.subscription) {
                    // Navigate to subscription config
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceCard(
    BuildContext context, {
    required ServiceSelection selection,
    required String title,
    required String tagline,
    required List<String> points,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEAF5F1) : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.cards),
          border: Border.all(
            color: isSelected ? AppColors.primaryGreen : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                if (isSelected)
                  const Icon(
                    Icons.check_circle,
                    color: AppColors.primaryGreen,
                    size: 20,
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              tagline,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Perfect for:',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            for (final point in points) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(
                '• $point',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
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