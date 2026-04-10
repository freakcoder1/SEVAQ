import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/sound_service.dart';
import 'bookings_screen.dart';

class FullScreenBookingScreen extends StatefulWidget {
  final String bookingId;
  final String serviceName;
  final String serviceDate;
  final String startTime;
  final String customerName;
  final String? customerAddress;
  final String price;

  const FullScreenBookingScreen({
    super.key,
    required this.bookingId,
    required this.serviceName,
    required this.serviceDate,
    required this.startTime,
    required this.customerName,
    this.customerAddress,
    required this.price,
  });

  @override
  State<FullScreenBookingScreen> createState() =>
      _FullScreenBookingScreenState();
}

class _FullScreenBookingScreenState extends State<FullScreenBookingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    try {
      // Set up animations
      _animationController = AnimationController(
        duration: const Duration(milliseconds: 800),
        vsync: this,
      );

      _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
        CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
      );

      _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
      );

      _animationController.forward();

      // Play alert sound and vibration (non-blocking)
      _playAlert();

      // Enter immersive full-screen mode
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } catch (e) {
      debugPrint('Error in FullScreenBookingScreen initState: $e');
    }
  }

  Future<void> _playAlert() async {
    try {
      await SoundService().playNewBookingSound();
    } catch (e) {
      debugPrint('Error playing alert sound: $e');
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Prevent back button from closing - require explicit action
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return Opacity(
                opacity: _opacityAnimation.value,
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: child,
                ),
              );
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Pulsing bell icon
                _buildPulsingIcon(),
                const SizedBox(height: 32),

                // Title in Hindi
                const Text(
                  'नया काम आया है!',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),

                // English subtitle
                Text(
                  'New Booking Assigned',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[400],
                  ),
                ),
                const SizedBox(height: 40),

                // Booking details card
                _buildBookingCard(),
                const SizedBox(height: 40),

                // CTA Button - View Details
                _buildViewButton(),
                const SizedBox(height: 16),

                // Dismiss button (smaller, less prominent)
                _buildDismissButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPulsingIcon() {
    return TweenAnimationBuilder<double>(
      duration: const Duration(seconds: 1),
      tween: Tween(begin: 1.0, end: 1.2),
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.4),
                  blurRadius: 30,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: const Icon(
              Icons.notifications_active,
              size: 64,
              color: Colors.green,
            ),
          ),
        );
      },
    );
  }

  Widget _buildBookingCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          _buildDetailRow(Icons.cleaning_services, widget.serviceName),
          const SizedBox(height: 12),
          _buildDetailRow(
            Icons.calendar_today,
            '${widget.serviceDate} at ${widget.startTime}',
          ),
          const SizedBox(height: 12),
          _buildDetailRow(Icons.person, widget.customerName),
          if (widget.customerAddress != null) ...[
            const SizedBox(height: 12),
            _buildDetailRow(Icons.location_on, widget.customerAddress!),
          ],
          const Divider(color: Colors.white24, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Earning: ',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.white70,
                ),
              ),
              Text(
                '₹${widget.price}',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.white70),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildViewButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton.icon(
          onPressed: _onViewPressed,
          icon: const Icon(Icons.visibility, size: 24),
          label: const Text(
            'VIEW',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 8,
          ),
        ),
      ),
    );
  }

  Widget _buildDismissButton() {
    return TextButton(
      onPressed: _onDismiss,
      child: Text(
        'Dismiss',
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[500],
        ),
      ),
    );
  }

  void _onViewPressed() {
    // Stop sound
    SoundService().stop();

    // Exit full-screen mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    // Navigate to bookings screen to see the new booking
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const WorkerBookingsScreen(),
      ),
    );
  }

  void _onDismiss() {
    // Stop sound
    SoundService().stop();

    // Exit full-screen mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    // Go back to previous screen
    Navigator.of(context).pop();
  }
}
