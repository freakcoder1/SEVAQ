class AppConstants {
  static const String appName = 'Sevaq';
  static const String appVersion = '1.0.0';
  
  static const String defaultCountryCode = 'IN';
  
  static const List<String> mealCoverageOptions = [
    'breakfast',
    'lunch',
    'dinner',
    'all_meals',
  ];
  
  static const List<String> timeWindowOptions = [
    'morning',
    'afternoon',
    'evening',
  ];
  
  static const List<String> apartmentSizeOptions = [
    '1_bhk',
    '2_bhk',
    '3_bhk',
    '4_bhk',
    'villa',
  ];
  
  static const Map<String, String> apartmentSizeLabels = {
    '1_bhk': '1 BHK',
    '2_bhk': '2 BHK',
    '3_bhk': '3 BHK',
    '4_bhk': '4 BHK',
    'villa': 'Villa',
  };
}