import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme.dart';

class ServiceRecommendation {
  final String serviceName;
  final String eta;
  final String zoneReliability;
  final double price;

  ServiceRecommendation({
    required this.serviceName,
    required this.eta,
    required this.zoneReliability,
    required this.price,
  });
}

class AdaptiveBookingFlow extends StatefulWidget {
  final ServiceRecommendation recommendation;
  final bool isFirstTimeUser;
  final VoidCallback onBookingComplete;

  const AdaptiveBookingFlow({
    Key? key,
    required this.recommendation,
    required this.isFirstTimeUser,
    required this.onBookingComplete,
  }) : super(key: key);

  @override
  _AdaptiveBookingFlowState createState() => _AdaptiveBookingFlowState();
}

class _AdaptiveBookingFlowState extends State<AdaptiveBookingFlow> {
  int _currentStep = 0;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authProvider = Provider.of<AuthProvider>(context);

    // NEW USER: Full 3-step ceremony
    if (widget.isFirstTimeUser) {
      return _buildFullBookingCeremony(theme, authProvider);
    }

    // RETURNING USER: Compressed flow with same language
    return _buildCompressedBookingFlow(theme, authProvider);
  }

  Widget _buildFullBookingCeremony(ThemeData theme, AuthProvider authProvider) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Complete Request',
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
        leading: _currentStep > 0
            ? BackButton(color: theme.colorScheme.onSurface)
            : null,
      ),
      body: _buildStepContent(theme),
      bottomNavigationBar: _buildBottomNavigation(theme),
    );
  }

  Widget _buildCompressedBookingFlow(
    ThemeData theme,
    AuthProvider authProvider,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Complete Request',
          style: TextStyle(color: theme.colorScheme.onSurface),
        ),
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
      ),
      body: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Single confirmation step
            Text(
              'Sevaq will handle this visit',
              style: theme.textTheme.headlineSmall,
            ),
            SizedBox(height: 24),

            // Quick summary
            _buildQuickSummary(theme),

            // Single CTA
            SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _completeBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  animationDuration: Duration(milliseconds: 350),
                ),
                child: _isLoading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          color: theme.colorScheme.onPrimary,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(
                        'Complete Request',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent(ThemeData theme) {
    switch (_currentStep) {
      case 0:
        return _buildSystemConfirmationStep(theme);
      case 1:
        return _buildResponsibilityTransferStep(theme);
      case 2:
        return _buildProtectionConfirmationStep(theme);
      default:
        return _buildSystemConfirmationStep(theme);
    }
  }

  Widget _buildSystemConfirmationStep(ThemeData theme) {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Here\'s what Sevaq will handle',
            style: theme.textTheme.headlineSmall,
          ),
          SizedBox(height: 24),

          // Service confirmation
          _buildConfirmationCard(
            theme,
            Icons.work,
            'Service',
            widget.recommendation.serviceName,
          ),

          // Professional assignment
          _buildConfirmationCard(
            theme,
            Icons.person,
            'Professional',
            'Assigned by system',
          ),

          // Time confirmation
          _buildConfirmationCard(
            theme,
            Icons.calendar_today,
            'When',
            widget.recommendation.eta,
          ),

          // System guarantee
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.shield, color: theme.colorScheme.secondary),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Sevaq takes full responsibility. If anything goes wrong, we\'ll replace or refund immediately.',
                    style: TextStyle(
                      color: theme.colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResponsibilityTransferStep(ThemeData theme) {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Responsibility Transfer',
            style: theme.textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 32),

          Container(
            padding: EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.handshake,
                  size: 64,
                  color: theme.colorScheme.primary,
                ),
                SizedBox(height: 24),
                Text(
                  'Once you proceed, Sevaq takes responsibility for this visit.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'You\'re protected. We\'re in charge.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: theme.colorScheme.onPrimaryContainer),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProtectionConfirmationStep(ThemeData theme) {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Payment as Protection', style: theme.textTheme.headlineSmall),
          SizedBox(height: 24),

          // Payment summary
          _buildPaymentSummary(theme),

          SizedBox(height: 24),

          // Protection features
          Column(
            children: [
              _buildProtectionItem(theme, Icons.lock, 'Professional locked'),
              _buildProtectionItem(theme, Icons.refresh, 'Backup ready'),
              _buildProtectionItem(
                theme,
                Icons.payment,
                'Instant refund if no-show',
              ),
            ],
          ),

          SizedBox(height: 32),

          // Final reassurance
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: theme.colorScheme.primary),
                SizedBox(width: 12),
                Text(
                  'Handled. We\'re monitoring this visit.',
                  style: TextStyle(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationCard(
    ThemeData theme,
    IconData icon,
    String title,
    String value,
  ) {
    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 12)),
              Text(value, style: theme.textTheme.bodyMedium),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickSummary(ThemeData theme) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildSummaryRow(
            theme,
            Icons.work,
            widget.recommendation.serviceName,
          ),
          _buildSummaryRow(theme, Icons.person, 'Assigned by system'),
          _buildSummaryRow(
            theme,
            Icons.calendar_today,
            widget.recommendation.eta,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(ThemeData theme, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.primary, size: 16),
        SizedBox(width: 8),
        Text(text, style: theme.textTheme.bodyMedium),
      ],
    );
  }

  Widget _buildPaymentSummary(ThemeData theme) {
    final amount = widget.recommendation.price;
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text('Total Amount', style: theme.textTheme.titleLarge),
          SizedBox(height: 8),
          Text(
            '₹${amount.toStringAsFixed(0)}',
            style: theme.textTheme.displayLarge,
          ),
          SizedBox(height: 16),
          Text(
            'This payment protects you. If the professional doesn\'t arrive, you get an instant refund.',
            textAlign: TextAlign.center,
            style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _buildProtectionItem(ThemeData theme, IconData icon, String text) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          SizedBox(width: 12),
          Text(text, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }

  Widget _buildBottomNavigation(ThemeData theme) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(
                  foregroundColor: theme.colorScheme.onSurfaceVariant,
                  side: BorderSide(color: theme.colorScheme.outline),
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  animationDuration: Duration(milliseconds: 350),
                ),
                child: Text('Back'),
              ),
            ),
          SizedBox(width: _currentStep > 0 ? 16 : 0),
          Expanded(
            child: ElevatedButton(
              onPressed: _isLoading
                  ? null
                  : () {
                      if (_currentStep < 2) {
                        setState(() => _currentStep++);
                      } else {
                        _completeBooking();
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: theme.colorScheme.onPrimary,
                padding: EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                animationDuration: Duration(milliseconds: 350),
              ),
              child: _isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: theme.colorScheme.onPrimary,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      _currentStep == 2 ? 'Complete Request' : 'Next',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _completeBooking() async {
    setState(() => _isLoading = true);

    try {
      // Simulate booking process
      await Future.delayed(Duration(seconds: 2));

      // Complete the request process
      widget.onBookingComplete();
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error completing booking: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
