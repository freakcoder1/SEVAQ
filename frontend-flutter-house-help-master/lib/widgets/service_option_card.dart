import 'package:flutter/material.dart';
import '../models/service_option.dart';
import '../core/theme/design_tokens.dart';

/// Service option card for the Service Clarification Page
/// Displays individual service options in a clean, selectable format
class ServiceOptionCard extends StatefulWidget {
  final ServiceOption service;
  final bool isSelected;
  final VoidCallback onTap;

  const ServiceOptionCard({
    Key? key,
    required this.service,
    required this.isSelected,
    required this.onTap,
  }) : super(key: key);

  @override
  State<ServiceOptionCard> createState() => _ServiceOptionCardState();
}

class _ServiceOptionCardState extends State<ServiceOptionCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) => setState(() => _isPressed = false),
      onTapCancel: () => setState(() => _isPressed = false),
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        transform: Matrix4.identity()..scale(_isPressed ? 0.98 : 1.0),
        child: Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 16),
          color: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: widget.isSelected
                  ? (isDark
                        ? DesignTokens.primaryContainerDark
                        : theme.colorScheme.primaryContainer)
                  : Colors.transparent,
              width: widget.isSelected ? 2 : 1,
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? DesignTokens.cardDark.withValues(alpha: 0.9)
                  : DesignTokens.cardLight,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withValues(alpha: 0.3)
                      : const Color.fromRGBO(17, 19, 21, 0.06),
                  blurRadius: 18,
                  offset: const Offset(0, 4),
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  // Leading icon with subtle styling
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: widget.isSelected
                          ? (isDark
                                ? DesignTokens.primaryContainerDark
                                : theme.colorScheme.primaryContainer)
                          : (isDark
                                ? DesignTokens.surfaceDark.withValues(
                                    alpha: 0.3,
                                  )
                                : Colors.grey[100]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      widget.service.icon,
                      size: 24,
                      color: widget.isSelected
                          ? theme.colorScheme.primary
                          : (isDark ? Colors.grey[400] : Colors.grey[600]),
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Service content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Service name
                        Text(
                          widget.service.name,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),

                        const SizedBox(height: 8),

                        // Service description
                        Text(
                          widget.service.description,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            color: theme.colorScheme.onSurfaceVariant,
                            height: 1.4,
                          ),
                        ),

                        const SizedBox(height: 8),
                      ],
                    ),
                  ),

                  // Selection indicator with animation
                  if (widget.isSelected)
                    AnimatedOpacity(
                      opacity: widget.isSelected ? 1.0 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: AnimatedScale(
                        scale: widget.isSelected ? 1.0 : 0.0,
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOutBack,
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
