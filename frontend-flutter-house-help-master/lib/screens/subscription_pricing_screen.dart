import 'package:flutter/material.dart';
import 'package:flutter_house_help/theme.dart';
import 'package:flutter_house_help/models/location.dart';
import 'package:flutter_house_help/services/pricing_service.dart';
import 'package:flutter_house_help/screens/subscription_scheduling_screen.dart';
import '../models/service_profile.dart';

/// Subscription Pricing Screen with configurable options
class SubscriptionPricingScreen extends StatefulWidget {
  final String serviceType;
  final String serviceName;
  final dynamic userId;
  final Location? initialLocation;
  final ServiceProfile? selectedProfile;

  const SubscriptionPricingScreen({
    super.key,
    required this.serviceType,
    required this.serviceName,
    required this.userId,
    this.initialLocation,
    this.selectedProfile,
  });

  @override
  State<SubscriptionPricingScreen> createState() =>
      _SubscriptionPricingScreenState();
}

class _SubscriptionPricingScreenState extends State<SubscriptionPricingScreen> {
  final PricingService _pricingService = PricingService();

  // Cleaning options
  int? _selectedBhk;

  // Cooking options
  int? _selectedPersons;
  String? _selectedMealPlan;

  int? _calculatedPrice;
  bool _isCalculating = false;

  static const List<int> bhkOptions = [1, 2, 3];
  static const List<int> personOptions = [1, 2, 3, 4, 5, 6];
  static const List<Map<String, String>> mealPlanOptions = [
    {'id': 'BF', 'name': 'Breakfast Only', 'icon': '🌅'},
    {'id': 'LUNCH', 'name': 'Lunch Only', 'icon': '☀️'},
    {'id': 'DINNER', 'name': 'Dinner Only', 'icon': '🌙'},
    {'id': 'BF_LUNCH', 'name': 'Breakfast + Lunch', 'icon': '🌅☀️'},
    {'id': 'LUNCH_DINNER', 'name': 'Lunch + Dinner', 'icon': '☀️🌙'},
    {'id': 'FULL_DAY', 'name': 'Full Day (All Meals)', 'icon': '🌅☀️🌙'},
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customize your plan',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Select your requirements below. The price will update automatically.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.black54,
              ),
            ),
            const SizedBox(height: 32),

            // Service specific selection options
            if (widget.serviceType.toLowerCase() == 'cleaning' ||
                widget.serviceType.toUpperCase() == 'CLEANING')
              _buildBhkSelection(theme),

            if (widget.serviceType.toLowerCase() == 'cooking' ||
                widget.serviceType.toUpperCase() == 'COOK') ...[
              _buildPersonSelection(theme),
              const SizedBox(height: 24),
              _buildMealPlanSelection(theme),
            ],

            const SizedBox(height: 32),

            // Price Display
            if (_calculatedPrice != null) _buildPriceDisplay(theme),

            const SizedBox(height: 32),

            // Continue Button
            _buildContinueButton(theme),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildBhkSelection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Apartment Size',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: bhkOptions.map((bhk) {
            final isSelected = _selectedBhk == bhk;
            return Expanded(
              child: InkWell(
                onTap: () {
                  setState(() {
                    _selectedBhk = bhk;
                    _calculatePrice();
                  });
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.deepTeal.withValues(alpha: 0.1)
                        : Colors.white,
                    border: Border.all(
                      color: isSelected ? AppTheme.deepTeal : Colors.grey[300]!,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '$bhk',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? AppTheme.deepTeal
                              : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'BHK',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isSelected
                              ? AppTheme.deepTeal
                              : Colors.black54,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPersonSelection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Number of Persons',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: personOptions.map((persons) {
            final isSelected = _selectedPersons == persons;
            return InkWell(
              onTap: () {
                setState(() {
                  _selectedPersons = persons;
                  _calculatePrice();
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.deepTeal.withValues(alpha: 0.1)
                      : Colors.white,
                  border: Border.all(
                    color: isSelected ? AppTheme.deepTeal : Colors.grey[300]!,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$persons ${persons == 1 ? 'Person' : 'Persons'}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: isSelected
                        ? FontWeight.w600
                        : FontWeight.normal,
                    color: isSelected ? AppTheme.deepTeal : Colors.black87,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildMealPlanSelection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Meal Plan',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Column(
          children: mealPlanOptions.map((mealPlan) {
            final isSelected = _selectedMealPlan == mealPlan['id'];
            int? planPrice;
            if (_selectedPersons != null) {
              try {
                planPrice = _pricingService.calculateCookingPrice(
                  _selectedPersons!,
                  mealPlan['id']!,
                );
              } catch (e) {
                planPrice = null;
              }
            }

            return InkWell(
              onTap: () {
                setState(() {
                  _selectedMealPlan = mealPlan['id'];
                  _calculatePrice();
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.deepTeal.withValues(alpha: 0.1)
                      : Colors.white,
                  border: Border.all(
                    color: isSelected ? AppTheme.deepTeal : Colors.grey[300]!,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Text(
                      mealPlan['icon']!,
                      style: const TextStyle(fontSize: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        mealPlan['name']!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: isSelected
                              ? AppTheme.deepTeal
                              : Colors.black87,
                        ),
                      ),
                    ),
                    if (planPrice != null)
                      Text(
                        '₹${_formatPrice(planPrice)}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? AppTheme.deepTeal
                              : Colors.black87,
                        ),
                      ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPriceDisplay(ThemeData theme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.deepTeal.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.deepTeal.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Monthly Subscription Price',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
          ),
          const SizedBox(height: 8),
          Text(
            '₹${_formatPrice(_calculatedPrice!)}',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppTheme.deepTeal,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Price includes all service charges, taxes and insurance',
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
          ),
        ],
      ),
    );
  }

  Widget _buildContinueButton(ThemeData theme) {
    final canProceed = _calculatedPrice != null && !_isCalculating;

    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: canProceed ? _handleContinue : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: canProceed ? AppTheme.deepTeal : Colors.grey[300],
          foregroundColor: canProceed ? Colors.white : Colors.black54,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        child: _isCalculating
            ? const CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2,
              )
            : const Text('Continue with this plan'),
      ),
    );
  }

  void _calculatePrice() {
    try {
      if (widget.serviceType.toLowerCase() == 'cleaning' ||
          widget.serviceType.toUpperCase() == 'CLEANING') {
        if (_selectedBhk != null) {
          setState(() {
            _calculatedPrice = _pricingService.calculateCleaningPrice(
              _selectedBhk!,
            );
          });
        }
      } else if (widget.serviceType.toLowerCase() == 'cooking' ||
          widget.serviceType.toUpperCase() == 'COOK') {
        if (_selectedPersons != null && _selectedMealPlan != null) {
          setState(() {
            _calculatedPrice = _pricingService.calculateCookingPrice(
              _selectedPersons!,
              _selectedMealPlan!,
            );
          });
        }
      }
    } catch (e) {
      setState(() {
        _calculatedPrice = null;
      });
    }
  }

  void _handleContinue() {
    if (_calculatedPrice == null) return;

    // Build custom config for custom plans (to pass selected options)
    Map<String, dynamic>? customConfig;
    if (widget.selectedProfile == null) {
      customConfig = {};
      final serviceTypeUpper = widget.serviceType.toUpperCase();
      if (serviceTypeUpper == 'COOKING' || serviceTypeUpper == 'COOK') {
        customConfig['persons'] = _selectedPersons;
        customConfig['mealPlan'] = _selectedMealPlan;
      } else if (serviceTypeUpper == 'CLEANING') {
        customConfig['bhk'] = _selectedBhk;
      }
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SubscriptionSchedulingScreen(
          serviceProfile:
              widget.selectedProfile ??
              ServiceProfile(
                id: 0,
                publicId: 'custom',
                serviceType: widget.serviceType.toUpperCase(),
                description: 'Customized subscription plan',
                scopeDefinition: 'Custom plan',
                maxCapacityHint: '',
                internalRules: {},
                monthlyPrice: _calculatedPrice!.toDouble(),
                isActive: true,
                visitPattern: 'DAILY',
                maxVisitsPerDay: 1,
              ),
          userId: widget.userId,
          initialLocation: widget.initialLocation,
          customConfig: customConfig,
        ),
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}
