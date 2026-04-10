import 'dart:io';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:vibration/vibration.dart';

class SoundService {
  static final SoundService _instance = SoundService._internal();
  factory SoundService() => _instance;
  SoundService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();

  // Sound asset paths - using actual file from flutter_assets
  static const String _newBookingSound =
      'alert-ascending-chime-betacut-1-00-02.mp3';
  static const String _alertSound = 'alert-ascending-chime-betacut-1-00-02.mp3';

  /// Initialize sound service
  Future<void> initialize() async {
    try {
      // Set audio mode
      await _audioPlayer.setReleaseMode(ReleaseMode.stop);
      await _audioPlayer.setVolume(1.0);

      if (kDebugMode) {
        print('Sound service initialized');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing sound service: $e');
      }
    }
  }

  /// Play new booking sound
  Future<void> playNewBookingSound() async {
    try {
      // First vibrate if available
      await _vibrate();

      // Then play sound
      await _playSound(_newBookingSound);

      if (kDebugMode) {
        print('Played new booking sound');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error playing new booking sound: $e');
      }
    }
  }

  /// Play alert sound
  Future<void> playAlertSound() async {
    try {
      await _vibrate();
      await _playSound(_alertSound);
    } catch (e) {
      if (kDebugMode) {
        print('Error playing alert sound: $e');
      }
    }
  }

  /// Play notification with custom sound
  Future<void> playNotification(String? customSound) async {
    if (customSound != null && customSound.isNotEmpty) {
      try {
        await _audioPlayer.play(AssetSource(customSound));
      } catch (e) {
        // Fall back to default sound
        await playNewBookingSound();
      }
    } else {
      await playNewBookingSound();
    }
  }

  /// Vibrate the device
  Future<void> _vibrate() async {
    try {
      final hasVibrator = await Vibration.hasVibrator() ?? false;
      if (hasVibrator) {
        // Vibrate in pattern: [wait, vibrate, wait, vibrate]
        await Vibration.vibrate(pattern: [0, 500, 200, 500, 200, 300]);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error vibrating: $e');
      }
    }
  }

  /// Play sound from asset or URL
  Future<void> _playSound(String assetPath) async {
    // Skip asset playback and use URL directly for reliability
    if (kDebugMode) {
      print('Playing notification sound from URL');
    }

    // Use a reliable public notification sound URL
    try {
      await _audioPlayer.play(UrlSource(
          'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'));
      if (kDebugMode) {
        print('Playing notification sound from URL');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error playing sound from URL: $e');
      }
      // Try fallback URL
      try {
        await _audioPlayer.play(UrlSource(
            'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));
      } catch (e2) {
        if (kDebugMode) {
          print('All sound playback failed: $e2');
        }
      }
    }
  }

  /// Stop any playing sound
  Future<void> stop() async {
    try {
      await _audioPlayer.stop();
    } catch (e) {
      if (kDebugMode) {
        print('Error stopping sound: $e');
      }
    }
  }

  /// Set volume (0.0 to 1.0)
  Future<void> setVolume(double volume) async {
    await _audioPlayer.setVolume(volume.clamp(0.0, 1.0));
  }

  /// Cleanup
  void dispose() {
    _audioPlayer.dispose();
  }
}
