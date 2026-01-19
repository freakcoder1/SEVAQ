import 'package:flutter/material.dart';

class AnimationHelper {
  // Slow, confident motion (300-500ms)
  static const Duration slowDuration = Duration(milliseconds: 350);
  static const Duration mediumDuration = Duration(milliseconds: 450);
  static const Duration fastDuration = Duration(milliseconds: 250);

  // Ease-in-out easing (smooth, not bouncy)
  static const Curve confidentCurve = Curves.easeInOut;
  static const Curve entranceCurve = Curves.easeOut;
  static const Curve exitCurve = Curves.easeIn;

  // Component animation builders

  // Fade transitions
  static Widget fadeTransition({
    required Animation<double> animation,
    required Widget child,
    Curve curve = confidentCurve,
    Duration duration = slowDuration,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Opacity(opacity: animation.value, child: child);
      },
      child: child,
    );
  }

  // Slide transitions
  static Widget slideTransition({
    required Animation<double> animation,
    required Widget child,
    Offset begin = const Offset(0.0, 0.2),
    Offset end = Offset.zero,
    Curve curve = entranceCurve,
    Duration duration = slowDuration,
  }) {
    return SlideTransition(
      position: Tween<Offset>(
        begin: begin,
        end: end,
      ).animate(CurvedAnimation(parent: animation, curve: curve)),
      child: child,
    );
  }

  // Scale transitions
  static Widget scaleTransition({
    required Animation<double> animation,
    required Widget child,
    double begin = 0.95,
    double end = 1.0,
    Curve curve = entranceCurve,
    Duration duration = slowDuration,
  }) {
    return ScaleTransition(
      scale: Tween<double>(
        begin: begin,
        end: end,
      ).animate(CurvedAnimation(parent: animation, curve: curve)),
      child: child,
    );
  }

  // Combined entrance animation
  static Widget entranceAnimation({
    required Animation<double> animation,
    required Widget child,
    Offset slideOffset = const Offset(0.0, 0.1),
    double scaleBegin = 0.98,
    Curve curve = entranceCurve,
    Duration duration = slowDuration,
  }) {
    return slideTransition(
      animation: animation,
      child: scaleTransition(
        animation: animation,
        child: child,
        begin: scaleBegin,
        curve: curve,
      ),
      begin: slideOffset,
      curve: curve,
    );
  }

  // Button press feedback
  static Widget buttonPressAnimation({
    required Animation<double> animation,
    required Widget child,
    VoidCallback? onPressed,
    VoidCallback? onLongPress,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 - (animation.value * 0.02), // Subtle scale down
          child: child,
        );
      },
      child: ElevatedButton(
        onPressed: onPressed,
        onLongPress: onLongPress,
        style: ElevatedButton.styleFrom(animationDuration: slowDuration),
        child: child,
      ),
    );
  }

  // Loading state animation
  static Widget shimmerAnimation({
    required Animation<double> animation,
    required Widget child,
    Color baseColor = Colors.transparent,
    Color highlightColor = Colors.white12,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (rect) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [baseColor, highlightColor, baseColor],
              stops: [
                animation.value - 0.5,
                animation.value,
                animation.value + 0.5,
              ],
            ).createShader(rect);
          },
          child: child,
        );
      },
      child: child,
    );
  }

  // Skeleton loading
  static Widget skeletonAnimation({
    required Animation<double> animation,
    double width = double.infinity,
    double height = 16,
    BorderRadius borderRadius = const BorderRadius.all(Radius.circular(4)),
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.grey[300]!, Colors.grey[200]!, Colors.grey[300]!],
              stops: [
                animation.value,
                animation.value + 0.5,
                animation.value + 1.0,
              ],
            ),
            borderRadius: borderRadius,
          ),
        );
      },
    );
  }

  // Success confirmation animation
  static Widget successAnimation({
    required Animation<double> animation,
    required Widget child,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.scale(
          scale: 1.0 + (animation.value * 0.1), // Gentle pulse
          child: Icon(Icons.check_circle, color: Colors.green[700], size: 48),
        );
      },
    );
  }

  // Error shake animation
  static Widget errorShakeAnimation({
    required Animation<double> animation,
    required Widget child,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(animation.value * 10, 0), // Subtle shake
          child: Icon(Icons.error, color: Colors.red[700], size: 48),
        );
      },
    );
  }

  // Focus ring animation
  static Widget focusRingAnimation({
    required Animation<double> animation,
    required Widget child,
    Color focusColor = Colors.green,
  }) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return Container(
          padding: EdgeInsets.all(2),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: focusColor.withOpacity(animation.value * 0.5),
                blurRadius: 8,
                spreadRadius: 2,
              ),
            ],
          ),
          child: child,
        );
      },
      child: child,
    );
  }
}
