import 'package:flutter_test/flutter_test.dart';
import 'package:worker_app_flutter/main.dart';

void main() {
  testWidgets('Worker app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const WorkerApp());

    // Verify the app starts - we should see the login screen title
    expect(find.text('SEVAQ Worker'), findsOneWidget);
  });
}
