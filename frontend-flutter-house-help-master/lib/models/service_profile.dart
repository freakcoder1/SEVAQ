class ServiceProfile {
  final int id;
  final String publicId;
  final String serviceType; // COOK, MAID, CLEANING
  final String profileName; // BASIC, STANDARD, EXTENDED
  final String description;
  final String scopeDefinition;
  final String maxCapacityHint;
  final Map<String, dynamic> internalRules;
  final double monthlyPrice;
  final bool isActive;

  ServiceProfile({
    required this.id,
    required this.publicId,
    required this.serviceType,
    required this.profileName,
    required this.description,
    required this.scopeDefinition,
    required this.maxCapacityHint,
    required this.internalRules,
    required this.monthlyPrice,
    required this.isActive,
  });

  factory ServiceProfile.fromJson(Map<String, dynamic> json) {
    return ServiceProfile(
      id: json['id'] as int,
      publicId: json['publicId'] as String,
      serviceType: json['serviceType'] as String,
      profileName: json['profileName'] as String,
      description: json['description'] as String,
      scopeDefinition: json['scopeDefinition'] as String,
      maxCapacityHint: json['maxCapacityHint'] as String,
      internalRules: json['internalRules'] as Map<String, dynamic>,
      monthlyPrice: double.parse(json['monthlyPrice'].toString()),
      isActive: json['isActive'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'publicId': publicId,
      'serviceType': serviceType,
      'profileName': profileName,
      'description': description,
      'scopeDefinition': scopeDefinition,
      'maxCapacityHint': maxCapacityHint,
      'internalRules': internalRules,
      'monthlyPrice': monthlyPrice,
      'isActive': isActive,
    };
  }
}
