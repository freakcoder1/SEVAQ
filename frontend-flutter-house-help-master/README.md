# House Help Frontend

A premium cross-platform Flutter application for the House Help service.

## Prerequisites

- **Flutter SDK**: ^3.10.1
- **Dart SDK**: ^3.0.0
- **Android Studio / Xcode**: For mobile builds.

## Setup

1. **Install Dependencies**:
   ```bash
   flutter pub get
   ```

2. **Run the App**:
   ```bash
   # Web
   flutter run -d chrome

   # Android
   flutter run -d <device_id>

   # iOS
   flutter run -d <device_id>
   ```

## Building & Exporting

### Android (APK & App Bundle)

- **Debug APK**:
  ```bash
  flutter build apk --debug
  ```

- **Release APK (Fat APK)**:
  ```bash
  flutter build apk --release
  ```

- **Split APKs by Architecture** (reduces file size):
  ```bash
  flutter build apk --split-per-abi
  ```
  This generates separate APKs for `armeabi-v7a`, `arm64-v8a`, and `x86_64`.

- **Google Play App Bundle** (Recommended for Play Store):
  ```bash
  flutter build appbundle
  ```

### iOS (IPA)

-**Build for Simulation**:
  ```bash
  flutter build ios --simulator
  ```

- **Create Archive & IPA** (Requires a Mac and CocoaPods):
  1. Install pods: `cd ios && pod install && cd ..`
  2. Build:
     ```bash
     flutter build ios --release
     ```
  3. Distribute via Xcode: Open `Runner.xcworkspace`, go to **Product > Archive**, and follow the distribution wizard to export the IPA.

### Web

- **Production Build**:
  ```bash
  flutter build web --release
  ```
  The output will be in `build/web/`. You can host this on Firebase Hosting, Netlify, or Vercel.

## Advanced Configuration

### Proximity Search
Ensure you provide the user's latitude and longitude to the `WorkerProvider` search method to filter results by distance.

### Razorpay Integration
Update the API Key in `lib/screens/booking_screen.dart` before building for production.

## Support
MIT License. Created by the House Help Team.
