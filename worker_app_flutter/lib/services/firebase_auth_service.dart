import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Firebase Authentication Service for Worker App
/// Handles phone number verification and OTP login flow
class FirebaseAuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  // Callbacks for OTP flow
  static Function(String verificationId, int? resendToken)? _onCodeSent;
  static Function(PhoneAuthCredential credential)? _onVerificationCompleted;
  static Function(FirebaseAuthException e)? _onVerificationFailed;
  static Function(String verificationId)? _onCodeAutoRetrievalTimeout;

  /// Initialize Firebase
  static Future<void> initialize() async {
    // Firebase is automatically initialized when using FirebaseAuth.instance
    // For explicit initialization, use await Firebase.initializeApp()
    debugPrint('FirebaseAuthService: Firebase Auth initialized');
  }

  /// Verify phone number and send OTP
  ///
  /// [phoneNumber] - Phone number in international format (e.g., +919876543210)
  /// [onCodeSent] - Callback when OTP is sent (receives verificationId and resendToken)
  /// [onVerificationCompleted] - Callback when verification is automatically completed
  /// [onVerificationFailed] - Callback when verification fails
  /// [onCodeAutoRetrievalTimeout] - Callback when auto-retrieval times out
  static Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required Function(String verificationId, int? resendToken) onCodeSent,
    Function(PhoneAuthCredential credential)? onVerificationCompleted,
    required Function(FirebaseAuthException e) onVerificationFailed,
    Function(String verificationId)? onCodeAutoRetrievalTimeout,
  }) async {
    _onCodeSent = onCodeSent;
    _onVerificationCompleted = onVerificationCompleted;
    _onVerificationFailed = onVerificationFailed;
    _onCodeAutoRetrievalTimeout = onCodeAutoRetrievalTimeout;

    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (credential) async {
        debugPrint('FirebaseAuthService: Verification completed automatically');
        _onVerificationCompleted?.call(credential);
        // Automatically sign in
        try {
          await _auth.signInWithCredential(credential);
          debugPrint('FirebaseAuthService: Auto sign-in successful');
        } catch (e) {
          debugPrint('FirebaseAuthService: Auto sign-in failed: $e');
        }
      },
      verificationFailed: (exception) {
        debugPrint(
          'FirebaseAuthService: Verification failed: ${exception.message}',
        );
        _onVerificationFailed?.call(exception);
      },
      codeSent: (verificationId, resendToken) {
        debugPrint(
          'FirebaseAuthService: OTP code sent, verificationId: $verificationId',
        );
        _onCodeSent?.call(verificationId, resendToken);
      },
      codeAutoRetrievalTimeout: (verificationId) {
        debugPrint('FirebaseAuthService: Auto-retrieval timeout');
        _onCodeAutoRetrievalTimeout?.call(verificationId);
      },
    );
  }

  /// Sign in with the OTP code
  ///
  /// [verificationId] - The verification ID received in the onCodeSent callback
  /// [smsCode] - The OTP code entered by the user
  ///
  /// Returns UserCredential on success
  static Future<UserCredential> signInWithOTP({
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode,
      );

      UserCredential userCredential = await _auth.signInWithCredential(
        credential,
      );
      debugPrint(
        'FirebaseAuthService: Sign in successful, UID: ${userCredential.user?.uid}',
      );

      return userCredential;
    } catch (e) {
      debugPrint('FirebaseAuthService: Sign in with OTP failed: $e');
      rethrow;
    }
  }

  /// Get the Firebase ID token for the current user
  static Future<String?> getIdToken() async {
    final user = _auth.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  /// Get the current Firebase user
  static User? get currentUser => _auth.currentUser;

  /// Sign out
  static Future<void> signOut() async {
    await _auth.signOut();
    debugPrint('FirebaseAuthService: User signed out');
  }
}
