import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/home_state.dart';
import '../../auth/providers/auth_providers.dart';

final homeProvider = StateNotifierProvider<HomeNotifier, HomeState>((ref) {
  return HomeNotifier(ref);
});

class HomeNotifier extends StateNotifier<HomeState> {
  HomeNotifier(this.ref) : super(const HomeState());

  final Ref ref;

  Future<void> loadHomeData() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final api = ref.read(apiClientProvider);

      // Load user data
      final user = await api.get('users/me');
      final userName = user['name'] ?? user['firstName'] ?? '';

      // Load upcoming booking
      final booking = await api.get('bookings?status=upcoming&limit=1');
      final nextBooking = booking.isNotEmpty == true ? booking[0] : null;

      // Load subscription data
      final subscription = await api.get('subscriptions/me');

      state = state.copyWith(
        isLoading: false,
        userName: userName,
        nextBookingType: nextBooking?['serviceType'],
        nextBookingDate: nextBooking?['date'],
        nextBookingTime: nextBooking?['time'],
        assignedProfessional: nextBooking?['professional'],
        hasActivePlan: subscription != null,
        subscriptionPlanName: subscription?['planName'],
        nextVisit: subscription?['nextVisit'],
        renewalDate: subscription?['renewalDate'],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load home data');
    }
  }
}