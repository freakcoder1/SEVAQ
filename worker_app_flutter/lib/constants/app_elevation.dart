/// Design token for elevation (shadows)
class AppElevation {
  AppElevation._();

  /// 0.0 - Flat (no shadow)
  static const double none = 0.0;

  /// 1.0 - Subtle (input fields, subtle containers)
  static const double sm = 1.0;

  /// 2.0 - Default (cards, list items)
  static const double md = 2.0;

  /// 4.0 - Elevated (FAB, raised buttons)
  static const double lg = 4.0;

  /// 6.0 - High (app bars, navigation bars)
  static const double xl = 6.0;

  /// 8.0 - Very high (modals, popups, dialogs)
  static const double xxl = 8.0;

  /// 12.0 - Maximum (fullscreen overlays)
  static const double xxxl = 12.0;
}
