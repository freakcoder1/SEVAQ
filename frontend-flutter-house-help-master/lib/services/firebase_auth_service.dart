import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

class FirebaseAuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  // Callback for OTP code sent
  static Function(String verificationId, int? resendToken)? _onCodeSent;
  static Function(PhoneAuthCredential credential)? _onVerificationCompleted;
  static Function(FirebaseAuthException e)? _onVerificationFailed;
  static Function(String verificationId)? _onCodeAutoRetrievalTimeout;

  /// Verify phone number and send OTP
  ///
  /// [phoneNumber] - Phone number in international format (e.g., +919876543210)
  /// [onCodeSent] - Callback when OTP is sent (receives verificationId and resendToken)
  /// [onVerificationCompleted] - Callback when verification is automatically completed
  /// [onVerificationFailed] - Callback when verification fails
  /// [onCodeAutoRetrievalTimeout] - Callback when auto-retrieval times out
  ///
  /// Note: The verificationId is received via the onCodeSent callback
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
    // Note: The verificationId is received via the onCodeSent callback
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
      throw e;
    }
  }

  /// Get the current Firebase user
  static User? get currentUser => _auth.currentUser;

  /// Get the current user ID
  static String? get currentUserId => _auth.currentUser?.uid;

  /// Check if user is signed in
  static bool get isSignedIn => _auth.currentUser != null;

  /// Get the ID token for the current user
  ///
  /// [forceRefresh] - Whether to force refresh the token
  ///
  /// Returns the ID token string
  static Future<String> getIdToken({bool forceRefresh = false}) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('No user signed in');
    }
    String? token = await user.getIdToken(forceRefresh);
    if (token == null) {
      throw Exception('Failed to get ID token');
    }
    return token;
  }

  /// Sign out the current user
  static Future<void> signOut() async {
    await _auth.signOut();
    debugPrint('FirebaseAuthService: User signed out');
  }

  /// Link a phone number to an existing account
  ///
  /// This is useful if the user signed up with email and wants to add phone auth
  ///
  /// [verificationId] - The verification ID
  /// [smsCode] - The OTP code
  ///
  /// Returns PhoneAuthCredential that can be used to link to the account
  static Future<PhoneAuthCredential> linkPhoneCredential({
    required String verificationId,
    required String smsCode,
  }) async {
    PhoneAuthCredential credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return credential;
  }

  /// Check if phone number is already linked to an account
  static Future<bool> isPhoneLinked() async {
    final user = _auth.currentUser;
    if (user == null) return false;
    return user.phoneNumber != null;
  }

  /// Get the current user's phone number
  static String? get currentUserPhone => _auth.currentUser?.phoneNumber;
}
