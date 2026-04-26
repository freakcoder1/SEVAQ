class ServiceProfile {
  // Backend uses UUID (String) for id, but we support both int and String for compatibility
  final dynamic id;
  final String publicId;
  final String serviceType; // COOK, MAID, CLEANING
  final String description;
  final String scopeDefinition;
  final String maxCapacityHint;
  final Map<String, dynamic> internalRules;
  final double monthlyPrice;
  final bool isActive;
  final String? visitPattern; // DAILY, WEEKLY, MONTHLY
  final int? maxVisitsPerDay;
  final List<dynamic>? defaultTimeWindows; // Time window preferences

  ServiceProfile({
    required this.id,
    required this.publicId,
    required this.serviceType,
    required this.description,
    required this.scopeDefinition,
    required this.maxCapacityHint,
    required this.internalRules,
    required this.monthlyPrice,
    required this.isActive,
    this.visitPattern,
    this.maxVisitsPerDay,
    this.defaultTimeWindows,
  });

  factory ServiceProfile.fromJson(Map<String, dynamic> json) {
    return ServiceProfile(
      id: _parseId(json['id']),
      publicId: json['publicId'] as String,
      serviceType: json['serviceType'] as String,
      description: json['description'] as String? ?? '',
      scopeDefinition: json['scopeDefinition'] as String? ?? '',
      maxCapacityHint: json['maxCapacityHint'] as String? ?? '',
      internalRules: json['internalRules'] != null
          ? (json['internalRules'] is Map
                ? Map<String, dynamic>.from(json['internalRules'] as Map)
                : <String, dynamic>{})
          : <String, dynamic>{},
      monthlyPrice: double.parse(json['monthlyPrice'].toString()),
      isActive: json['isActive'] as bool,
      visitPattern: json['visitPattern'] as String?,
      maxVisitsPerDay: json['maxVisitsPerDay'] as int?,
      defaultTimeWindows: json['defaultTimeWindows'] != null
          ? (json['defaultTimeWindows'] is List
                ? List<dynamic>.from(json['defaultTimeWindows'] as List)
                : null)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'publicId': publicId,
      'serviceType': serviceType,
      'description': description,
      'scopeDefinition': scopeDefinition,
      'maxCapacityHint': maxCapacityHint,
      'internalRules': internalRules,
      'monthlyPrice': monthlyPrice,
      'isActive': isActive,
      'visitPattern': visitPattern,
      'maxVisitsPerDay': maxVisitsPerDay,
      'defaultTimeWindows': defaultTimeWindows,
    };
  }

  /// Helper to parse id from various types (int or String UUID)
  static dynamic _parseId(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return value;
    return 0;
  }
}
