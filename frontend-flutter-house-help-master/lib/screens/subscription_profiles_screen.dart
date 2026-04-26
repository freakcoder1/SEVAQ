import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_house_help/theme.dart';
import 'package:flutter_house_help/models/location.dart';
import 'package:flutter_house_help/models/service_profile.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/providers/location_provider.dart';
import 'package:flutter_house_help/screens/subscription_scheduling_screen.dart';
import 'package:flutter_house_help/screens/subscription_pricing_screen.dart';
import 'package:flutter_house_help/services/api_service.dart';

class SubscriptionProfilesScreen extends StatefulWidget {
  final String serviceType;
  final String serviceName;
  final dynamic userId; // Accept both int and String (UUID)
  final Location? initialLocation; // Pass location from parent

  const SubscriptionProfilesScreen({
    super.key,
    required this.serviceType,
    required this.serviceName,
    required this.userId,
    this.initialLocation,
  });

  @override
  _SubscriptionProfilesScreenState createState() =>
      _SubscriptionProfilesScreenState();
}

class _SubscriptionProfilesScreenState
    extends State<SubscriptionProfilesScreen> {
  List<ServiceProfile> _profiles = [];
  ServiceProfile? _selectedProfile;
  bool _isLoading = true;
  String _errorMessage = '';
  bool _useCustomPlan = false;

  @override
  void initState() {
    super.initState();
    _loadProfiles();
  }

  void _loadProfiles() {
    print(
      '🔍 DEBUG: SubscriptionProfilesScreen - Loading profiles for serviceType: ${widget.serviceType}',
    );

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    // Fetch real profiles from backend API
    ApiService()
        .getServiceProfiles(widget.serviceType)
        .then((response) {
          try {
            print('🔍 DEBUG: Raw response: $response');
            print('🔍 DEBUG: Response type: ${response.runtimeType}');

            // Handle both List response and Map with 'data' key
            List items = [];

            if (response is List) {
              items = response;
              print('🔍 DEBUG: Response is a List with ${items.length} items');
            } else if (response is Map) {
              print('🔍 DEBUG: Response is a Map with keys: ${response.keys}');
              if (response.containsKey('data') && response['data'] is List) {
                items = response['data'] as List;
                print(
                  '🔍 DEBUG: Extracted data list with ${items.length} items',
                );
              }
            }

            if (items.isEmpty) {
              throw Exception('No service profiles found');
            }

            // More robust parsing with individual try-catch per item
            List<ServiceProfile> profiles = [];
            for (var i = 0; i < items.length; i++) {
              try {
                print('🔍 DEBUG: Parsing item $i: ${items[i]}');
                final profile = ServiceProfile.fromJson(
                  items[i] as Map<String, dynamic>,
                );
                print(
                  '🔍 DEBUG: Parsed profile: ${profile.publicId}, isActive: ${profile.isActive}',
                );
                if (profile.isActive) {
                  profiles.add(profile);
                }
              } catch (e, stack) {
                print('🔍 DEBUG: Error parsing profile at index $i: $e');
                print('🔍 DEBUG: Stack: $stack');
              }
            }

            setState(() {
              _profiles = profiles;
              if (profiles.isNotEmpty) {
                // Default to first profile or standard plan if available
                _selectedProfile = profiles.firstWhere(
                  (p) => p.publicId.toLowerCase().contains('standard'),
                  orElse: () => profiles.first,
                );
              }
              _isLoading = false;
            });
          } catch (e) {
            setState(() {
              _errorMessage = 'Failed to load service profiles';
              _isLoading = false;
            });
            print('🔍 DEBUG: Error loading profiles: $e');
          }
        })
        .catchError((e) {
          setState(() {
            _errorMessage = 'Failed to load service profiles';
            _isLoading = false;
          });
          print('🔍 DEBUG: Error loading profiles: $e');
        });
  }

  void _handleProfileSelect(ServiceProfile profile) {
    setState(() {
      _selectedProfile = profile;
    });
    print(
      'Selected profile: ${profile.serviceType} (${profile.publicId}) - ₹${profile.monthlyPrice}/month',
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.serviceName} — Monthly Plans'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      backgroundColor: Colors.white,
      body: _isLoading
          ? _buildLoadingIndicator()
          : _errorMessage.isNotEmpty
          ? _buildErrorWidget()
          : _buildProfilesContent(theme),
    );
  }

  Widget _buildLoadingIndicator() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Theme.of(context).primaryColor),
          SizedBox(height: 16),
          Text('Loading service profiles...'),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(_errorMessage),
          SizedBox(height: 16),
          ElevatedButton(onPressed: _loadProfiles, child: Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildProfilesContent(ThemeData theme) {
    // Show profile selection grid first (FIXED: was directly embedding pricing screen)
    if (_profiles.isEmpty) {
      return _buildErrorWidget();
    }
    return _buildProfilesList(theme);
  }

  Widget _buildCustomPlanButton(ThemeData theme) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SubscriptionPricingScreen(
                serviceType: widget.serviceType,
                serviceName: widget.serviceName,
                userId: widget.userId,
                initialLocation: widget.initialLocation,
              ),
            ),
          );
        },
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppTheme.deepTeal, width: 1.5),
          foregroundColor: AppTheme.deepTeal,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        child: const Text('⚙️ Customize your own plan'),
      ),
    );
  }

  Widget _buildContinueButton(ThemeData theme) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _selectedProfile != null ? _handleContinue : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: _selectedProfile != null
              ? AppTheme.deepTeal
              : Colors.grey[300],
          foregroundColor: _selectedProfile != null
              ? Colors.white
              : Colors.black54,
          padding: EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
          textStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        child: Text(
          _selectedProfile != null
              ? 'Continue with ${_selectedProfile!.serviceType.toUpperCase()} (${_selectedProfile!.publicId})'
              : 'Select a plan to continue',
        ),
      ),
    );
  }

  void _handleContinue() {
    if (_selectedProfile != null) {
      print(
        '🔍 DEBUG: Continuing with selected profile: ${_selectedProfile!.publicId}',
      );
      // Use location passed from parent (ServiceEngagementTypeScreen)
      final currentLocation = widget.initialLocation;

      // Navigate to subscription scheduling screen with userId and location
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SubscriptionSchedulingScreen(
            serviceProfile: _selectedProfile!,
            userId: widget.userId,
            initialLocation: currentLocation,
          ),
        ),
      );
    }
  }

  Widget _buildProfilesList(ThemeData theme) {
    return Column(
      children: _profiles.asMap().entries.map((entry) {
        final index = entry.key;
        final profile = entry.value;
        final isPrimary = index == 1; // Recommend middle plan
        return _buildProfileCard(theme, profile, isPrimary);
      }).toList(),
    );
  }

  Widget _buildProfileCard(
    ThemeData theme,
    ServiceProfile profile,
    bool isPrimary,
  ) {
    final isSelected = _selectedProfile?.id == profile.id;

    return InkWell(
      onTap: () => _handleProfileSelect(profile),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected
              ? Color(0xFFE9EFEF) // Deep Teal @ 6%
              : Color(0xFFF6F7F5), // Light gray background
          border: Border.all(
            color: isSelected ? AppTheme.deepTeal : Color(0xFFD6D9D6),
            width: isSelected ? 2 : 1.5,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        padding: EdgeInsets.all(20),
        margin: EdgeInsets.only(bottom: 16),
        child: Stack(
          children: [
            // Check icon for selected state - top-left
            if (isSelected)
              Positioned(
                top: 0,
                left: 0,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: Color(0xFFE9EFEF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.check, color: AppTheme.deepTeal, size: 14),
                ),
              ),
            // Chevron affordance for unselected cards - right-center
            if (!isSelected)
              Positioned(
                top: 0,
                bottom: 0,
                right: 0,
                child: Center(
                  child: Icon(
                    Icons.chevron_right,
                    color: Color(0xFFB8BCB9),
                    size: 16,
                  ),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row: Plan name and price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        profile.publicId.toUpperCase(),
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? AppTheme.deepTeal
                              : Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      flex: 1,
                      child: Text(
                        '₹${_formatPrice(profile.monthlyPrice)} / month',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoalBlack,
                        ),
                        textAlign: TextAlign.right,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                // Badge (only for primary plan and unselected) - below title
                if (isPrimary && !isSelected)
                  Container(
                    margin: EdgeInsets.only(top: 8),
                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Color(0xFFE9EFEF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Most chosen',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.deepTeal,
                        fontSize: 12,
                      ),
                    ),
                  ),
                SizedBox(height: 12),
                // Description - allow wrap to 2 lines with proper line height
                Text(
                  _getServiceProfileDescription(profile),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Color(0xFF4B4F4D),
                    fontSize: 14,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    // Final price format: ₹ 5,500 / month (with spaces)
    return price.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  String _getServiceProfileDescription(ServiceProfile profile) {
    // Final service profile language (outcome-based communication)
    switch (profile.publicId) {
      case 'COOK_BASIC':
        return 'Up to 1 meal per day for small households';
      case 'COOK_STANDARD':
        return 'Up to 2 meals per day with full kitchen handling';
      case 'COOK_EXTENDED':
        return 'Up to 3 meals per day with ongoing kitchen support';
      case 'CLEAN_BASIC':
        return 'One scheduled visit per week';
      case 'CLEAN_STANDARD':
        return 'One scheduled visit per day';
      case 'CLEAN_PREMIUM':
        return 'One scheduled visit per day with premium products';
      case 'PROFILE_BASIC':
        return 'One scheduled visit per week';
      case 'PROFILE_STANDARD':
        return 'One scheduled visit per day';
      case 'PROFILE_PREMIUM':
        return 'One scheduled visit per day with premium service';
      default:
        return profile.scopeDefinition;
    }
  }

  Widget _buildTrustFooter(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.fogWhite,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.stoneGray, width: 1),
      ),
      padding: EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield, size: 24, color: AppTheme.deepTeal),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Covered by SEVAQ Service Guarantee',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  "We'll assign a verified professional 24-48 hours before your service starts.",
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
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
