import 'package:flutter/material.dart';
import '../theme.dart';

/// Custom icon family for household support services
/// Each icon is designed to feel operational and premium
class CustomServiceIcons {
  /// Cooking support - chef hat with steam
  static Widget cookingSupport({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _CookingIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Housekeeping - sparkles with handle
  static Widget housekeeping({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _HousekeepingIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Laundry - basket with clothes
  static Widget laundry({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _LaundryIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Elderly assistance - heart with person
  static Widget elderlyAssistance({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ElderlyIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Deep cleaning - spray bottle with mist
  static Widget deepCleaning({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DeepCleaningIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Childcare - baby bottle with heart
  static Widget childcare({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ChildcareIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Gardening - leaf with soil
  static Widget gardening({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _GardeningIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Pet care - paw print
  static Widget petCare({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _PetCareIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Errands - shopping bag with check
  static Widget errands({Color? color, double size = 20}) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ErrandsIconPainter(color ?? AppTheme.emeraldGreen),
      ),
    );
  }

  /// Get icon by service name
  static Widget getServiceIcon(
    String service, {
    Color? color,
    double size = 20,
  }) {
    switch (service) {
      case 'Kitchen Operations':
        return cookingSupport(color: color, size: size);
      case 'Home Maintenance':
        return housekeeping(color: color, size: size);
      case 'Laundry':
        return laundry(color: color, size: size);
      case 'Elderly Care':
        return elderlyAssistance(color: color, size: size);
      case 'Deep Cleaning':
        return deepCleaning(color: color, size: size);
      case 'Childcare':
        return childcare(color: color, size: size);
      case 'Gardening':
        return gardening(color: color, size: size);
      case 'Pet Care':
        return petCare(color: color, size: size);
      case 'Errands':
        return errands(color: color, size: size);
      default:
        return Icon(
          Icons.home,
          color: color ?? AppTheme.emeraldGreen,
          size: size,
        );
    }
  }
}

// ============================================================================
// ICON PAINTERS - SevaQ Icon System v1
// ============================================================================

class _CookingIconPainter extends CustomPainter {
  final Color color;
  _CookingIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Chef hat
    final path = Path();
    path.moveTo(size.width * 0.5, size.height * 0.2);
    path.lineTo(size.width * 0.3, size.height * 0.5);
    path.lineTo(size.width * 0.7, size.height * 0.5);
    path.close();
    canvas.drawPath(path, paint);

    // Steam lines
    canvas.drawLine(
      Offset(size.width * 0.35, size.height * 0.15),
      Offset(size.width * 0.35, size.height * 0.05),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.1),
      Offset(size.width * 0.5, size.height * 0.02),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.65, size.height * 0.15),
      Offset(size.width * 0.65, size.height * 0.05),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _HousekeepingIconPainter extends CustomPainter {
  final Color color;
  _HousekeepingIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Architectural cleaning glyph - building with mop/squeegee
    // Building structure
    final buildingPath = Path();
    buildingPath.moveTo(size.width * 0.25, size.height * 0.7);
    buildingPath.lineTo(size.width * 0.25, size.height * 0.4);
    buildingPath.lineTo(size.width * 0.35, size.height * 0.3);
    buildingPath.lineTo(size.width * 0.45, size.height * 0.4);
    buildingPath.lineTo(size.width * 0.45, size.height * 0.7);
    buildingPath.close();
    canvas.drawPath(buildingPath, paint);

    // Window
    canvas.drawLine(
      Offset(size.width * 0.28, size.height * 0.45),
      Offset(size.width * 0.42, size.height * 0.45),
      paint,
    );

    // Mop/squeegee handle
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.7),
      Offset(size.width * 0.7, size.height * 0.3),
      paint,
    );

    // Mop head
    canvas.drawCircle(Offset(size.width * 0.72, size.height * 0.28), 2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LaundryIconPainter extends CustomPainter {
  final Color color;
  _LaundryIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Basket
    final basketPath = Path();
    basketPath.moveTo(size.width * 0.2, size.height * 0.6);
    basketPath.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.8,
      size.width * 0.8,
      size.height * 0.6,
    );
    basketPath.lineTo(size.width * 0.7, size.height * 0.4);
    basketPath.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.3,
      size.width * 0.3,
      size.height * 0.4,
    );
    basketPath.close();
    canvas.drawPath(basketPath, paint);

    // Clothes lines
    canvas.drawLine(
      Offset(size.width * 0.35, size.height * 0.45),
      Offset(size.width * 0.35, size.height * 0.55),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.4),
      Offset(size.width * 0.5, size.height * 0.5),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.65, size.height * 0.45),
      Offset(size.width * 0.65, size.height * 0.55),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ElderlyIconPainter extends CustomPainter {
  final Color color;
  _ElderlyIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Heart
    final heartPath = Path();
    heartPath.moveTo(size.width * 0.5, size.height * 0.35);
    heartPath.cubicTo(
      size.width * 0.35,
      size.height * 0.25,
      size.width * 0.25,
      size.height * 0.35,
      size.width * 0.25,
      size.height * 0.5,
    );
    heartPath.cubicTo(
      size.width * 0.25,
      size.height * 0.65,
      size.width * 0.5,
      size.height * 0.8,
      size.width * 0.5,
      size.height * 0.8,
    );
    heartPath.cubicTo(
      size.width * 0.5,
      size.height * 0.8,
      size.width * 0.75,
      size.height * 0.65,
      size.width * 0.75,
      size.height * 0.5,
    );
    heartPath.cubicTo(
      size.width * 0.75,
      size.height * 0.35,
      size.width * 0.65,
      size.height * 0.25,
      size.width * 0.5,
      size.height * 0.35,
    );
    canvas.drawPath(heartPath, paint);

    // Person
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.25), 2, paint);
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.25),
      Offset(size.width * 0.5, size.height * 0.15),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _DeepCleaningIconPainter extends CustomPainter {
  final Color color;
  _DeepCleaningIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Spray bottle body
    final bottlePath = Path();
    bottlePath.moveTo(size.width * 0.35, size.height * 0.7);
    bottlePath.lineTo(size.width * 0.35, size.height * 0.3);
    bottlePath.lineTo(size.width * 0.45, size.height * 0.2);
    bottlePath.lineTo(size.width * 0.55, size.height * 0.2);
    bottlePath.lineTo(size.width * 0.65, size.height * 0.3);
    bottlePath.lineTo(size.width * 0.65, size.height * 0.7);
    bottlePath.close();
    canvas.drawPath(bottlePath, paint);

    // Trigger
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.2),
      Offset(size.width * 0.6, size.height * 0.15),
      paint,
    );

    // Mist droplets
    canvas.drawCircle(Offset(size.width * 0.4, size.height * 0.15), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.45, size.height * 0.12), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.1), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.55, size.height * 0.12), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.6, size.height * 0.15), 1, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ChildcareIconPainter extends CustomPainter {
  final Color color;
  _ChildcareIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Baby bottle
    final bottlePath = Path();
    bottlePath.moveTo(size.width * 0.45, size.height * 0.6);
    bottlePath.lineTo(size.width * 0.45, size.height * 0.3);
    bottlePath.lineTo(size.width * 0.55, size.height * 0.3);
    bottlePath.lineTo(size.width * 0.55, size.height * 0.6);
    bottlePath.close();
    canvas.drawPath(bottlePath, paint);

    // Nipple
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.25), 3, paint);

    // Heart
    final heartPath = Path();
    heartPath.moveTo(size.width * 0.5, size.height * 0.8);
    heartPath.cubicTo(
      size.width * 0.4,
      size.height * 0.75,
      size.width * 0.35,
      size.height * 0.8,
      size.width * 0.35,
      size.height * 0.85,
    );
    heartPath.cubicTo(
      size.width * 0.35,
      size.height * 0.9,
      size.width * 0.5,
      size.height * 0.95,
      size.width * 0.5,
      size.height * 0.95,
    );
    heartPath.cubicTo(
      size.width * 0.5,
      size.height * 0.95,
      size.width * 0.65,
      size.height * 0.9,
      size.width * 0.65,
      size.height * 0.85,
    );
    heartPath.cubicTo(
      size.width * 0.65,
      size.height * 0.8,
      size.width * 0.6,
      size.height * 0.75,
      size.width * 0.5,
      size.height * 0.8,
    );
    canvas.drawPath(heartPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GardeningIconPainter extends CustomPainter {
  final Color color;
  _GardeningIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Leaf
    final leafPath = Path();
    leafPath.moveTo(size.width * 0.5, size.height * 0.2);
    leafPath.cubicTo(
      size.width * 0.3,
      size.height * 0.3,
      size.width * 0.2,
      size.height * 0.5,
      size.width * 0.5,
      size.height * 0.8,
    );
    leafPath.cubicTo(
      size.width * 0.8,
      size.height * 0.5,
      size.width * 0.7,
      size.height * 0.3,
      size.width * 0.5,
      size.height * 0.2,
    );
    canvas.drawPath(leafPath, paint);

    // Stem
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.8),
      Offset(size.width * 0.5, size.height * 0.95),
      paint,
    );

    // Soil line
    canvas.drawLine(
      Offset(size.width * 0.2, size.height * 0.95),
      Offset(size.width * 0.8, size.height * 0.95),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _PetCareIconPainter extends CustomPainter {
  final Color color;
  _PetCareIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Paw print - main pad
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.5), 4, paint);

    // Paw toes
    canvas.drawCircle(
      Offset(size.width * 0.35, size.height * 0.35),
      2.5,
      paint,
    );
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.32), 2.5, paint);
    canvas.drawCircle(
      Offset(size.width * 0.65, size.height * 0.35),
      2.5,
      paint,
    );

    // Inner pads
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.5), 1.5, paint);
    canvas.drawCircle(Offset(size.width * 0.35, size.height * 0.35), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.5, size.height * 0.32), 1, paint);
    canvas.drawCircle(Offset(size.width * 0.65, size.height * 0.35), 1, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ErrandsIconPainter extends CustomPainter {
  final Color color;
  _ErrandsIconPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    // Shopping bag
    final bagPath = Path();
    bagPath.moveTo(size.width * 0.3, size.height * 0.6);
    bagPath.lineTo(size.width * 0.3, size.height * 0.8);
    bagPath.lineTo(size.width * 0.5, size.height * 0.95);
    bagPath.lineTo(size.width * 0.7, size.height * 0.8);
    bagPath.lineTo(size.width * 0.7, size.height * 0.6);
    bagPath.close();
    canvas.drawPath(bagPath, paint);

    // Handle
    canvas.drawLine(
      Offset(size.width * 0.4, size.height * 0.6),
      Offset(size.width * 0.6, size.height * 0.6),
      paint,
    );

    // Check mark
    canvas.drawLine(
      Offset(size.width * 0.45, size.height * 0.75),
      Offset(size.width * 0.5, size.height * 0.8),
      paint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, size.height * 0.8),
      Offset(size.width * 0.65, size.height * 0.65),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
