import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import '../services/api_service.dart';
import '../utils/service_mapper.dart';
import 'service_request_in_progress_screen.dart';

/// Schedule & Pricing Screen
/// Final flow specification implementation
/// Purpose: Collect unavoidable inputs (date, time, price acknowledgement) and prepare for real assignment
class SchedulePricingScreen extends StatefulWidget {
  final Worker? worker;
  final Service? service;
  final String?
  source; // 'ONE_TIME' for one-time visits, null/empty for subscription

  const SchedulePricingScreen({
    Key? key,
    this.worker,
    this.service,
    this.source,
  }) : super(key: key);

  @override
  State<SchedulePricingScreen> createState() => _SchedulePricingScreenState();
}

class _SchedulePricingScreenState extends State<SchedulePricingScreen> {
  late ApiService _apiService;
  AuthProvider? _authProvider;
  LocationProvider? _locationProvider;

  // State variables
  DateTime? _selectedDate;
  TimeWindow? _selectedTimeWindow;
  double? _calculatedPrice;
  bool _isProcessing = false;

  // Constants
  static const int MAX_DATE_PILLS = 7;
  static const double BASE_SERVICE_PRICE =
      49.0; // Base price for maid service (matches new ₹49/hour rate)

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _selectedDate = _getEarliestViableDate();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Try to get providers, but handle if they're not available
    debugPrint('SchedulePricingScreen: didChangeDependencies called');
    try {
      _authProvider = Provider.of<AuthProvider>(context, listen: false);
      debugPrint(
        'SchedulePricingScreen: AuthProvider obtained: ${_authProvider != null}',
      );
      debugPrint(
        'SchedulePricingScreen: AuthProvider user: ${_authProvider?.user?.email ?? "null"}',
      );
    } catch (e) {
      debugPrint('SchedulePricingScreen: AuthProvider not available: $e');
      _authProvider = null;
    }
    try {
      _locationProvider = Provider.of<LocationProvider>(context, listen: false);
      debugPrint(
        'SchedulePricingScreen: LocationProvider obtained: ${_locationProvider != null}',
      );
    } catch (e) {
      debugPrint('SchedulePricingScreen: LocationProvider not available: $e');
      _locationProvider = null;
    }
  }

  DateTime _getEarliestViableDate() {
    final now = DateTime.now();
    // Start from today for on-demand service
    return DateTime(now.year, now.month, now.day);
  }

  List<DateTime> _getAvailableDates() {
    final dates = <DateTime>[];
    final startDate = _getEarliestViableDate();

    for (int i = 0; i < MAX_DATE_PILLS; i++) {
      dates.add(startDate.add(Duration(days: i)));
    }
    return dates;
  }

  List<TimeWindow> _getTimeWindows() {
    return [
      TimeWindow(
        id: 'morning',
        label: 'Morning',
        startTime: 8,
        endTime: 11,
        helperText: 'Best availability',
        isRecommended: true,
      ),
      TimeWindow(
        id: 'afternoon',
        label: 'Afternoon',
        startTime: 12,
        endTime: 15,
        helperText: 'Good availability',
        isRecommended: false,
      ),
      TimeWindow(
        id: 'evening',
        label: 'Evening',
        startTime: 16,
        endTime: 19,
        helperText: 'Limited availability',
        isRecommended: false,
      ),
    ];
  }

  void _calculatePrice() {
    if (_selectedDate != null && _selectedTimeWindow != null) {
      final service =
          widget.service ??
          (widget.worker?.services.isNotEmpty == true
              ? widget.worker!.services[0]
              : null);
      final basePrice = service?.basePrice ?? BASE_SERVICE_PRICE;
      final durationHours =
          _selectedTimeWindow!.endTime - _selectedTimeWindow!.startTime;

      setState(() {
        _calculatedPrice = basePrice * durationHours;
      });
    }
  }

  bool _canProceed() {
    return _selectedDate != null &&
        _selectedTimeWindow != null &&
        _calculatedPrice != null &&
        !_isProcessing;
  }

  Future<void> _handleConfirmAssignment() async {
    print('🔍 DEBUG: _handleConfirmAssignment called');
    print('🔍 DEBUG: _canProceed() = ${_canProceed()}');

    if (!_canProceed()) return;

    setState(() => _isProcessing = true);

    try {
      if (_authProvider == null) {
        throw Exception('Authentication not available. Please log in again.');
      }
      final user = _authProvider!.user;
      print('🔍 DEBUG: AuthProvider user: ${user?.email ?? "null"}');
      print(
        '🔍 DEBUG: AuthProvider isAuthenticated: ${_authProvider!.isAuthenticated}',
      );
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Validate location before proceeding
      if (_locationProvider == null ||
          _locationProvider!.currentLocationData == null) {
        throw Exception('Location not set. Please set your location first.');
      }

      // Check service availability for the selected location
      final location = _locationProvider!.currentLocationData!;
      final availabilityResponse = await _apiService.checkServiceAvailability(
        location.latitude ?? 0.0,
        location.longitude ?? 0.0,
        5.0, // 5km radius
      );

      if (availabilityResponse != null &&
          availabilityResponse['status'] == 'business_error') {
        // Service not available in this area
        throw Exception(
          'Service not available in your area. Please try a different location.',
        );
      }

      print(
        '🔍 DEBUG: User authenticated and location validated, proceeding with intent capture',
      );

      // Create Service Request (Intent Capture)
      final service =
          widget.service ??
          (widget.worker?.services.isNotEmpty == true
              ? widget.worker!.services[0]
              : null);

      final serviceRequestData = {
        'serviceId':
            (service?.id != null && service!.id > 0 ? service!.id : null) ??
            ServiceMapper.getRepresentativeBackendId('maid'),
        'date': DateFormat('yyyy-MM-dd').format(_selectedDate!),
        'timeWindow': _selectedTimeWindow!.id,
        'location': {
          'lat': location.latitude,
          'lng': location.longitude,
          'address': location.address,
        },
        'priceSnapshot': _calculatedPrice,
        // Explicit source field for one-time visits
        if (widget.source != null && widget.source!.isNotEmpty)
          'source': widget.source,
      };

      print(
        '🔍 DEBUG: Creating service request with data: $serviceRequestData',
      );

      final serviceRequestResponse = await _apiService.post(
        'service-requests',
        serviceRequestData,
      );

      if (serviceRequestResponse != null &&
          serviceRequestResponse['requestId'] != null) {
        print(
          '🔍 DEBUG: Service request created successfully: ${serviceRequestResponse['requestId']}',
        );

        // Intent captured successfully - navigate to Service Request In Progress
        // Get AuthProvider before navigation
        final authProvider = Provider.of<AuthProvider>(context, listen: false);

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MultiProvider(
              providers: [
                ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
              ],
              child: ServiceRequestInProgressScreen(
                serviceRequestId: serviceRequestResponse['requestId'],
                service: service,
                startTime: DateTime(
                  _selectedDate!.year,
                  _selectedDate!.month,
                  _selectedDate!.day,
                  _selectedTimeWindow!.startTime,
                ),
                endTime: DateTime(
                  _selectedDate!.year,
                  _selectedDate!.month,
                  _selectedDate!.day,
                  _selectedTimeWindow!.endTime,
                ),
                amount: _calculatedPrice!,
              ),
            ),
          ),
        );
      } else {
        throw Exception(
          'Failed to create service request: Invalid response from server',
        );
      }
    } catch (e) {
      print('🔍 DEBUG: Error in _handleConfirmAssignment: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeWindows = _getTimeWindows();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Main scrollable content area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1️⃣ HEADER
                    _buildHeader(theme),

                    const SizedBox(height: 28),

                    // 2️⃣ DATE SELECTION
                    _buildDateSelection(theme),

                    const SizedBox(height: 24),

                    // 3️⃣ TIME WINDOW SELECTION
                    _buildTimeWindowSelection(theme, timeWindows),

                    // 4️⃣ PRICE DISPLAY (Conditional)
                    if (_selectedTimeWindow != null) ...[
                      _buildPriceDisplay(theme),
                      const SizedBox(height: 24),
                      Divider(height: 1),
                    ],

                    // 5️⃣ WHAT'S INCLUDED
                    _buildWhatsIncluded(theme),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // 6️⃣ PRIMARY CTA (Fixed footer)
            _buildPrimaryCTA(theme),

            // 7️⃣ CTA SUBTEXT
            _buildCTASubtext(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Schedule a one-time visit',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose a preferred time window. This is a single visit, not a recurring service.',
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildDateSelection(ThemeData theme) {
    final dates = _getAvailableDates();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Date',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: dates.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final date = dates[index];
              final isSelected =
                  _selectedDate?.day == date.day &&
                  _selectedDate?.month == date.month &&
                  _selectedDate?.year == date.year;

              return InkWell(
                onTap: () {
                  setState(() {
                    _selectedDate = date;
                    _selectedTimeWindow = null; // Reset time window
                    _calculatedPrice = null; // Reset price
                  });
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFE8F5E9) : Colors.white,
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF2E7D32)
                          : Colors.grey[300]!,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        DateFormat('EEE').format(date),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? const Color(0xFF2E7D32)
                              : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        DateFormat('dd').format(date),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? const Color(0xFF2E7D32)
                              : Colors.black87,
                        ),
                      ),
                      if (isSelected && index == 0) const SizedBox(height: 1),
                      if (isSelected && index == 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFF2E7D32,
                            ).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Recommended',
                            style: TextStyle(
                              fontSize: 9,
                              color: Color(0xFF2E7D32),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTimeWindowSelection(
    ThemeData theme,
    List<TimeWindow> timeWindows,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Time window',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        Column(
          children: timeWindows.map((window) {
            final isSelected = _selectedTimeWindow?.id == window.id;

            return InkWell(
              onTap: () {
                setState(() {
                  _selectedTimeWindow = window;
                  _calculatePrice();
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xF0F8F9FA) : Colors.white,
                  border: Border.all(
                    color: isSelected
                        ? const Color(0xFF2E7D32)
                        : Colors.black12,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            window.label,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? const Color(0xFF2E7D32)
                                  : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${window.startTime.toString().padLeft(2, '0')}:00 - ${window.endTime.toString().padLeft(2, '0')}:00',
                            style: TextStyle(
                              fontSize: 14,
                              color: isSelected
                                  ? const Color(0xFF2E7D32)
                                  : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      const Icon(
                        Icons.check_circle,
                        color: Colors.black54,
                        size: 20,
                      ),
                    if (window.isRecommended && !isSelected)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Best availability',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF2E7D32),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        Text(
          'We assign professionals within this window and monitor arrival.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: Colors.black54,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildPriceDisplay(ThemeData theme) {
    if (_calculatedPrice == null) return Container();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(
          'Service cost',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 2,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '₹${_calculatedPrice!.toStringAsFixed(0)} — one-time visit',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Includes professional assignment, monitoring, and support',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWhatsIncluded(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What\'s included',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF2E7D32),
                size: 14,
              ),
              const SizedBox(width: 6),
              Text('Verified professional', style: theme.textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF2E7D32),
                size: 14,
              ),
              const SizedBox(width: 6),
              Text('Assigned & monitored', style: theme.textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF2E7D32),
                size: 14,
              ),
              const SizedBox(width: 6),
              Text('Replacement if required', style: theme.textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: Color(0xFF2E7D32),
                size: 14,
              ),
              const SizedBox(width: 6),
              Text('Support throughout', style: theme.textTheme.bodySmall),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPrimaryCTA(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _canProceed() ? _handleConfirmAssignment : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D32),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
                textStyle: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Confirm & request professional'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCTASubtext(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Text(
        'Payment requested only after a professional is assigned.',
        style: TextStyle(
          fontSize: 14,
          color: Colors.black54,
          fontWeight: FontWeight.w500,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

/// Time Window Model
class TimeWindow {
  final String id;
  final String label;
  final int startTime;
  final int endTime;
  final String helperText;
  final bool isRecommended;

  TimeWindow({
    required this.id,
    required this.label,
    required this.startTime,
    required this.endTime,
    required this.helperText,
    required this.isRecommended,
  });
}
