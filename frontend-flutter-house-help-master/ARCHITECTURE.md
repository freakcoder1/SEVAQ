# Flutter App Architecture Documentation

## Table of Contents

1. [The Problem](#1-the-problem)
2. [The Solution Architecture](#2-the-solution-architecture)
3. [Golden Rules](#3-golden-rules)
4. [Code Examples](#4-code-examples)
5. [Debugging Guide](#5-debugging-guide)
6. [File Reference Guide](#6-file-reference-guide)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. The Problem

### What is ProviderNotFoundException?

`ProviderNotFoundException` is a runtime error thrown by the `provider` package when a widget attempts to access a provider using `context.watch<T>()`, `context.read<T>()`, or `context.select<T>()` but no provider of type `T` exists in the widget tree above that widget.

The error message typically looks like:
```
ProviderNotFoundException: Provider of type AuthProvider was not found in the widget tree.
Ensure you have a ChangeNotifierProvider<AuthProvider> above this widget.
```

### Why It Occurs (Tree Topology Violations)

The Flutter widget tree has a hierarchical structure where each widget has exactly one parent (except the root). Providers work on the same principle - they must be **ancestors** in the widget tree for descendant widgets to access them.

A **tree topology violation** occurs when:

1. **Navigator.push creates a new route outside provider scope**: When you use `Navigator.push()`, Flutter creates a new route that sits **outside** the original widget tree. Any providers defined above `MaterialApp` (like in `main.dart`) are not ancestors of widgets in this new route.

2. **Incorrect widget hierarchy**: A widget that needs a provider is placed in a part of the tree where that provider is not an ancestor.

**Example of the problem:**
```
MultiProvider (in main.dart)
└── AuthWrapper (home)
    └── Navigator
        └── LoginScreen
                └── Navigator.push(MainScreen)  ← NEW ROUTE, outside MultiProvider!
                    └── MainNavigation
                        └── Consumer<AuthProvider>  ← ERROR! No AuthProvider above
```

### Why "Move Provider Up" Doesn't Always Fix It

Many developers try to solve this by:

1. **Creating a new MultiProvider higher up** - This doesn't work because `Navigator.push` creates a completely separate route container that isn't a descendant of any widget in the original tree.

2. **Using nested providers** - Adding more providers at the same level still doesn't help because the pushed route is in a different part of the tree.

**The fundamental issue**: You cannot fix a tree topology violation by moving providers around. You must fix the **navigation pattern** itself.

---

## 2. The Solution Architecture

### Widget Tree Diagram (Correct Structure)

```
MaterialApp (no home set)
└── MultiProvider (providers defined here)
    ├── ChangeNotifierProvider<AuthProvider>
    ├── ChangeNotifierProvider<LocationProvider>
    └── ...other providers
        └── AuthWrapper (home)
            ├── LoginScreen (when !authenticated)
            ├── LocationFirstSplashScreen (when authenticated but no location)
            └── MainNavigation (when authenticated + location set)
                ├── HomeScreen
                ├── HistoryScreen
                └── ProfileScreen
```

**Key insight**: All screens remain **within** the MultiProvider ancestor. Navigation happens through **state-driven rebuilding**, not `Navigator.push`.

### Role of AuthWrapper as the "Gatekeeper"

[`AuthWrapper`](lib/screens/auth_wrapper.dart) is the **single entry point** for the app after the splash screen. It:

1. **Watches both AuthProvider and LocationProvider** for state changes
2. **Determines which screen to display** based on the combined state:
   - Loading → Show loading screen
   - Not authenticated → Show LoginScreen
   - Authenticated but no location → Show LocationFirstSplashScreen
   - Authenticated + location set → Show MainNavigation
3. **Triggers automatic transitions** when state changes (via `notifyListeners`)

**AuthWrapper is NOT instantiated via Navigator.push** - it's set as the `home` of MaterialApp and stays in the tree.

### Why Navigation Shells Must Not Consume Auth Providers

[`MainNavigation`](lib/screens/main_navigation.dart) is a **pure navigation shell** that:

- Handles tab-based navigation only
- Does NOT watch or consume any auth/location providers
- Does NOT make any decisions about whether to show login or location screens
- Simply displays the current tab's content

This separation of concerns is critical because:

1. **MainNavigation is always created by AuthWrapper** under provider scope
2. **It doesn't need to know about auth state** - that's AuthWrapper's job
3. **It can't cause ProviderNotFoundException** because it doesn't consume providers

### How State-Driven Navigation Works

Instead of using `Navigator.push()` to navigate between top-level screens, the app uses **state-driven navigation**:

1. **State change occurs**: User logs in, sets location, logs out, etc.
2. **Provider calls notifyListeners()**: The AuthProvider or LocationProvider notifies listeners
3. **AuthWrapper rebuilds**: It watches the providers and rebuilds when state changes
4. **Different screen is returned**: AuthWrapper now returns a different widget
5. **Flutter handles the transition**: The Navigator automatically switches screens

```dart
// In AuthWrapper - this is how navigation works
@override
Widget build(BuildContext context) {
  final auth = context.watch<AuthProvider>();
  final locationProvider = context.watch<LocationProvider>();

  if (!auth.isAuthenticated) {
    return LoginScreen();  // Shows login
  }

  if (locationProvider.needsLocationSetup()) {
    return LocationFirstSplashScreen();  // Shows location setup
  }

  return MainNavigation();  // Shows main app - NO push needed!
}
```

---

## 3. Golden Rules

These rules MUST be followed to avoid ProviderNotFoundException:

### ✅ Rule 1: AuthWrapper Must NEVER Be Instantiated via Navigator.push

**WRONG:**
```dart
Navigator.push(context, MaterialPageRoute(builder: (_) => AuthWrapper()));
```

**CORRECT:**
```dart
// In main.dart - AuthWrapper is the home
MaterialApp(
  home: const AuthWrapper(),
);
```

### ✅ Rule 2: Never Push MainScreen or MainNavigation Directly

**WRONG:**
```dart
// After login
Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => MainNavigation()));
```

**CORRECT:**
```dart
// After login - just call notifyListeners, AuthWrapper will rebuild
await authProvider.login(email, password);
// AuthWrapper watches auth.isAuthenticated and automatically shows MainNavigation
```

### ✅ Rule 3: Use Navigator.pop() to Return to AuthWrapper

**WRONG:**
```dart
// Trying to "go back" to authentication flow
Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => AuthWrapper()));
```

**CORRECT:**
```dart
// After logout - pop back to AuthWrapper
await authProvider.logout();
Navigator.of(context).pop();  // Returns to AuthWrapper, which will rebuild
```

### ✅ Rule 4: Navigation Shells Must Be Pure (No Auth/Location Logic)

**WRONG:**
```dart
class MainNavigation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // DO NOT do this - MainNavigation should be pure
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuthenticated) return LoginScreen();
    // ...
  }
}
```

**CORRECT:**
```dart
class MainNavigation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Pure navigation - only handles tab switching
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(...),
    );
  }
}
```

### ✅ Rule 5: All Screens Must Remain Under MultiProvider Ancestor

**WRONG:**
```dart
// Any screen pushed outside MultiProvider scope
Navigator.push(context, MaterialPageRoute(builder: (_) => SomeScreen()));
```

**CORRECT:**
- Use AuthWrapper as home
- Let state changes drive navigation
- If you need dialogs/modals, use `showDialog()` which remains in tree
- If you need new screens, use `Navigator.push()` only for screens INSIDE MainNavigation (like detail views)

---

## 4. Code Examples

### ✅ CORRECT: Using AuthWrapper as Home

**File:** [`lib/main.dart`](lib/main.dart)

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        // ... other providers
      ],
      child: const SevaqApp(),
    ),
  );
}

class SevaqApp extends StatelessWidget {
  const SevaqApp({super.key});

  @override
  Widget build(BuildContext context) {
    final isDarkMode = context.watch<ThemeProvider>().isDarkMode;

    return MaterialApp(
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: const AuthWrapper(),  // ✅ AuthWrapper is home
    );
  }
}
```

### ❌ WRONG: Pushing MainScreen Directly

```dart
// WRONG - This causes ProviderNotFoundException
class LoginScreen extends StatelessWidget {
  Future<void> _handleLogin() async {
    await authProvider.login(email, password);
    
    // WRONG: This creates a new route outside provider scope
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => MainNavigation()),
    );
  }
}
```

**Correct approach:**
```dart
class LoginScreen extends StatelessWidget {
  Future<void> _handleLogin() async {
    await authProvider.login(email, password);
    // No Navigator call needed - AuthWrapper will rebuild and show MainNavigation
  }
}
```

### ✅ CORRECT: Using pop() in Location Setup

**File:** [`lib/screens/location_first_splash_screen.dart`](lib/screens/location_first_splash_screen.dart)

```dart
// After location is successfully set, just pop back to AuthWrapper
// AuthWrapper will rebuild and show MainNavigation
Navigator.of(context).pop();
```

### ❌ WRONG: Consumer<AuthProvider> in Navigation Shell

```dart
// WRONG - MainNavigation should be pure
class MainNavigation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(  // ❌ WRONG
      builder: (context, auth, _) {
        if (!auth.isAuthenticated) {
          return LoginScreen();
        }
        return Scaffold(...);
      },
    );
  }
}
```

**Correct approach:**
```dart
// MainNavigation is only shown when user IS authenticated
// AuthWrapper guarantees this by only returning MainNavigation when appropriate
class MainNavigation extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(...),
    );
  }
}
```

---

## 5. Debugging Guide

### How to Use Provider Diagnostics

If you have a [`provider_diagnostics.dart`](lib/utils/provider_diagnostics.dart) utility, use it to validate provider scope:

```dart
import 'utils/provider_diagnostics.dart';

// Add this in your widget's build method for debugging
@override
Widget build(BuildContext context) {
  ProviderDiagnostics.validateProviderScope<AuthProvider>(context);
  ProviderDiagnostics.validateProviderScope<LocationProvider>(context);
  
  // ... rest of build
}
```

### Common Error Patterns and How to Fix Them

#### Pattern 1: "ProviderNotFoundException" after Navigation

**Error:**
```
ProviderNotFoundException: Provider of type AuthProvider was not found
```

**Cause:** You pushed a screen using `Navigator.push()` outside the provider tree.

**Fix:**
1. Don't push MainNavigation or AuthWrapper
2. Let AuthWrapper handle navigation via state changes
3. If you need to show a screen, check if it should be a child of MainNavigation

#### Pattern 2: Loading Screen Never Shows Main Screen

**Problem:** User logs in but the screen doesn't change.

**Cause:** AuthProvider or LocationProvider not calling `notifyListeners()`.

**Fix:**
```dart
// In your provider
Future<bool> login(String email, String password) async {
  isLoading = true;
  notifyListeners();  // ✅ This triggers AuthWrapper rebuild
  
  try {
    // ... login logic
    isAuthenticated = true;
    notifyListeners();  // ✅ This triggers AuthWrapper to show MainNavigation
    return true;
  } catch (e) {
    isLoading = false;
    notifyListeners();
    return false;
  }
}
```

#### Pattern 3: Location Setup Completes but Stays on Splash Screen

**Problem:** User sets location but the app doesn't navigate to MainNavigation.

**Cause:** LocationProvider not calling `notifyListeners()` after location is set.

**Fix:**
```dart
// In LocationProvider
Future<void> setUserLocation(Location location) async {
  _userLocation = location;
  notifyListeners();  // ✅ This triggers AuthWrapper rebuild
}
```

### How to Identify Scope Violations

1. **Check widget tree**: Use Flutter DevTools → Widget Inspector
2. **Look for**: Routes pushed outside MultiProvider
3. **Verify**: All screens that consume providers have MultiProvider as ancestor

**Quick debug widget:**
```dart
class ProviderScopeDebug extends StatelessWidget {
  final Widget child;

  const ProviderScopeDebug({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    try {
      context.read<AuthProvider>();
      context.read<LocationProvider>();
      return child;
    } catch (e) {
      return ErrorWidget("Provider scope violation: $e");
    }
  }
}
```

---

## 6. File Reference Guide

### Core Architecture Files

| File | Role |
|------|------|
| [`lib/main.dart`](lib/main.dart) | Provider setup and app entry point. Sets AuthWrapper as home. |
| [`lib/screens/auth_wrapper.dart`](lib/screens/auth_wrapper.dart) | Gatekeeper widget that determines which screen to show based on auth/location state. |
| [`lib/screens/main_navigation.dart`](lib/screens/main_navigation.dart) | Pure navigation shell for tab-based navigation. No auth/location logic. |
| [`lib/screens/login_screen.dart`](lib/screens/login_screen.dart) | Login UI. Triggers login but doesn't handle navigation. |
| [`lib/screens/location_first_splash_screen.dart`](lib/screens/location_first_splash_screen.dart) | Location setup flow. Uses `pop()` to return to AuthWrapper. |

### Provider Files

| File | Role |
|------|------|
| [`lib/providers/auth_provider.dart`](lib/providers/auth_provider.dart) | Manages authentication state. Calls `notifyListeners()` on state changes. |
| [`lib/providers/location_provider.dart`](lib/providers/location_provider.dart) | Manages location state. Calls `notifyListeners()` when location is set. |
| [`lib/providers/theme_provider.dart`](lib/providers/theme_provider.dart) | Manages theme state. |
| [`lib/providers/user_provider.dart`](lib/providers/user_provider.dart) | Manages user profile data. |
| [`lib/providers/booking_provider.dart`](lib/providers/booking_provider.dart) | Manages bookings. |
| [`lib/providers/review_provider.dart`](lib/providers/review_provider.dart) | Manages reviews. |
| [`lib/providers/service_provider.dart`](lib/providers/service_provider.dart) | Manages services. |
| [`lib/providers/worker_provider.dart`](lib/providers/worker_provider.dart) | Manages workers. |
| [`lib/providers/slot_provider.dart`](lib/providers/slot_provider.dart) | Manages time slots. |

### Screen Files

| File | Role |
|------|------|
| [`lib/screens/home_screen.dart`](lib/screens/home_screen.dart) | Home tab content. Can consume any provider. |
| [`lib/screens/history_screen.dart`](lib/screens/history_screen.dart) | Bookings history. Can consume any provider. |
| [`lib/screens/profile_screen.dart`](lib/screens/profile_screen.dart) | User profile. Can consume any provider. |

### Utility Files (if exists)

| File | Role |
|------|------|
| [`lib/utils/provider_diagnostics.dart`](lib/utils/provider_diagnostics.dart) | Debug utilities for validating provider scope. |

---

## 7. Testing Checklist

### Cold Start Test

1. ✅ Fresh app start shows AuthWrapper
2. ✅ If not logged in → shows LoginScreen
3. ✅ If logged in but no location → shows LocationFirstSplashScreen
4. ✅ If logged in with location → shows MainNavigation
5. ✅ No ProviderNotFoundException errors

### Authentication Flow Test

1. ✅ On LoginScreen, enter credentials
2. ✅ After successful login, screen transitions to LocationFirstSplashScreen (if no location) or MainNavigation (if location exists)
3. ✅ Login button is disabled during loading
4. ✅ Error messages display correctly for failed login
5. ✅ No ProviderNotFoundException during transition

### Location Setup Flow Test

1. ✅ On LocationFirstSplashScreen, location picker displays
2. ✅ After selecting location, tap "Continue"
3. ✅ Loading indicator shows briefly
4. ✅ Screen transitions to MainNavigation
5. ✅ No ProviderNotFoundException during transition
6. ✅ Location persists after app restart

### Tab Navigation Test

1. ✅ MainNavigation shows bottom navigation bar
2. ✅ Tapping tabs switches between HomeScreen, HistoryScreen, ProfileScreen
3. ✅ All screens can access providers (test by displaying user name, location, etc.)
4. ✅ Tab state persists during navigation within tabs (using IndexedStack)

### Logout Flow Test

1. ✅ From ProfileScreen, tap logout button
2. ✅ AuthProvider.logout() is called
3. ✅ Navigator.pop() is called to return to AuthWrapper
4. ✅ AuthWrapper rebuilds and shows LoginScreen
5. ✅ No ProviderNotFoundException during transition
6. ✅ Can log in again successfully

### Edge Cases

1. ✅ Press back button on LoginScreen exits app (correct Android behavior)
2. ✅ Press back button on LocationFirstSplashScreen exits app
3. ✅ Press back button on MainNavigation shows exit confirmation dialog
4. ✅ Screen rotation works correctly
5. ✅ Deep link handling (if implemented) respects provider scope

---

## Summary

The key to avoiding ProviderNotFoundException is understanding that:

1. **Navigation via `Navigator.push()` creates new routes outside the original widget tree**
2. **Providers only work when they're ancestors in the widget tree**
3. **The solution is state-driven navigation, not imperative navigation**

By following the architecture where:
- **AuthWrapper** is the single entry point (set as `home` in MaterialApp)
- **AuthWrapper** watches providers and determines which screen to show
- **State changes trigger automatic transitions** (no Navigator calls needed for top-level screens)
- **Navigation shells remain pure** (no auth/location logic)

...you can build a robust Flutter app that never encounters ProviderNotFoundException.

---

*Document generated as part of ProviderNotFoundException fix. See [FIX_PLAN.md](FIX_PLAN.md) and [PROVIDER_SOLUTION_SUMMARY.md](PROVIDER_SOLUTION_SUMMARY.md) for more details.*
