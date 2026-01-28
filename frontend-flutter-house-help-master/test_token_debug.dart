import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'lib/services/api_service.dart';

void main() {
  runApp(const TokenDebugApp());
}

class TokenDebugApp extends StatelessWidget {
  const TokenDebugApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Token Debug',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const TokenDebugScreen(),
    );
  }
}

class TokenDebugScreen extends StatefulWidget {
  const TokenDebugScreen({super.key});

  @override
  State<TokenDebugScreen> createState() => _TokenDebugScreenState();
}

class _TokenDebugScreenState extends State<TokenDebugScreen> {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final ApiService _apiService = ApiService();

  String _secureStorageToken = '';
  String _secureStorageUserId = '';
  String _sharedPreferencesToken = '';
  String _sharedPreferencesUserId = '';
  String _apiServiceToken = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final secureStorageToken = await _secureStorage.read(key: 'jwt_token');
    final secureStorageUserId = await _secureStorage.read(key: 'user_id');

    final prefs = await SharedPreferences.getInstance();
    final sharedPreferencesToken = prefs.getString('jwt_token');
    final sharedPreferencesUserId = prefs.getString('user_id');

    final apiServiceToken = await _apiService.getToken();

    setState(() {
      _secureStorageToken = secureStorageToken ?? 'null';
      _secureStorageUserId = secureStorageUserId ?? 'null';
      _sharedPreferencesToken = sharedPreferencesToken ?? 'null';
      _sharedPreferencesUserId = sharedPreferencesUserId ?? 'null';
      _apiServiceToken = apiServiceToken ?? 'null';
    });
  }

  Future<void> _clearAll() async {
    await _secureStorage.delete(key: 'jwt_token');
    await _secureStorage.delete(key: 'user_id');

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_id');
    await prefs.remove('cached_user');

    await _loadData();
  }

  Future<void> _setTestToken() async {
    const testToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NTYyNCwiZXhwIjoxNzcyMTc3NjI0fQ.q0DQB8Ql1r_RzgClnXiUUbhj7StnFNsYCQvXo_yon_k';
    const testUserId = '18';

    await _secureStorage.write(key: 'jwt_token', value: testToken);
    await _secureStorage.write(key: 'user_id', value: testUserId);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', testToken);
    await prefs.setString('user_id', testUserId);

    await _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Token Debug')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Token Storage Debug',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),

            _buildSection('Flutter Secure Storage'),
            _buildRow('Token:', _secureStorageToken),
            _buildRow('User ID:', _secureStorageUserId),

            const SizedBox(height: 20),

            _buildSection('Shared Preferences'),
            _buildRow('Token:', _sharedPreferencesToken),
            _buildRow('User ID:', _sharedPreferencesUserId),

            const SizedBox(height: 20),

            _buildSection('ApiService.getToken()'),
            _buildRow('Token:', _apiServiceToken),

            const SizedBox(height: 20),

            _buildSection('Actions'),
            ElevatedButton(onPressed: _loadData, child: const Text('Refresh')),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _clearAll,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('Clear All'),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _setTestToken,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
              child: const Text('Set Test Token'),
            ),

            const SizedBox(height: 20),

            _buildSection('Debug Info'),
            _buildRow(
              'Secure Storage Token Length:',
              _secureStorageToken.length.toString(),
            ),
            _buildRow(
              'Shared Preferences Token Length:',
              _sharedPreferencesToken.length.toString(),
            ),
            _buildRow(
              'Tokens Match:',
              (_secureStorageToken == _sharedPreferencesToken).toString(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$label ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
