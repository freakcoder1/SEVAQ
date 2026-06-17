import 'package:go_router/go_router.dart';
import '../constants/app_routes.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/otp_screen.dart';
import '../../features/auth/presentation/screens/profile_setup_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/cooking/presentation/screens/service_details_screen.dart';
import '../../features/cooking/presentation/screens/subscription_config_screen.dart';
import '../../features/cooking/presentation/screens/subscription_schedule_screen.dart';
import '../../features/cooking/presentation/screens/review_plan_screen.dart';
import '../../features/cooking/presentation/screens/checkout_screen.dart';
import '../../features/cooking/presentation/screens/payment_screen.dart';
import '../../features/cooking/presentation/screens/confirmation_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: AppRoutes.login,
    routes: [
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.otp,
        name: 'otp',
        builder: (context, state) => const OtpScreen(),
      ),
      GoRoute(
        path: AppRoutes.profileSetup,
        name: 'profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.cooking,
        name: 'cooking',
        builder: (context, state) => const ServiceDetailsScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingSubscriptionConfig,
        name: 'cooking-subscription-config',
        builder: (context, state) => const SubscriptionConfigScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingSubscriptionSchedule,
        name: 'cooking-subscription-schedule',
        builder: (context, state) => const SubscriptionScheduleScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingReviewPlan,
        name: 'cooking-review',
        builder: (context, state) => const ReviewPlanScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingCheckout,
        name: 'cooking-checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingPayment,
        name: 'cooking-payment',
        builder: (context, state) => const PaymentScreen(),
      ),
      GoRoute(
        path: AppRoutes.cookingConfirmation,
        name: 'cooking-confirmation',
        builder: (context, state) => const ConfirmationScreen(),
      ),
    ],
  );
}