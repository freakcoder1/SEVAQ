import 'package:flutter/material.dart';

/// Widget that wraps its child.
/// Note: New booking notifications are handled in main.dart
/// This widget is now a simple pass-through wrapper.
class NotificationListenerWidget extends StatelessWidget {
  final Widget child;

  const NotificationListenerWidget({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return child;
  }
}
