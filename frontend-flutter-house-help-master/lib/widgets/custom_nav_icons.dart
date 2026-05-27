import 'package:flutter/material.dart';
import '../theme.dart';

/// Custom icon family for bottom navigation
/// Designed to feel operational and premium, matching the SevaQ aesthetic
class CustomNavIcons {
  /// Home icon - house with subtle structure
  static Widget home({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _HomeNavIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Operations icon - dashboard with progress bars
  static Widget operations({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _OperationsNavIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Account icon - person with subtle circle
  static Widget account({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _AccountNavIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }
}

class _HomeNavIconPainter extends CustomPainter {
  final Color color;
  _HomeNavIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // House structure
    final path = Path();
    path.moveTo(size.width * 0.5, size.height * 0.35);
    path.lineTo(size.width * 0.25, size.height * 0.55);
    path.lineTo(size.width * 0.25, size.height * 0.75);
    path.lineTo(size.width * 0.75, size.height * 0.75);
    path.lineTo(size.width * 0.75, size.height * 0.55);
    path.close();
    canvas.drawPath(path, paint);

    // Door
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.75),
      Offset(size.width * 0.5, size.height * 0.65),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _OperationsNavIconPainter extends CustomPainter {
  final Color color;
  _OperationsNavIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Dashboard frame
    canvas.drawRect(
      Rect.fromLTWH(
        size.width * 0.2,
        size.height * 0.25,
        size.width * 0.6,
        size.height * 0.5,
      ),
      paint,
    );

    // Progress bars
    canvas.drawLine(
      Offset(size.width * 0.3, size.height * 0.35),
      Offset(size.width * 0.55, size.height * 0.35),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.3, size.height * 0.45),
      Offset(size.width * 0.65, size.height * 0.45),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.3, size.height * 0.55),
      Offset(size.width * 0.45, size.height * 0.55),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _AccountNavIconPainter extends CustomPainter {
  final Color color;
  _AccountNavIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Household identity glyph - shield with resident node
    // Shield outline
    final shieldPath = Path();
    shieldPath.moveTo(size.width * 0.5, size.height * 0.25);
    shieldPath.lineTo(size.width * 0.25, size.height * 0.45);
    shieldPath.lineTo(size.width * 0.25, size.height * 0.65);
    shieldPath.lineTo(size.width * 0.5, size.height * 0.85);
    shieldPath.lineTo(size.width * 0.75, size.height * 0.65);
    shieldPath.lineTo(size.width * 0.75, size.height * 0.45);
    shieldPath.close();
    canvas.drawPath(shieldPath, paint);

    // Resident node (center dot)
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.55), 2.5, paint);

    // Connection lines (network)
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.55),
      Offset(size.width * 0.35, size.height * 0.45),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.55),
      Offset(size.width * 0.65, size.height * 0.45),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
