class CategoryAvailabilityResponse {
  final List<CategoryAvailability> categories;

  CategoryAvailabilityResponse({required this.categories});

  factory CategoryAvailabilityResponse.fromJson(Map<String, dynamic> json) {
    final categoriesList = json['categories'] as List;
    return CategoryAvailabilityResponse(
      categories: categoriesList
          .map((item) => CategoryAvailability.fromJson(item))
          .toList(),
    );
  }
}

class CategoryAvailability {
  final String name;
  final bool isAvailable;
  final int availableServicesCount;
  final int availableWorkersCount;

  CategoryAvailability({
    required this.name,
    required this.isAvailable,
    required this.availableServicesCount,
    required this.availableWorkersCount,
  });

  factory CategoryAvailability.fromJson(Map<String, dynamic> json) {
    return CategoryAvailability(
      name: json['name'] ?? 'Unknown Category',
      isAvailable: json['isAvailable'] ?? false,
      availableServicesCount: json['availableServicesCount'] ?? 0,
      availableWorkersCount: json['availableWorkersCount'] ?? 0,
    );
  }
}
