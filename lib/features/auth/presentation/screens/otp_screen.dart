import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/constants/app_routes.dart';
import '../../../../shared/components/app_button.dart';
import '../../providers/auth_providers.dart';
import '../../domain/entities/otp_state.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
    final loginState = ref.read(loginProvider);
    ref.read(otpProvider.notifier).initialize(loginState.phoneNumber);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(otpProvider);
    final notifier = ref.read(otpProvider.notifier);

    ref.listen<OtpState>(otpProvider, (_, nextState) {
      if (nextState.status == OtpStatus.verified) {
        if (nextState.isNewUser == true) {
          context.go(AppRoutes.profileSetup);
        } else {
          context.go(AppRoutes.home);
        }
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
                'Verify your mobile number',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'We sent a 6-digit code to',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                '+91 ${state.phoneNumber}',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () => context.pop(),
                child: Text(
                  'Change number',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.primaryGreen,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildOtpBoxes(context, state, notifier),
              const SizedBox(height: AppSpacing.sm),
              if (state.error != null)
                Text(
                  state.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.error,
                  ),
                ),
              if (state.isExpired)
                Text(
                  'Your code has expired.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.warning,
                  ),
                ),
              const SizedBox(height: AppSpacing.xl),
              AppButton(
                text: 'Verify',
                isLoading: state.isVerifying,
                isEnabled: state.canSubmit,
                onPressed: notifier.verifyOtp,
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildResendSection(context, state, notifier),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOtpBoxes(BuildContext context, OtpState state, OtpNotifier notifier) {
    return Stack(
      children: [
        Opacity(
          opacity: 0,
          child: TextField(
            focusNode: _focusNode,
            keyboardType: TextInputType.number,
            maxLength: 6,
            onChanged: notifier.setOtp,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: const InputDecoration(counterText: ''),
          ),
        ),
        GestureDetector(
          onTap: () => _focusNode.requestFocus(),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(6, (index) {
              final digit = index < state.otp.length ? state.otp[index] : '';
              final isSelected = index == state.otp.length;
              final isFilled = index < state.otp.length;

              return Container(
                width: AppOtpDimensions.cellWidth,
                height: AppOtpDimensions.cellHeight,
                margin: const EdgeInsets.symmetric(horizontal: AppOtpDimensions.cellSpacing),
                decoration: BoxDecoration(
                  color: isFilled ? AppColors.primaryGreenLight : const Color(0xFFF5F6F6),
                  borderRadius: BorderRadius.circular(AppRadius.inputs),
                  border: Border.all(
                    color: isSelected ? AppColors.primaryGreen : AppColors.border,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    digit,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  Widget _buildResendSection(BuildContext context, OtpState state, OtpNotifier notifier) {
    if (state.resendTimer > 0) {
      return Text(
        'Resend OTP in 0:${state.resendTimer.toString().padLeft(2, '0')}',
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppColors.textSecondary,
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          "Didn't receive code? ",
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        TextButton(
          onPressed: state.canResend ? notifier.resendOtp : null,
          child: Text(
            'Resend OTP',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: state.canResend 
                  ? AppColors.primaryGreen 
                  : AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    ref.read(otpProvider.notifier).dispose();
    _focusNode.dispose();
    super.dispose();
  }
}