import 'dart:convert';

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
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
    return User(
      id: json['id']?.toString() ?? '',
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
      return User(id: '', email: '', firstName: '', lastName: '', role: '');
    }
  }
}
