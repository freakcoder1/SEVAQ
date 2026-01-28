import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/service_profile.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'service_request_in_progress_screen.dart';

/// Subscription Scheduling Screen
/// Purpose: Collect required inputs for subscription creation (frequency, time window, start date)
class SubscriptionSchedulingScreen extends StatefulWidget {
  final ServiceProfile serviceProfile;

  const SubscriptionSchedulingScreen({Key? key, required this.serviceProfile})
    : super(key: key);

  @override
  State<SubscriptionSchedulingScreen> createState() =>
      _SubscriptionSchedulingScreenState();
}

class _SubscriptionSchedulingScreenState
    extends State<SubscriptionSchedulingScreen> {
  late ApiService _apiService;

  // State variables
  DateTime? _selectedStartDate;
  TimeWindow? _selectedTimeWindow;
  Frequency _selectedFrequency = Frequency.weekly;
  bool _isProcessing = false;

  // Constants
  static const int MAX_DATE_PILLS = 7;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    // Auto-select earliest viable date
    _selectedStartDate = _getEarliestViableDate();
  }

  DateTime _getEarliestViableDate() {
    final now = DateTime.now();
    // Start from tomorrow to ensure we have time for setup
    return now.add(const Duration(days: 1));
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

  void _handleConfirmSubscription() async {
    if (_selectedStartDate == null || _selectedTimeWindow == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a start date and time window'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Create subscription
      final response = await _apiService.createSubscription(
        serviceProfileId: widget.serviceProfile.id,
        frequency: _selectedFrequency.toString().toUpperCase(),
        timeWindowStart: _formatTime(_selectedTimeWindow!.startTime),
        timeWindowEnd: _formatTime(_selectedTimeWindow!.endTime),
        startDate: _selectedStartDate!,
        endDate: _selectedStartDate!.add(
          const Duration(days: 30),
        ), // 1 month duration
      );

      if (response != null && response['publicId'] != null) {
        // Navigate to service request in progress screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ServiceRequestInProgressScreen(
              serviceRequestId: response['publicId'],
              service: null,
              startTime: _selectedStartDate!.add(
                Duration(hours: _selectedTimeWindow!.startTime),
              ),
              endTime: _selectedStartDate!.add(
                Duration(hours: _selectedTimeWindow!.endTime),
              ),
              amount: widget.serviceProfile.monthlyPrice.toDouble(),
            ),
          ),
        );
      } else {
        throw Exception(
          'Failed to create subscription: Invalid response from server',
        );
      }
    } catch (e) {
      print('🔍 DEBUG: Error in _handleConfirmSubscription: ${e.toString()}');
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

  String _formatTime(int hour) {
    return '${hour.toString().padLeft(2, '0')}:00';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dates = _getAvailableDates();
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
        title: Text('Schedule ${widget.serviceProfile.profileName}'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Main scrollable content area
            Flexible(
              fit: FlexFit.loose,
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

                    // 2️⃣ FREQUENCY SELECTION
                    _buildFrequencySelection(theme),

                    const SizedBox(height: 24),

                    // 3️⃣ START DATE SELECTION
                    _buildStartDateSelection(theme, dates),

                    const SizedBox(height: 24),

                    // 4️⃣ TIME WINDOW SELECTION
                    _buildTimeWindowSelection(theme, timeWindows),

                    const SizedBox(height: 24),

                    // 5️⃣ PRICE DISPLAY
                    _buildPriceDisplay(theme),

                    const SizedBox(height: 24),
                    Divider(height: 1),

                    // 6️⃣ WHAT'S INCLUDED
                    _buildWhatsIncluded(theme),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // 7️⃣ PRIMARY CTA (Fixed footer)
            _buildPrimaryCTA(theme),
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
          'Schedule your subscription',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose a start date and time for your recurring service',
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildFrequencySelection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service Frequency',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: _buildFrequencyOption(
                  theme,
                  frequency: Frequency.weekly,
                  label: 'Weekly',
                  description: 'Service once a week',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildFrequencyOption(
                  theme,
                  frequency: Frequency.biweekly,
                  label: 'Bi-weekly',
                  description: 'Service twice a week',
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildFrequencyOption(
                  theme,
                  frequency: Frequency.monthly,
                  label: 'Monthly',
                  description: 'Service once a month',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFrequencyOption(
    ThemeData theme, {
    required Frequency frequency,
    required String label,
    required String description,
  }) {
    final isSelected = _selectedFrequency == frequency;

    return GestureDetector(
      onTap: () => setState(() => _selectedFrequency = frequency),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? theme.primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? theme.primaryColor : Colors.grey[300]!,
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              description,
              style: theme.textTheme.bodySmall?.copyWith(
                color: isSelected
                    ? Colors.white.withOpacity(0.8)
                    : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStartDateSelection(ThemeData theme, List<DateTime> dates) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Start Date',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 60,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: dates.length,
            itemBuilder: (context, index) {
              final date = dates[index];
              final isSelected =
                  _selectedStartDate != null &&
                  _isSameDay(date, _selectedStartDate!);
              final isToday = _isSameDay(date, DateTime.now());
              final isTomorrow = _isSameDay(
                date,
                DateTime.now().add(const Duration(days: 1)),
              );

              return GestureDetector(
                onTap: () => setState(() => _selectedStartDate = date),
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 70,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? theme.primaryColor
                        : (index == 0
                              ? theme.primaryColor.withOpacity(0.1)
                              : Colors.grey[100]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? theme.primaryColor
                          : Colors.grey[200]!,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        isToday
                            ? 'Today'
                            : isTomorrow
                            ? 'Tomorrow'
                            : DateFormat('EEE').format(date),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : (index == 0
                                    ? theme.primaryColor
                                    : Colors.black87),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('d').format(date),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? Colors.white
                              : (index == 0
                                    ? theme.primaryColor
                                    : Colors.black87),
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
          'Time Window',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 1,
              childAspectRatio: 3,
              mainAxisSpacing: 8,
            ),
            itemCount: timeWindows.length,
            itemBuilder: (context, index) {
              final timeWindow = timeWindows[index];
              final isSelected =
                  _selectedTimeWindow != null &&
                  _selectedTimeWindow!.id == timeWindow.id;

              return GestureDetector(
                onTap: () => setState(() => _selectedTimeWindow = timeWindow),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? theme.primaryColor : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? theme.primaryColor
                          : Colors.grey[300]!,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            timeWindow.label,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${timeWindow.startTime}:00 - ${timeWindow.endTime}:00',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isSelected
                                  ? Colors.white.withOpacity(0.8)
                                  : Colors.black54,
                            ),
                          ),
                          if (timeWindow.isRecommended)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Recommended',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isSelected
                                      ? Colors.white.withOpacity(0.8)
                                      : theme.primaryColor,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                      if (isSelected)
                        const Icon(
                          Icons.check_circle,
                          color: Colors.white,
                          size: 24,
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

  Widget _buildPriceDisplay(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Subscription Price',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${widget.serviceProfile.profileName}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.black54,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${widget.serviceProfile.monthlyPrice} / month',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.primaryColor,
                    ),
                  ),
                ],
              ),
              Text(
                'Includes GST',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.black54,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWhatsIncluded(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s Included',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.serviceProfile.scopeDefinition,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Max Capacity: ${widget.serviceProfile.maxCapacityHint}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.black54,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPrimaryCTA(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isProcessing ? null : _handleConfirmSubscription,
          style: ElevatedButton.styleFrom(
            backgroundColor: theme.primaryColor,
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
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                    const SizedBox(width: 12),
                    const Text('Processing...'),
                  ],
                )
              : const Text('Confirm Subscription'),
        ),
      ),
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }
}

class TimeWindow {
  final String id;
  final String label;
  final int startTime;
  final int endTime;
  final String helperText;
  final bool isRecommended;

  const TimeWindow({
    required this.id,
    required this.label,
    required this.startTime,
    required this.endTime,
    required this.helperText,
    required this.isRecommended,
  });
}

enum Frequency { weekly, biweekly, monthly }
