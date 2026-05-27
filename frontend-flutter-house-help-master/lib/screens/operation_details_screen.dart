import 'package:flutter/material.dart';
import '../core/animation/motion_controller.dart';
import '../core/animation/haptic_service.dart';
import '../core/theme/design_tokens.dart';
import '../theme.dart';

/// Operations detail screen - mission control for household operations
class OperationDetailsScreen extends StatefulWidget {
  final String operationId;
  final String operationType;
  final int etaMinutes;

  const OperationDetailsScreen({
    Key? key,
    required this.operationId,
    required this.operationType,
    required this.etaMinutes,
  }) : super(key: key);

  @override
  State<OperationDetailsScreen> createState() => _OperationDetailsScreenState();
}

class _OperationDetailsScreenState extends State<OperationDetailsScreen>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: MotionController.progressLine,
      vsync: this,
    );
    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _progressController,
        curve: MotionController.standard,
      ),
    );

    // Start animation on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _progressController.forward();
    });
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'Operation Details',
          style: DesignTokens.label.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(DesignTokens.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timeline
            _buildTimeline(),
            const SizedBox(height: DesignTokens.spacingXl),

            // Live support state
            _buildLiveSupportState(),
            const SizedBox(height: DesignTokens.spacingXl),

            // Professional card
            _buildProfessionalCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    return Container(
      padding: const EdgeInsets.all(DesignTokens.spacingMd),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(DesignTokens.radiusMd),
        boxShadow: DesignTokens.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Operation Timeline',
            style: DesignTokens.sectionTitle.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: DesignTokens.spacingLg),
          _buildTimelineStep('Assigned', true, 0),
          _buildTimelineStep('On Route', true, 1),
          _buildTimelineStep('Arrived', false, 2),
          _buildTimelineStep('In Progress', false, 3),
          _buildTimelineStep('Completed', false, 4),
        ],
      ),
    );
  }

  Widget _buildTimelineStep(String label, bool completed, int index) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: completed
                ? AppTheme.emeraldGreen
                : Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.2),
            shape: BoxShape.circle,
          ),
          child: completed
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : null,
        ),
        const SizedBox(width: DesignTokens.spacingMd),
        Text(
          label,
          style: DesignTokens.support.copyWith(
            color: completed
                ? Theme.of(context).colorScheme.onSurface
                : Theme.of(
                    context,
                  ).colorScheme.onSurface.withValues(alpha: 0.5),
          ),
        ),
      ],
    );
  }

  Widget _buildLiveSupportState() {
    return Container(
      padding: const EdgeInsets.all(DesignTokens.spacingMd),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(DesignTokens.radiusMd),
        boxShadow: DesignTokens.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Live Support State',
            style: DesignTokens.sectionTitle.copyWith(
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: DesignTokens.spacingLg),
          _buildStateRow('ETA Confidence', '92%'),
          _buildStateRow('Backup Available', '2 professionals'),
          _buildStateRow('Escalation Path', 'Ready if needed'),
        ],
      ),
    );
  }

  Widget _buildStateRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignTokens.spacingSm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: DesignTokens.support.copyWith(
              color: Theme.of(
                context,
              ).colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          Text(
            value,
            style: DesignTokens.support.copyWith(
              color: AppTheme.emeraldGreen,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfessionalCard() {
    return Container(
      padding: const EdgeInsets.all(DesignTokens.spacingMd),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(DesignTokens.radiusMd),
        boxShadow: DesignTokens.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.person, color: AppTheme.emeraldGreen),
          ),
          const SizedBox(width: DesignTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trusted Household Operator',
                  style: DesignTokens.label.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '3+ years experience • 4.9 rating',
                  style: DesignTokens.support.copyWith(
                    color: Theme.of(
                      context,
                    ).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
