import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  final String message;

  const LoadingWidget({Key? key, this.message = 'Loading...'})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(color: Colors.blue, strokeWidth: 4.0),
    );
  }
}

class LoadingContainer extends StatelessWidget {
  final Widget child;
  final bool isLoading;
  final String loadingMessage;

  const LoadingContainer({
    Key? key,
    required this.child,
    required this.isLoading,
    this.loadingMessage = 'Loading...',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              color: Colors.blue,
              strokeWidth: 4.0,
            ),
            const SizedBox(height: 16),
            Text(
              loadingMessage,
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return child;
  }
}
