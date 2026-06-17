import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/components/app_card.dart';
import '../../providers/home_provider.dart';
import '../../domain/entities/home_state.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(homeProvider.notifier).loadHomeData());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(homeProvider);

    if (state.isLoading && state.userName.isEmpty) {
      return _buildSkeletonHome(context);
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
                'Good ${_getTimeOfDay()}, ${state.userName}',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Manage your home with confidence.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Verified professionals • Managed replacements • Quality monitoring',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildServiceCard(
                context,
                title: 'Kitchen Operations',
                subtitle: 'Daily cooking support',
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildServiceCard(
                context,
                title: 'Home Maintenance',
                subtitle: 'Cleaning & upkeep',
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildUpcomingServiceSection(context, state),
              const SizedBox(height: AppSpacing.xl),
              _buildSubscriptionSection(context, state),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSkeletonHome(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Container(
                height: 28,
                width: 200,
                color: AppColors.border,
              ),
              const SizedBox(height: AppSpacing.sm),
              Container(
                height: 20,
                width: 150,
                color: AppColors.border,
              ),
              const SizedBox(height: AppSpacing.xl),
              _buildSkeletonCard(),
              const SizedBox(height: AppSpacing.lg),
              _buildSkeletonCard(),
              const SizedBox(height: AppSpacing.xl),
              _buildSkeletonCard(height: 100),
              const SizedBox(height: AppSpacing.xl),
              _buildSkeletonCard(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSkeletonCard({double height = 160}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.border.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }

  String _getTimeOfDay() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  Widget _buildServiceCard(BuildContext context, {required String title, required String subtitle}) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const Spacer(),
          TextButton(
            onPressed: () {},
            child: Text(
              'Explore',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.primaryGreen,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingServiceSection(BuildContext context, HomeState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Your Upcoming Service',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (state.hasUpcomingService)
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${state.nextBookingType} Visit',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '${state.nextBookingDate} • ${state.nextBookingTime}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (state.assignedProfessional != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Assigned Professional',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    state.assignedProfessional!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          )
        else
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No services scheduled.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    'Explore Services',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSubscriptionSection(BuildContext context, HomeState state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Active Subscriptions',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        if (state.hasActivePlan)
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  state.subscriptionPlanName ?? 'Subscription Plan',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Next Visit: ${state.nextVisit ?? 'N/A'}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  'Renewal: ${state.renewalDate ?? 'N/A'}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          )
        else
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No active subscriptions',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    'Explore Plans',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}