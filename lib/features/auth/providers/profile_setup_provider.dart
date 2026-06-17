import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/entities/profile_setup_state.dart';

final profileSetupProvider = StateNotifierProvider<ProfileSetupNotifier, ProfileSetupState>((ref) {
  return ProfileSetupNotifier(ref);
});

class ProfileSetupNotifier extends StateNotifier<ProfileSetupState> {
  ProfileSetupNotifier(this.ref) : super(const ProfileSetupState());

  final Ref ref;

  void setFirstName(String value) {
    state = state.copyWith(firstName: value, error: null);
  }

  void setLastName(String value) {
    state = state.copyWith(lastName: value, error: null);
  }

  void setEmail(String value) {
    state = state.copyWith(email: value, error: null);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> completeProfile() async {
    if (!state.canSubmit) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final api = ApiClient();
      await api.patch('users/profile', {
        'firstName': state.firstName,
        'lastName': state.lastName,
        'email': state.email,
      });
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to save profile');
    }
  }
}