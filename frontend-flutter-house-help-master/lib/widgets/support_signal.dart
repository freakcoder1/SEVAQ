import 'package:flutter/material.dart';

class SupportSignal extends StatelessWidget {
  final String supportText;

  const SupportSignal({Key? key, required this.supportText}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: Colors.transparent),
      child: Text(
        supportText,
        style: TextStyle(
          fontSize: 11,
          color: Colors.grey[500],
          fontWeight: FontWeight.w400,
          letterSpacing: 0.2,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}
