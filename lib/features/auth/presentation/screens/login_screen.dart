import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/components/app_text_field.dart';
import '../../../../shared/components/app_button.dart';
import '../../providers/auth_providers.dart';
import '../../domain/entities/login_state.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(loginProvider);
    final notifier = ref.read(loginProvider.notifier);

    ref.listen<LoginState>(loginProvider, (_, nextState) {
      if (!nextState.isLoading && nextState.error == null && nextState.phoneNumber.isNotEmpty) {
        context.go(AppRoutes.otp);
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
              const SizedBox(height: 32),
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
                'Welcome to SevaQ',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Book trusted professionals for your home.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 32),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 56,
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryGreenLight,
                      borderRadius: BorderRadius.circular(AppRadius.inputs),
                    ),
                    child: Center(
                      child: Text(
                        '+91',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: AppTextField(
                      hintText: 'Mobile number',
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      onChanged: notifier.setPhoneNumber,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              AppButton(
                text: 'Continue',
                isLoading: state.isLoading,
                isEnabled: state.canSubmit,
                onPressed: notifier.login,
              ),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: Text(
                  "By continuing, you agree to SevaQ's Terms of Service and Privacy Policy.",
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}