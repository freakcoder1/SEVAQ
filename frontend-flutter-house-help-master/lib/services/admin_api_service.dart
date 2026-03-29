import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Admin API Service for interacting with backend admin endpoints
class AdminApiService {
  static String get baseUrl => AppConfig.apiBaseUrl;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'jwt_token');
    if (token == null) {
      throw Exception('No authentication token found');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Dashboard Statistics
  Future<AdminDashboardStats> getDashboardStats() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/dashboard'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminDashboardStats.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
          'Failed to load dashboard stats: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Error getting dashboard stats: $e');
      rethrow;
    }
  }

  /// Get all workers with optional filters
  Future<List<AdminWorker>> getWorkers({
    bool? isAvailable,
    double? minRating,
    String? serviceId,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{};
      if (isAvailable != null)
        queryParams['isAvailable'] = isAvailable.toString();
      if (minRating != null) queryParams['minRating'] = minRating.toString();
      if (serviceId != null) queryParams['serviceId'] = serviceId;

      final uri = Uri.parse(
        '$baseUrl/admin/workers',
      ).replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => AdminWorker.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load workers: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting workers: $e');
      rethrow;
    }
  }

  /// Get worker by ID
  Future<AdminWorker> getWorkerById(int id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/workers/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminWorker.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load worker: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting worker: $e');
      rethrow;
    }
  }

  /// Update worker details
  Future<AdminWorker> updateWorker(int id, Map<String, dynamic> updates) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/admin/workers/$id'),
        headers: headers,
        body: jsonEncode(updates),
      );

      if (response.statusCode == 200) {
        return AdminWorker.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to update worker: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error updating worker: $e');
      rethrow;
    }
  }

  /// Toggle worker availability
  Future<AdminWorker> toggleWorkerAvailability(int id, bool isAvailable) async {
    try {
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/admin/workers/$id/availability'),
        headers: headers,
        body: jsonEncode({'isAvailable': isAvailable}),
      );

      if (response.statusCode == 200) {
        return AdminWorker.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
          'Failed to toggle worker availability: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Error toggling worker availability: $e');
      rethrow;
    }
  }

  /// Get all bookings with filters
  Future<List<AdminBooking>> getBookings({
    String? status,
    String? startDate,
    String? endDate,
    int? workerId,
    String? userId,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = <String, String>{};
      if (status != null) queryParams['status'] = status;
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;
      if (workerId != null) queryParams['workerId'] = workerId.toString();
      if (userId != null) queryParams['userId'] = userId;

      final uri = Uri.parse(
        '$baseUrl/admin/bookings',
      ).replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => AdminBooking.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load bookings: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting bookings: $e');
      rethrow;
    }
  }

  /// Get booking by ID
  Future<AdminBooking> getBookingById(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/bookings/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminBooking.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load booking: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting booking: $e');
      rethrow;
    }
  }

  /// Update booking status
  Future<AdminBooking> updateBookingStatus(String id, String status) async {
    try {
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/admin/bookings/$id/status'),
        headers: headers,
        body: jsonEncode({'status': status}),
      );

      if (response.statusCode == 200) {
        return AdminBooking.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
          'Failed to update booking status: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Error updating booking status: $e');
      rethrow;
    }
  }

  /// Cancel a booking
  Future<AdminBooking> cancelBooking(String id, {String? reason}) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/admin/bookings/$id/cancel'),
        headers: headers,
        body: jsonEncode({'reason': reason ?? 'Cancelled by admin'}),
      );

      if (response.statusCode == 200) {
        return AdminBooking.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to cancel booking: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error cancelling booking: $e');
      rethrow;
    }
  }

  /// Get revenue analytics
  Future<AdminRevenueAnalytics> getRevenueAnalytics({
    String period = 'month',
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/analytics/revenue?period=$period'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminRevenueAnalytics.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
          'Failed to load revenue analytics: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Error getting revenue analytics: $e');
      rethrow;
    }
  }

  /// Get booking analytics
  Future<AdminBookingAnalytics> getBookingAnalytics() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/analytics/bookings'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminBookingAnalytics.fromJson(jsonDecode(response.body));
      } else {
        throw Exception(
          'Failed to load booking analytics: ${response.statusCode}',
        );
      }
    } catch (e) {
      debugPrint('Error getting booking analytics: $e');
      rethrow;
    }
  }

  /// Get all users
  Future<List<AdminUser>> getUsers() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/users'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => AdminUser.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load users: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting users: $e');
      rethrow;
    }
  }

  /// Get user by ID
  Future<AdminUser> getUserById(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/admin/users/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return AdminUser.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load user: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error getting user: $e');
      rethrow;
    }
  }
}

/// Dashboard Statistics Model
class AdminDashboardStats {
  final int totalUsers;
  final int totalWorkers;
  final int totalBookings;
  final double totalRevenue;
  final int activeSubscriptions;
  final int pendingAssignments;
  final int completedJobsToday;
  final double averageRating;
  final Map<String, int> bookingsByStatus;
  final List<AdminRevenueByMonth> revenueByMonth;
  final List<AdminTopWorker> topWorkers;

  AdminDashboardStats({
    required this.totalUsers,
    required this.totalWorkers,
    required this.totalBookings,
    required this.totalRevenue,
    required this.activeSubscriptions,
    required this.pendingAssignments,
    required this.completedJobsToday,
    required this.averageRating,
    required this.bookingsByStatus,
    required this.revenueByMonth,
    required this.topWorkers,
  });

  factory AdminDashboardStats.fromJson(Map<String, dynamic> json) {
    return AdminDashboardStats(
      totalUsers: json['totalUsers'] ?? 0,
      totalWorkers: json['totalWorkers'] ?? 0,
      totalBookings: json['totalBookings'] ?? 0,
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      activeSubscriptions: json['activeSubscriptions'] ?? 0,
      pendingAssignments: json['pendingAssignments'] ?? 0,
      completedJobsToday: json['completedJobsToday'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      bookingsByStatus: Map<String, int>.from(json['bookingsByStatus'] ?? {}),
      revenueByMonth:
          (json['revenueByMonth'] as List<dynamic>?)
              ?.map((e) => AdminRevenueByMonth.fromJson(e))
              .toList() ??
          [],
      topWorkers:
          (json['topWorkers'] as List<dynamic>?)
              ?.map((e) => AdminTopWorker.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class AdminRevenueByMonth {
  final String month;
  final double revenue;

  AdminRevenueByMonth({required this.month, required this.revenue});

  factory AdminRevenueByMonth.fromJson(Map<String, dynamic> json) {
    return AdminRevenueByMonth(
      month: json['month'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
    );
  }
}

class AdminTopWorker {
  final int id;
  final String name;
  final int completedJobs;
  final double rating;

  AdminTopWorker({
    required this.id,
    required this.name,
    required this.completedJobs,
    required this.rating,
  });

  factory AdminTopWorker.fromJson(Map<String, dynamic> json) {
    return AdminTopWorker(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      completedJobs: json['completedJobs'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
    );
  }
}

/// Worker Model
class AdminWorker {
  final int id;
  final String? bio;
  final double rating;
  final bool isAvailable;
  final DateTime? createdAt;
  final AdminUser? user;
  final List<AdminService>? services;

  AdminWorker({
    required this.id,
    this.bio,
    required this.rating,
    required this.isAvailable,
    this.createdAt,
    this.user,
    this.services,
  });

  String get name =>
      user != null ? '${user!.firstName} ${user!.lastName}' : 'Unknown';
  String get email => user?.email ?? '';
  String get phone => user?.phone ?? '';
  String get servicesList => services?.map((s) => s.name).join(', ') ?? 'None';

  factory AdminWorker.fromJson(Map<String, dynamic> json) {
    return AdminWorker(
      id: json['id'] ?? 0,
      bio: json['bio'],
      rating: (json['rating'] ?? 0).toDouble(),
      isAvailable: json['isAvailable'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      user: json['user'] != null ? AdminUser.fromJson(json['user']) : null,
      services: (json['services'] as List<dynamic>?)
          ?.map((e) => AdminService.fromJson(e))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bio': bio,
      'rating': rating,
      'isAvailable': isAvailable,
      'createdAt': createdAt?.toIso8601String(),
      'user': user?.toJson(),
      'services': services?.map((e) => e.toJson()).toList(),
    };
  }
}

/// Booking Model
class AdminBooking {
  final String id;
  final double amount;
  final String status;
  final DateTime date;
  final String? startTime;
  final String? endTime;
  final String? assignmentReason;
  final DateTime? assignmentTimestamp;
  final AdminUser? user;
  final AdminWorker? worker;
  final AdminService? service;
  final AdminSlot? slot;

  AdminBooking({
    required this.id,
    required this.amount,
    required this.status,
    required this.date,
    this.startTime,
    this.endTime,
    this.assignmentReason,
    this.assignmentTimestamp,
    this.user,
    this.worker,
    this.service,
    this.slot,
  });

  String get customerName =>
      user != null ? '${user!.firstName} ${user!.lastName}' : 'Unknown';
  String get workerName => worker?.name ?? 'Not Assigned';
  String get serviceName => service?.name ?? 'Unknown';
  String get formattedDate => '${date.day}/${date.month}/${date.year}';

  factory AdminBooking.fromJson(Map<String, dynamic> json) {
    return AdminBooking(
      id: json['id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      date: DateTime.parse(json['date']),
      startTime: json['startTime'],
      endTime: json['endTime'],
      assignmentReason: json['assignmentReason'],
      assignmentTimestamp: json['assignmentTimestamp'] != null
          ? DateTime.parse(json['assignmentTimestamp'])
          : null,
      user: json['user'] != null ? AdminUser.fromJson(json['user']) : null,
      worker: json['worker'] != null
          ? AdminWorker.fromJson(json['worker'])
          : null,
      service: json['service'] != null
          ? AdminService.fromJson(json['service'])
          : null,
      slot: json['slot'] != null ? AdminSlot.fromJson(json['slot']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'amount': amount,
      'status': status,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'assignmentReason': assignmentReason,
      'assignmentTimestamp': assignmentTimestamp?.toIso8601String(),
      'user': user?.toJson(),
      'worker': worker?.toJson(),
      'service': service?.toJson(),
      'slot': slot?.toJson(),
    };
  }
}

/// User Model
class AdminUser {
  final String publicId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String role;
  final DateTime? createdAt;

  AdminUser({
    required this.publicId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.role,
    this.createdAt,
  });

  String get name => '$firstName $lastName';

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      publicId: json['publicId'] ?? json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? 'user',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'publicId': publicId,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'role': role,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

/// Service Model
class AdminService {
  final String publicId;
  final String name;
  final String? description;
  final double? price;

  AdminService({
    required this.publicId,
    required this.name,
    this.description,
    this.price,
  });

  factory AdminService.fromJson(Map<String, dynamic> json) {
    return AdminService(
      publicId: json['publicId'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      price: (json['price'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'publicId': publicId,
      'name': name,
      'description': description,
      'price': price,
    };
  }
}

/// Slot Model
class AdminSlot {
  final int id;
  final DateTime date;
  final String startTime;
  final String endTime;
  final bool isAvailable;

  AdminSlot({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
  });

  factory AdminSlot.fromJson(Map<String, dynamic> json) {
    return AdminSlot(
      id: json['id'] ?? 0,
      date: DateTime.parse(json['date']),
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      isAvailable: json['isAvailable'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'isAvailable': isAvailable,
    };
  }
}

/// Revenue Analytics Model
class AdminRevenueAnalytics {
  final double totalRevenue;
  final double averagePerBooking;
  final List<AdminRevenueByService> revenueByService;
  final List<AdminRevenueByDate> revenueByDate;

  AdminRevenueAnalytics({
    required this.totalRevenue,
    required this.averagePerBooking,
    required this.revenueByService,
    required this.revenueByDate,
  });

  factory AdminRevenueAnalytics.fromJson(Map<String, dynamic> json) {
    return AdminRevenueAnalytics(
      totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
      averagePerBooking: (json['averagePerBooking'] ?? 0).toDouble(),
      revenueByService:
          (json['revenueByService'] as List<dynamic>?)
              ?.map((e) => AdminRevenueByService.fromJson(e))
              .toList() ??
          [],
      revenueByDate:
          (json['revenueByDate'] as List<dynamic>?)
              ?.map((e) => AdminRevenueByDate.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class AdminRevenueByService {
  final String service;
  final double revenue;

  AdminRevenueByService({required this.service, required this.revenue});

  factory AdminRevenueByService.fromJson(Map<String, dynamic> json) {
    return AdminRevenueByService(
      service: json['service'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
    );
  }
}

class AdminRevenueByDate {
  final String date;
  final double revenue;

  AdminRevenueByDate({required this.date, required this.revenue});

  factory AdminRevenueByDate.fromJson(Map<String, dynamic> json) {
    return AdminRevenueByDate(
      date: json['date'] ?? '',
      revenue: (json['revenue'] ?? 0).toDouble(),
    );
  }
}

/// Booking Analytics Model
class AdminBookingAnalytics {
  final int totalBookings;
  final List<AdminBookingsByStatus> bookingsByStatus;
  final List<AdminBookingsByService> bookingsByService;
  final List<AdminBookingsByDate> bookingsByDate;
  final double completionRate;
  final double cancellationRate;

  AdminBookingAnalytics({
    required this.totalBookings,
    required this.bookingsByStatus,
    required this.bookingsByService,
    required this.bookingsByDate,
    required this.completionRate,
    required this.cancellationRate,
  });

  factory AdminBookingAnalytics.fromJson(Map<String, dynamic> json) {
    return AdminBookingAnalytics(
      totalBookings: json['totalBookings'] ?? 0,
      bookingsByStatus:
          (json['bookingsByStatus'] as List<dynamic>?)
              ?.map((e) => AdminBookingsByStatus.fromJson(e))
              .toList() ??
          [],
      bookingsByService:
          (json['bookingsByService'] as List<dynamic>?)
              ?.map((e) => AdminBookingsByService.fromJson(e))
              .toList() ??
          [],
      bookingsByDate:
          (json['bookingsByDate'] as List<dynamic>?)
              ?.map((e) => AdminBookingsByDate.fromJson(e))
              .toList() ??
          [],
      completionRate: (json['completionRate'] ?? 0).toDouble(),
      cancellationRate: (json['cancellationRate'] ?? 0).toDouble(),
    );
  }
}

class AdminBookingsByStatus {
  final String status;
  final int count;

  AdminBookingsByStatus({required this.status, required this.count});

  factory AdminBookingsByStatus.fromJson(Map<String, dynamic> json) {
    return AdminBookingsByStatus(
      status: json['status'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}

class AdminBookingsByService {
  final String service;
  final int count;

  AdminBookingsByService({required this.service, required this.count});

  factory AdminBookingsByService.fromJson(Map<String, dynamic> json) {
    return AdminBookingsByService(
      service: json['service'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}

class AdminBookingsByDate {
  final String date;
  final int count;

  AdminBookingsByDate({required this.date, required this.count});

  factory AdminBookingsByDate.fromJson(Map<String, dynamic> json) {
    return AdminBookingsByDate(
      date: json['date'] ?? '',
      count: json['count'] ?? 0,
    );
  }
}
