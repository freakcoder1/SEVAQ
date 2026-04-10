import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../providers/earnings_provider.dart';
import '../widgets/notification_listener_widget.dart';
import 'home_screen.dart';
import 'bookings_screen.dart';
import 'earnings_screen.dart';
import 'profile_screen.dart';
import 'worker_registration_screen.dart';

class WorkerMainScreen extends StatefulWidget {
  const WorkerMainScreen({super.key});

  @override
  State<WorkerMainScreen> createState() => _WorkerMainScreenState();
}

class _WorkerMainScreenState extends State<WorkerMainScreen> {
  int _currentIndex = 0;

  void navigateToBookings() {
    setState(() => _currentIndex = 1);
  }

  List<Widget> get _screens => [
        WorkerHomeScreen(onViewAllJobs: navigateToBookings),
        const WorkerBookingsScreen(),
        const WorkerEarningsScreen(),
        const WorkerProfileScreen(),
      ];

  @override
  void initState() {
    super.initState();
    // Load initial data after auth check
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthProvider>();

    // Check if user is authenticated but has no worker profile
    if (auth.isAuthenticated && auth.worker == null) {
      debugPrint('WorkerMainScreen: User authenticated but no worker profile');
    } else {
      // Normal flow - fetch bookings and earnings
      context.read<BookingProvider>().fetchBookings();
      context.read<EarningsProvider>().fetchEarnings();

      // Start auto-polling for new bookings
      context.read<BookingProvider>().startPolling();
      debugPrint('WorkerMainScreen: Started booking polling');
    }
  }

  void _navigateToRegistration() {
    Navigator.of(context)
        .push(
      MaterialPageRoute(
        builder: (context) => const WorkerRegistrationScreen(),
      ),
    )
        .then((_) {
      // Refresh data after returning from registration
      context.read<AuthProvider>().fetchWorkerProfile();
      context.read<BookingProvider>().fetchBookings();
      context.read<EarningsProvider>().fetchEarnings();

      // Start auto-polling for new bookings
      context.read<BookingProvider>().startPolling();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Check if user is authenticated but has no worker profile
        if (auth.isAuthenticated && auth.worker == null && !auth.isLoading) {
          return _buildNoWorkerProfileScreen();
        }

        return NotificationListenerWidget(
          child: Scaffold(
            body: IndexedStack(index: _currentIndex, children: _screens),
            bottomNavigationBar: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) => setState(() => _currentIndex = index),
              type: BottomNavigationBarType.fixed,
              selectedItemColor: Theme.of(context).primaryColor,
              unselectedItemColor:
                  Theme.of(context).colorScheme.onSurfaceVariant,
              backgroundColor: Theme.of(context).colorScheme.surface,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
                BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_today),
                  label: 'Jobs',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.account_balance_wallet),
                  label: 'Earnings',
                ),
                BottomNavigationBarItem(
                    icon: Icon(Icons.person), label: 'Profile'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildNoWorkerProfileScreen() {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_add,
                size: 80,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 24),
              Text(
                'Complete Your Worker Profile',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                'You\'re logged in but need to create a worker profile to start receiving jobs.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _navigateToRegistration,
                style: ElevatedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text(
                  'Create Worker Profile',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
