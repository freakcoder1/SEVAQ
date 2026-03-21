# SEVAQ Subscription Display Implementation Plan

## Objective
Show users their active subscriptions immediately after booking in the "Your services" (Bookings) tab, providing instant feedback that their subscription was created successfully.

## Current State
- Backend has `GET /api/subscriptions` endpoint (fetches all or by ID)
- Frontend has `ApiService.getSubscriptions()` method
- HistoryScreen only displays individual bookings from `BookingProvider`
- Subscriptions generate future bookings through a scheduler (not immediately)

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Subscription Display Flow                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User completes subscription payment                                  │
│         ↓                                                             │
│  Navigate to SubscriptionConfirmationScreen                          │
│         ↓                                                             │
│  User taps "Go to My Services"                                        │
│         ↓                                                             │
│  HistoryScreen loads                                                 │
│         ↓                                                             │
│  Fetch bookings AND user subscriptions in parallel                   │
│         ↓                                                             │
│  Display "My Subscriptions" section at top                           │
│  Display bookings grouped by date below                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Add Backend Endpoint for User Subscriptions
**File**: `flutter-nest-househelp-master/src/subscriptions/subscriptions.controller.ts`

```typescript
// Add this endpoint to subscriptions.controller.ts
@Get('user/:userId')
async getUserSubscriptions(@Param('userId') userId: string) {
  return this.subscriptionsService.findByUserId(userId);
}
```

**File**: `flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts`

```typescript
// Add this method
async findByUserId(userId: string): Promise<Subscription[]> {
  return this.subscriptionRepository.find({
    where: { userId },
    relations: ['serviceProfile', 'serviceProfile.service'],
    order: { createdAt: 'DESC' }
  });
}
```

### Step 2: Add Frontend API Method
**File**: `frontend-flutter-house-help-master/lib/services/api_service.dart`

```dart
Future<dynamic> getUserSubscriptions(String userId) async {
  return await get('subscriptions/user/$userId');
}
```

### Step 3: Create Subscription Model
**File**: `frontend-flutter-house-help-master/lib/models/subscription.dart`

```dart
class Subscription {
  final String id;
  final String userId;
  final String serviceProfileId;
  final String status;
  final DateTime startDate;
  final String preferredTimeWindow;
  final double amount;
  final String serviceName;
  
  Subscription({
    required this.id,
    required this.userId,
    required this.serviceProfileId,
    required this.status,
    required this.startDate,
    required this.preferredTimeWindow,
    required this.amount,
    required this.serviceName,
  });
  
  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      serviceProfileId: json['serviceProfileId'] ?? '',
      status: json['status'] ?? 'UNKNOWN',
      startDate: json['startDate'] != null 
          ? DateTime.parse(json['startDate']) 
          : DateTime.now(),
      preferredTimeWindow: json['preferredTimeWindow'] ?? 'morning',
      amount: (json['amount'] ?? 0).toDouble(),
      serviceName: json['serviceProfile']?['service']?['name'] ?? 'Service',
    );
  }
}
```

### Step 4: Update BookingProvider to Include Subscriptions
**File**: `frontend-flutter-house-help-master/lib/providers/booking_provider.dart`

```dart
class BookingProvider with ChangeNotifier {
  List<Booking> _bookings = [];
  List<Subscription> _subscriptions = [];
  bool _isLoading = false;
  
  List<Booking> get bookings => _bookings;
  List<Subscription> get subscriptions => _subscriptions;
  bool get isLoading => _isLoading;
  
  Future<void> fetchBookingsAndSubscriptions() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      // Fetch both in parallel
      final bookingsFuture = _apiService.getMyBookings();
      final userId = await _authService.getCurrentUserId();
      final subscriptionsFuture = _apiService.getUserSubscriptions(userId);
      
      final bookingsResponse = await bookingsFuture;
      final subscriptionsResponse = await subscriptionsFuture;
      
      if (bookingsResponse != null) {
        _bookings = (bookingsResponse['bookings'] as List)
            .map((b) => Booking.fromJson(b))
            .toList();
      }
      
      if (subscriptionsResponse != null) {
        _subscriptions = (subscriptionsResponse as List)
            .map((s) => Subscription.fromJson(s))
            .toList();
      }
    } catch (e) {
      debugPrint('Error fetching data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### Step 5: Update HistoryScreen to Display Subscriptions
**File**: `frontend-flutter-house-help-master/lib/screens/history_screen.dart`

```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    appBar: AppBar(title: Text('Your services')),
    body: Column(
      children: [
        PreServiceReminderBanner(),
        Expanded(
          child: Consumer<BookingProvider>(
            builder: (context, provider, _) {
              if (provider.isLoading) {
                return Center(child: CircularProgressIndicator());
              }
              
              // Show subscriptions section if any exist
              if (provider.subscriptions.isNotEmpty) {
                return _buildSubscriptionsAndBookingsList(provider);
              }
              
              // Original bookings-only view
              if (provider.bookings.isEmpty) {
                return Center(child: Text('No services found.'));
              }
              
              return _buildBookingsList(provider.bookings);
            },
          ),
        ),
      ],
    ),
  );
}

Widget _buildSubscriptionsAndBookingsList(BookingProvider provider) {
  return ListView(
    children: [
      // Subscriptions Section
      _buildSubscriptionsSection(provider.subscriptions),
      Divider(height: 24),
      // Bookings Section
      _buildBookingsSection(provider.bookings),
    ],
  );
}

Widget _buildSubscriptionsSection(List<Subscription> subscriptions) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Text(
          'My Subscriptions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.purple[800],
          ),
        ),
      ),
      ...subscriptions.map((sub) => _buildSubscriptionCard(sub)),
    ],
  );
}

Widget _buildSubscriptionCard(Subscription subscription) {
  return Card(
    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    color: Colors.purple[50],
    child: ListTile(
      leading: Icon(Icons.autorenew, color: Colors.purple[700]),
      title: Text(
        subscription.serviceName,
        style: TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('₹${subscription.amount.toInt()}/month'),
          Text('Starting ${DateFormat('MMM d, yyyy').format(subscription.startDate)}'),
        ],
      ),
      trailing: Chip(
        label: Text(subscription.status),
        backgroundColor: subscription.status == 'ACTIVE' 
            ? Colors.green[100] 
            : Colors.grey[200],
        labelStyle: TextStyle(
          color: subscription.status == 'ACTIVE' 
              ? Colors.green[800] 
              : Colors.grey[700],
        ),
      ),
    ),
  );
}
```

## Files to Modify

| File | Change |
|------|--------|
| `flutter-nest-househelp-master/src/subscriptions/subscriptions.controller.ts` | Add `GET /subscriptions/user/:userId` endpoint |
| `flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts` | Add `findByUserId()` method |
| `frontend-flutter-house-help-master/lib/services/api_service.dart` | Add `getUserSubscriptions()` method |
| `frontend-flutter-house-help-master/lib/models/subscription.dart` | Create new model file |
| `frontend-flutter-house-help-master/lib/providers/booking_provider.dart` | Add subscriptions support |
| `frontend-flutter-house-help-master/lib/screens/history_screen.dart` | Display subscriptions section |

## Testing Checklist

- [ ] Backend endpoint returns user subscriptions correctly
- [ ] Frontend API call fetches subscriptions
- [ ] Subscription cards display with correct information
- [ ] Subscriptions appear at top of Bookings tab
- [ ] Existing bookings still display correctly below subscriptions
- [ ] Empty state shows when no subscriptions and no bookings

## Expected User Experience

1. User completes subscription payment
2. User sees confirmation screen with "Go to My Services" button
3. User taps button, navigates to Bookings tab
4. User immediately sees:
   - "My Subscriptions" section at top with their new subscription
   - Subscription card shows service name, price, start date, and ACTIVE status
   - Any existing bookings displayed below
5. User gets immediate feedback that subscription was created successfully
