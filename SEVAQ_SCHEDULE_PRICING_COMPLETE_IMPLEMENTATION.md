# Schedule & Pricing Screen - Complete Implementation

## File: `frontend-flutter-house-help-master/lib/screens/schedule_pricing_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';
import 'assigning_professional_screen.dart';
import 'professional_assigned_screen.dart';

/// Schedule & Pricing Screen
/// Final flow specification implementation
/// Purpose: Collect unavoidable inputs (date, time, price acknowledgement) and prepare for real assignment
class SchedulePricingScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;

  const SchedulePricingScreen({
    Key? key,
    required this.worker,
    this.service,
  }) : super(key: key);

  @override
  State<SchedulePricingScreen> createState() => _SchedulePricingScreenState();
}

class _SchedulePricingScreenState extends State<SchedulePricingScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  
  // State variables
  DateTime? _selectedDate;
  TimeWindow? _selectedTimeWindow;
  double? _calculatedPrice;
  bool _isProcessing = false;
  
  // Constants
  static const int MAX_DATE_PILLS = 7;
  static const double BASE_SERVICE_PRICE = 500.0; // Base price for maid service

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // Auto-select earliest viable date
    _selectedDate = _getEarliestViableDate();
  }

  DateTime _getEarliestViableDate() {
    final now = DateTime.now();
    // Start from tomorrow to ensure we have time for assignment
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

  void _calculatePrice() {
    if (_selectedDate != null && _selectedTimeWindow != null) {
      final service = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
      final basePrice = service?.basePrice ?? BASE_SERVICE_PRICE;
      final durationHours = _selectedTimeWindow!.endTime - _selectedTimeWindow!.startTime;
      
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
    if (!_canProceed()) return;

    setState(() => _isProcessing = true);

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Prepare assignment data
      final service = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
      final startTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month, 
        _selectedDate!.day,
        _selectedTimeWindow!.startTime,
      );
      final endTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day, 
        _selectedTimeWindow!.endTime,
      );

      final assignmentData = {
        'user': user.id,
        'worker': widget.worker.id,
        'service': service?.id,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime.toIso8601String(),
        'amount': (_calculatedPrice! * 100).toInt(), // Convert to paise
        'currency': 'INR',
        'status': 'pending_assignment',
      };

      // Create assignment request (not booking yet)
      final response = await _apiService.post('bookings/assign', assignmentData);
      
      if (response != null) {
        // Navigate to assigning professional screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AssigningProfessionalScreen(
              worker: widget.worker,
              service: service,
              startTime: startTime,
              endTime: endTime,
              amount: _calculatedPrice!,
            ),
          ),
        );
      } else {
        throw Exception('Failed to create assignment');
      }
    } catch (e) {
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
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
              if (_selectedTimeWindow != null)
                _buildPriceDisplay(theme),

              // 5️⃣ WHAT'S INCLUDED
              _buildWhatsIncluded(theme),

              const SizedBox(height: 24),

              // 6️⃣ PRIMARY CTA
              _buildPrimaryCTA(theme),

              // 7️⃣ CTA SUBTEXT
              _buildCTASubtext(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Schedule your service',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Choose a convenient time. We’ll assign and monitor the service.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
          ),
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
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: dates.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final date = dates[index];
              final isSelected = _selectedDate?.day == date.day && 
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
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF2E7D32) : Colors.white,
                    border: Border.all(
                      color: isSelected ? Colors.transparent : Colors.black12,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        DateFormat('EEE').format(date),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('dd').format(date),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.black87,
                        ),
                      ),
                      if (isSelected && index == 0)
                        const SizedBox(height: 4),
                      if (isSelected && index == 0)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Recommended',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.white,
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

  Widget _buildTimeWindowSelection(ThemeData theme, List<TimeWindow> timeWindows) {
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF2E7D32) : Colors.white,
                  border: Border.all(
                    color: isSelected ? Colors.transparent : Colors.black12,
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
                              color: isSelected ? Colors.white : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${window.startTime.toString().padLeft(2, '0')}:00 - ${window.endTime.toString().padLeft(2, '0')}:00',
                            style: TextStyle(
                              fontSize: 14,
                              color: isSelected ? Colors.white70 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      const Icon(Icons.check_circle, color: Colors.white, size: 20),
                    if (window.isRecommended && !isSelected)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
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
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.attach_money, color: Colors.black87),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '₹${_calculatedPrice!.toStringAsFixed(0)}',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Includes assignment, monitoring, and support',
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What's included',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 16),
              const SizedBox(width: 8),
              Text(
                'Verified professional',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 16),
              const SizedBox(width: 8),
              Text(
                'Assigned & monitored by Sevaq',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 16),
              const SizedBox(width: 8),
              Text(
                'Replacement if required',
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 16),
              const SizedBox(width: 8),
              Text(
                'Support throughout',
                style: theme.textTheme.bodyMedium,
              ),
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
            color: Colors.black.withOpacity(0.05),
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
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Confirm & assign professional'),
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
        'Payment requested once a professional is assigned.',
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
```

## File: `frontend-flutter-house-help-master/lib/screens/assigning_professional_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/worker.dart';
import '../models/service.dart';

/// Assigning Professional Screen
/// Shows full-screen loader while system assigns professional
class AssigningProfessionalScreen extends StatelessWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const AssigningProfessionalScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Loading animation
              const SizedBox(
                width: 60,
                height: 60,
                child: CircularProgressIndicator(
                  strokeWidth: 4,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2E7D32)),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Primary message
              Text(
                'We’re assigning the right professional for your service',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Secondary reassurance
              Text(
                'This usually takes a few moments',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.black54,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 40),
              
              // Micro-reinforcement
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Managed end-to-end by Sevaq',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

## File: `frontend-flutter-house-help-master/lib/screens/professional_assigned_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';
import 'booking_confirmation_screen.dart';

/// Professional Assigned Screen
/// Shows professional details and payment prompt
class ProfessionalAssignedScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ProfessionalAssignedScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  State<ProfessionalAssignedScreen> createState() => _ProfessionalAssignedScreenState();
}

class _ProfessionalAssignedScreenState extends State<ProfessionalAssignedScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _authProvider = Provider.of<AuthProvider>(context, listen: false);
  }

  Future<void> _handlePayment() async {
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Prepare booking data with payment
      final service = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
      
      final bookingData = {
        'user': user.id,
        'worker': widget.worker.id,
        'service': service?.id,
        'startTime': widget.startTime.toIso8601String(),
        'endTime': widget.endTime.toIso8601String(),
        'amount': (widget.amount * 100).toInt(), // Convert to paise
        'currency': 'INR',
        'status': 'confirmed',
        'isPaid': true,
      };

      // Create confirmed booking
      final response = await _apiService.post('bookings', bookingData);
      
      if (response != null) {
        final booking = Booking.fromJson(response);
        
        // Navigate to confirmation screen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingConfirmationScreen(booking: booking),
          ),
        );
      } else {
        throw Exception('Failed to create booking');
      }
    } catch (e) {
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
    final service = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);

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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Success icon and message
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Professional assigned!',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your service is confirmed and ready to go.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),

              // Professional details
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Professional',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: const Color(0xFFE8F5E9),
                          child: Text(
                            widget.worker.user.firstName[0],
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2E7D32),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${widget.worker.user.firstName} ${widget.worker.user.lastName}',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.worker.bio,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Service details
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service Details',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today, color: Colors.black54, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                DateFormat('EEEE, MMMM d, yyyy').format(widget.startTime),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              Text(
                                '${DateFormat('jm').format(widget.startTime)} - ${DateFormat('jm').format(widget.endTime)}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.work, color: Colors.black54, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            service?.name ?? 'Service',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.attach_money, color: Colors.black54, size: 20),
                        const SizedBox(width: 12),
                        Text(
                          '₹${widget.amount.toStringAsFixed(0)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment prompt
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Please confirm payment to proceed',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your professional is ready and waiting for your confirmation.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment CTA
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
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
                        onPressed: _isProcessing ? null : _handlePayment,
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
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Pay & confirm service'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

## Backend API Changes Required

### 1. New Assignment Endpoint
```typescript
// POST /bookings/assign
// Creates assignment without payment
{
  "user": "user_id",
  "worker": "worker_id", 
  "service": "service_id",
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "amount": 50000, // in paise
  "currency": "INR",
  "status": "pending_assignment"
}
```

### 2. Modified Payment Verification
```typescript
// POST /payments/verify (existing endpoint)
// Now handles payment after assignment
{
  "razorpayOrderId": "order_id",
  "razorpayPaymentId": "payment_id", 
  "signature": "signature",
  "bookingData": {
    // Complete booking data with assignment details
  }
}
```

### 3. Assignment Status Tracking
- Add `pending_assignment` status to booking workflow
- Track assignment progress
- Handle assignment failures gracefully

## Integration Points

### Navigation Flow
1. ServiceClarificationScreen → SchedulePricingScreen
2. SchedulePricingScreen → AssigningProfessionalScreen  
3. AssigningProfessionalScreen → ProfessionalAssignedScreen
4. ProfessionalAssignedScreen → BookingConfirmationScreen

### State Management
- Use existing BookingProvider for assignment state
- Add assignment-specific loading states
- Handle assignment success/failure scenarios

### Error Handling
- Assignment timeout handling
- Worker unavailability scenarios
- Payment failure after assignment
- Network error recovery

This implementation follows the exact specification provided and creates a streamlined, trustworthy booking experience that builds confidence through constrained choices and clear communication.