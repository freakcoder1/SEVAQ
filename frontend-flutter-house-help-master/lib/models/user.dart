import 'dart:convert';

class User {
  // Backend uses UUID (String) for id, but we support both int and String for compatibility
  final dynamic id;
  final String publicId;
  final String email;
  final String firstName;
  final String lastName;
  final String role;

  User({
    required this.id,
    required this.publicId,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'publicId': publicId,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
    };
  }

  String toJsonString() {
    return jsonEncode(toJson());
  }

  static User fromJson(Map<String, dynamic> json) {
    // Handle both int and String (UUID) id formats from backend
    final dynamic rawId = json['id'];
    dynamic parsedId;
    if (rawId is int) {
      parsedId = rawId;
    } else if (rawId is String) {
      parsedId = rawId;
    } else {
      parsedId = 0;
    }

    return User(
      id: parsedId,
      publicId: json['publicId']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
    );
  }

  static User fromJsonString(String jsonString) {
    try {
      return fromJson(jsonDecode(jsonString));
    } catch (e) {
      return User(
        id: 0,
        publicId: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
      );
    }
  }
}
