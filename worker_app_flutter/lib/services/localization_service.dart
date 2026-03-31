import 'package:flutter/material.dart';

/// Hindi localization for the worker app
class Hi {
  // App name
  static const String appName = 'सेवक';
  static const String appTagline = 'अपनी सेवा बेचें, घर बैठे कमाएं';

  // Navigation
  static const String home = 'होम';
  static const String bookings = 'बुकिंग';
  static const String earnings = 'कमाई';
  static const String profile = 'प्रोफाइल';

  // Home screen
  static const String welcomeBack = 'वापसी पर स्वागत है';
  static const String todayBookings = 'आज की बुकिंग';
  static const String noBookingsToday = 'आज कोई बुकिंग नहीं';
  static const String upcomingBookings = 'आगामी बुकिंग';
  static const String totalEarnings = 'कुल कमाई';
  static const String thisMonth = 'इस महीने';

  // Booking statuses
  static const String pending = 'लंबित';
  static const String confirmed = 'पुष्टि';
  static const String inProgress = 'जारी';
  static const String completed = 'पूर्ण';
  static const String cancelled = 'रद्द';

  // Actions
  static const String accept = 'स्वीकार करें';
  static const String decline = 'अस्वीकार करें';
  static const String start = 'शुरू करें';
  static const String complete = 'पूर्ण करें';
  static const String cancel = 'रद्द करें';

  // Profile
  static const String editProfile = 'प्रोफाइल संपादित करें';
  static const String services = 'सेवाएं';
  static const String availability = 'उपलब्धता';
  static const String settings = 'सेटिंग्स';
  static const String logout = 'लॉग आउट';
  static const String language = 'भाषा';

  // Login/Register
  static const String login = 'लॉगिन';
  static const String register = 'रजिस्टर';
  static const String phoneNumber = 'फोन नंबर';
  static const String enterPhone = 'अपना फोन नंबर दर्ज करें';
  static const String continueText = 'जारी रखें';
  static const String verifyOtp = 'OTP सत्यापित करें';
  static const String enterOtp = 'OTP दर्ज करें';
  static const String name = 'नाम';
  static const String fullName = 'पूरा नाम';
  static const String selectServices = 'सेवाएं चुनें';
  static const String selectArea = 'क्षेत्र चुनें';

  // Errors
  static const String error = 'त्रुटि';
  static const String somethingWentWrong = 'कुछ गलत हो गया';
  static const String tryAgain = 'पुनः प्रयास करें';
  static const String noInternet = 'इंटरनेट नहीं है';
  static const String networkError = 'नेटवर्क त्रुटि';

  // Success
  static const String success = 'सफल';
  static const String bookingAccepted = 'बुकिंग स्वीकार की गई';
  static const String bookingDeclined = 'बुकिंग अस्वीकार की गई';
  static const String bookingCompleted = 'बुकिंग पूर्ण';

  // Notifications
  static const String newBooking = 'नई बुकिंग';
  static const String newBookingAlert = 'आपके लिए नई बुकिंग!';
  static const String tapToView = 'देखने के लिए टैप करें';

  // Customer info
  static const String customer = 'ग्राहक';
  static const String address = 'पता';
  static const String time = 'समय';
  static const String amount = 'राशि';
  static const String service = 'सेवा';

  // Common
  static const String yes = 'हां';
  static const String no = 'नहीं';
  static const String ok = 'ठीक है';
  static const String cancelBtn = 'रद्द करें';
  static const String save = 'सहेजें';
  static const String done = 'हो गया';
  static const String loading = 'लोड हो रहा है...';
  static const String refresh = 'रीफ्रेश';
}

/// English (fallback) localization
class En {
  static const String appName = 'SevaQ';
  static const String appTagline = 'Earn from your services';

  static const String home = 'Home';
  static const String bookings = 'Bookings';
  static const String earnings = 'Earnings';
  static const String profile = 'Profile';

  static const String welcomeBack = 'Welcome back';
  static const String todayBookings = "Today's Bookings";
  static const String noBookingsToday = 'No bookings today';
  static const String upcomingBookings = 'Upcoming Bookings';
  static const String totalEarnings = 'Total Earnings';
  static const String thisMonth = 'This Month';

  static const String pending = 'Pending';
  static const String confirmed = 'Confirmed';
  static const String inProgress = 'In Progress';
  static const String completed = 'Completed';
  static const String cancelled = 'Cancelled';

  static const String accept = 'Accept';
  static const String decline = 'Decline';
  static const String start = 'Start';
  static const String complete = 'Complete';
  static const String cancel = 'Cancel';

  static const String editProfile = 'Edit Profile';
  static const String services = 'Services';
  static const String availability = 'Availability';
  static const String settings = 'Settings';
  static const String logout = 'Logout';
  static const String language = 'Language';

  static const String login = 'Login';
  static const String register = 'Register';
  static const String phoneNumber = 'Phone Number';
  static const String enterPhone = 'Enter your phone number';
  static const String continueText = 'Continue';
  static const String verifyOtp = 'Verify OTP';
  static const String enterOtp = 'Enter OTP';
  static const String name = 'Name';
  static const String fullName = 'Full Name';
  static const String selectServices = 'Select Services';
  static const String selectArea = 'Select Area';

  static const String error = 'Error';
  static const String somethingWentWrong = 'Something went wrong';
  static const String tryAgain = 'Try Again';
  static const String noInternet = 'No internet';
  static const String networkError = 'Network error';

  static const String success = 'Success';
  static const String bookingAccepted = 'Booking accepted';
  static const String bookingDeclined = 'Booking declined';
  static const String bookingCompleted = 'Booking completed';

  static const String newBooking = 'New Booking';
  static const String newBookingAlert = 'You have a new booking!';
  static const String tapToView = 'Tap to view';

  static const String customer = 'Customer';
  static const String address = 'Address';
  static const String time = 'Time';
  static const String amount = 'Amount';
  static const String service = 'Service';

  static const String yes = 'Yes';
  static const String no = 'No';
  static const String ok = 'OK';
  static const String cancelBtn = 'Cancel';
  static const String save = 'Save';
  static const String done = 'Done';
  static const String loading = 'Loading...';
  static const String refresh = 'Refresh';
}

/// Localization manager
class LocalizationService {
  static final LocalizationService _instance = LocalizationService._internal();
  factory LocalizationService() => _instance;
  LocalizationService._internal();

  Locale _currentLocale = const Locale('hi', 'IN'); // Default to Hindi

  Locale get currentLocale => _currentLocale;

  /// Set locale
  void setLocale(Locale locale) {
    _currentLocale = locale;
  }

  /// Get localized string
  String getString(String key) {
    if (_currentLocale.languageCode == 'hi') {
      // Return Hindi string
      switch (key) {
        case 'appName':
          return Hi.appName;
        case 'appTagline':
          return Hi.appTagline;
        case 'home':
          return Hi.home;
        case 'bookings':
          return Hi.bookings;
        case 'earnings':
          return Hi.earnings;
        case 'profile':
          return Hi.profile;
        case 'welcomeBack':
          return Hi.welcomeBack;
        case 'todayBookings':
          return Hi.todayBookings;
        case 'noBookingsToday':
          return Hi.noBookingsToday;
        case 'upcomingBookings':
          return Hi.upcomingBookings;
        case 'totalEarnings':
          return Hi.totalEarnings;
        case 'thisMonth':
          return Hi.thisMonth;
        case 'pending':
          return Hi.pending;
        case 'confirmed':
          return Hi.confirmed;
        case 'inProgress':
          return Hi.inProgress;
        case 'completed':
          return Hi.completed;
        case 'cancelled':
          return Hi.cancelled;
        case 'accept':
          return Hi.accept;
        case 'decline':
          return Hi.decline;
        case 'start':
          return Hi.start;
        case 'complete':
          return Hi.complete;
        case 'cancel':
          return Hi.cancel;
        case 'editProfile':
          return Hi.editProfile;
        case 'services':
          return Hi.services;
        case 'availability':
          return Hi.availability;
        case 'settings':
          return Hi.settings;
        case 'logout':
          return Hi.logout;
        case 'language':
          return Hi.language;
        case 'login':
          return Hi.login;
        case 'register':
          return Hi.register;
        case 'phoneNumber':
          return Hi.phoneNumber;
        case 'enterPhone':
          return Hi.enterPhone;
        case 'continueText':
          return Hi.continueText;
        case 'verifyOtp':
          return Hi.verifyOtp;
        case 'enterOtp':
          return Hi.enterOtp;
        case 'name':
          return Hi.name;
        case 'fullName':
          return Hi.fullName;
        case 'selectServices':
          return Hi.selectServices;
        case 'selectArea':
          return Hi.selectArea;
        case 'error':
          return Hi.error;
        case 'somethingWentWrong':
          return Hi.somethingWentWrong;
        case 'tryAgain':
          return Hi.tryAgain;
        case 'noInternet':
          return Hi.noInternet;
        case 'networkError':
          return Hi.networkError;
        case 'success':
          return Hi.success;
        case 'bookingAccepted':
          return Hi.bookingAccepted;
        case 'bookingDeclined':
          return Hi.bookingDeclined;
        case 'bookingCompleted':
          return Hi.bookingCompleted;
        case 'newBooking':
          return Hi.newBooking;
        case 'newBookingAlert':
          return Hi.newBookingAlert;
        case 'tapToView':
          return Hi.tapToView;
        case 'customer':
          return Hi.customer;
        case 'address':
          return Hi.address;
        case 'time':
          return Hi.time;
        case 'amount':
          return Hi.amount;
        case 'service':
          return Hi.service;
        case 'yes':
          return Hi.yes;
        case 'no':
          return Hi.no;
        case 'ok':
          return Hi.ok;
        case 'cancelBtn':
          return Hi.cancelBtn;
        case 'save':
          return Hi.save;
        case 'done':
          return Hi.done;
        case 'loading':
          return Hi.loading;
        case 'refresh':
          return Hi.refresh;
        default:
          return key;
      }
    }
    // Fallback to English
    switch (key) {
      case 'appName':
        return En.appName;
      case 'appTagline':
        return En.appTagline;
      case 'home':
        return En.home;
      case 'bookings':
        return En.bookings;
      case 'earnings':
        return En.earnings;
      case 'profile':
        return En.profile;
      case 'welcomeBack':
        return En.welcomeBack;
      case 'todayBookings':
        return En.todayBookings;
      case 'noBookingsToday':
        return En.noBookingsToday;
      case 'upcomingBookings':
        return En.upcomingBookings;
      case 'totalEarnings':
        return En.totalEarnings;
      case 'thisMonth':
        return En.thisMonth;
      case 'pending':
        return En.pending;
      case 'confirmed':
        return En.confirmed;
      case 'inProgress':
        return En.inProgress;
      case 'completed':
        return En.completed;
      case 'cancelled':
        return En.cancelled;
      case 'accept':
        return En.accept;
      case 'decline':
        return En.decline;
      case 'start':
        return En.start;
      case 'complete':
        return En.complete;
      case 'cancel':
        return En.cancel;
      case 'editProfile':
        return En.editProfile;
      case 'services':
        return En.services;
      case 'availability':
        return En.availability;
      case 'settings':
        return En.settings;
      case 'logout':
        return En.logout;
      case 'language':
        return En.language;
      case 'login':
        return En.login;
      case 'register':
        return En.register;
      case 'phoneNumber':
        return En.phoneNumber;
      case 'enterPhone':
        return En.enterPhone;
      case 'continueText':
        return En.continueText;
      case 'verifyOtp':
        return En.verifyOtp;
      case 'enterOtp':
        return En.enterOtp;
      case 'name':
        return En.name;
      case 'fullName':
        return En.fullName;
      case 'selectServices':
        return En.selectServices;
      case 'selectArea':
        return En.selectArea;
      case 'error':
        return En.error;
      case 'somethingWentWrong':
        return En.somethingWentWrong;
      case 'tryAgain':
        return En.tryAgain;
      case 'noInternet':
        return En.noInternet;
      case 'networkError':
        return En.networkError;
      case 'success':
        return En.success;
      case 'bookingAccepted':
        return En.bookingAccepted;
      case 'bookingDeclined':
        return En.bookingDeclined;
      case 'bookingCompleted':
        return En.bookingCompleted;
      case 'newBooking':
        return En.newBooking;
      case 'newBookingAlert':
        return En.newBookingAlert;
      case 'tapToView':
        return En.tapToView;
      case 'customer':
        return En.customer;
      case 'address':
        return En.address;
      case 'time':
        return En.time;
      case 'amount':
        return En.amount;
      case 'service':
        return En.service;
      case 'yes':
        return En.yes;
      case 'no':
        return En.no;
      case 'ok':
        return En.ok;
      case 'cancelBtn':
        return En.cancelBtn;
      case 'save':
        return En.save;
      case 'done':
        return En.done;
      case 'loading':
        return En.loading;
      case 'refresh':
        return En.refresh;
      default:
        return key;
    }
  }
}
