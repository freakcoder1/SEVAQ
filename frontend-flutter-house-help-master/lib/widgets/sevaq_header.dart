import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme.dart';

class SevaqHeader extends StatelessWidget {
  final String householdName;
  final String? locationText;
  final String? operationalStatus;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onProfileTap;
  final VoidCallback? onLocationTap;

  const SevaqHeader({
    Key? key,
    required this.householdName,
    this.locationText,
    this.operationalStatus,
    this.onNotificationTap,
    this.onProfileTap,
    this.onLocationTap,
  }) : super(key: key);

  // Convert raw GPS codes to proper society/locality names
  String _formatLocation(String rawLocation) {
    // Map of known GPS codes to proper names
    final Map<String, String> locationMap = {
      'HCHQ+8MJ': 'Eco Village 1',
      'HCHQ+8M': 'Sector 16B, Greater Noida West',
      'HCHQ+8N': 'Gaur City 2',
      'HCHQ+8P': 'Amrapali Platinum',
      'HCHQ+8Q': 'Raj Nagar Extension',
      'HCHQ+8R': 'Vaishali Sector 6',
      'HCHQ+8S': 'Indirapuram',
      'HCHQ+8T': 'Crossings Republik',
      'ECO -1': 'Eco Village 1',
      'ECO-1': 'Eco Village 1',
      'ECO 1': 'Eco Village 1',
    };

    // Check if location contains a known GPS code
    for (final entry in locationMap.entries) {
      if (rawLocation.contains(entry.key)) {
        return entry.value;
      }
    }

    // If no match, try to extract and clean the location
    // Remove GPS codes and clean up formatting
    String cleaned = rawLocation.replaceAll(RegExp(r'[A-Z0-9]{7,}'), '').trim();
    cleaned = cleaned.replaceAll(
      RegExp(r',\s*Greater Noida,'),
      ', Greater Noida,',
    );

    // If we have a cleaned version, use it; otherwise return original
    return cleaned.isNotEmpty ? cleaned : rawLocation;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      bottom: false,
      child: Container(
        // No fixed height - let content determine size
        padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 0),
        child: Column(
          mainAxisSize: MainAxisSize.min, // Let content determine height
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Row 1: Location with subline (20-24px height)
            if (locationText != null)
              GestureDetector(
                onTap: onLocationTap,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 14,
                      color: AppTheme.emeraldGreen,
                    ),
                    const SizedBox(width: 4),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatLocation(locationText!),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF5F6368),
                            height: 1.2,
                          ),
                        ),
                        Text(
                          'Noida, Uttar Pradesh',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w300, // 1 weight lighter
                            color: Color(
                              0xFF5F6368,
                            ).withValues(alpha: 0.52), // 8-10% lower opacity
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.keyboard_arrow_down,
                      size: 16,
                      color: Color(0xFF5F6368).withValues(alpha: 0.6),
                    ),
                  ],
                ),
              ),
            // Row 2: Household Overview (replaces greeting)
            Text(
              'Household overview',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.85),
                height: 1.2,
              ),
            ),
            const SizedBox(height: 4),
            // Row 3: Title + Actions (56-64px height)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Household Name - SECONDARY (with safe wrapping)
                Flexible(
                  child: Text(
                    "$householdName's Home",
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 26, // Reduced from 28 to 26 for better fit
                      fontWeight: FontWeight.w700,
                      color: theme.colorScheme.onSurface,
                      height: 1.1,
                    ),
                  ),
                ),
                // Right: Icon buttons - optically lowered by 2px
                Transform.translate(
                  offset: const Offset(0, 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      _buildIconButton(
                        context: context,
                        icon: Icons.notifications_outlined,
                        onTap: onNotificationTap,
                      ),
                      const SizedBox(width: 12),
                      _buildIconButton(
                        context: context,
                        icon: Icons.person_outline,
                        onTap: onProfileTap,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required BuildContext context,
    required IconData icon,
    VoidCallback? onTap,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFFCFCFA).withValues(
              alpha: 0.75,
            ), // Increased from 0.85 to 0.75 (7-8% more visible)
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.cardShadow,
          ),
          child: IconButton(
            icon: Icon(icon, size: 18, color: Color(0xFF5A5A5A)),
            onPressed: onTap,
            padding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
