import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/components/app_text_field.dart';
import '../../../../shared/components/app_button.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/profile_setup_provider.dart';
import '../../domain/entities/profile_setup_state.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(profileSetupProvider);
    final notifier = ref.read(profileSetupProvider.notifier);

    ref.listen<ProfileSetupState>(profileSetupProvider, (_, nextState) {
      if (!nextState.isLoading && nextState.error == null && nextState.firstName.isNotEmpty) {
        context.go(AppRoutes.home);
      }
    });

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
                'SEVAQ',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                "Let's get started",
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Create your account to book trusted professionals.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              AppTextField(
                controller: _firstNameController,
                hintText: 'First Name',
                onChanged: notifier.setFirstName,
              ),
              const SizedBox(height: AppSpacing.lg),
              AppTextField(
                controller: _lastNameController,
                hintText: 'Last Name',
                onChanged: notifier.setLastName,
              ),
              const SizedBox(height: AppSpacing.lg),
              AppTextField(
                controller: _emailController,
                hintText: 'Email Address',
                keyboardType: TextInputType.emailAddress,
                onChanged: notifier.setEmail,
              ),
              const SizedBox(height: AppSpacing.sm),
              if (state.error != null)
                Text(
                  state.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.error,
                  ),
                ),
              const SizedBox(height: AppSpacing.xl),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Why create an account?',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _buildBenefitRow(context, 'Book trusted professionals'),
                    const SizedBox(height: AppSpacing.sm),
                    _buildBenefitRow(context, 'Manage subscriptions easily'),
                    const SizedBox(height: AppSpacing.sm),
                    _buildBenefitRow(context, 'View service history'),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Continue Setup',
                isLoading: state.isLoading,
                isEnabled: state.canSubmit,
                onPressed: notifier.completeProfile,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBenefitRow(BuildContext context, String text) {
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