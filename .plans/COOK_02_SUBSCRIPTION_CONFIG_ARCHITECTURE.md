# COOK_02_Subscription_Configuration Architecture Review (Final)

## 1. File Structure
```
lib/features/cooking/
├── presentation/
│   └── screens/
│       └── subscription_config_screen.dart
├── domain/
│   └── entities/
│       └── subscription_config_state.dart
└── providers/
    └── cooking_provider.dart (extend)
```

## 2. Widget Tree
```
Scaffold
├─ SafeArea
│  └─ Padding (AppSpacing.xl)
│     ├─ Column
│     │  ├─ Text ("Monthly Cooking Subscription")
│     │  ├─ SizedBox (AppSpacing.xs)
│     │  ├─ Text ("Tell us about your household so we can recommend the right cooking support.")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Text ("How many people need meals?")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ GridView (Selectable cards: 1, 2, 3, 4+)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ Text ("Which meals would you like covered?")
│     │  ├─ SizedBox (AppSpacing.sm)
│     │  ├─ Wrap (AppChips: Breakfast, Lunch, Dinner - multi-select)
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Live Plan Summary)
│     │  │  ├─ Text ("Plan Summary")
│     │  │  ├─ Text ("Persons: 3")
│     │  │  ├─ Text ("Meals:")
│     │  │  ├─ Row (✓ Breakfast)
│     │  │  ├─ Row (✓ Dinner)
│     │  │  └─ etc
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  ├─ AppCard (Service Guarantee)
│     │  │  ├─ Text ("Service Guarantee")
│     │  │  ├─ Text ("✓ Verified professionals")
│     │  │  ├─ Text ("✓ Managed replacements")
│     │  │  └─ Text ("✓ Quality monitoring")
│     │  ├─ SizedBox (AppSpacing.xl)
│     │  └─ AppButton ("Continue")
```

## 3. State Structure
```dart
class SubscriptionConfigState {
  final int persons;
  final List<MealType> selectedMeals;
  
  const SubscriptionConfigState({
    this.persons = 1,
    this.selectedMeals = const [],
  });

  bool get canContinue => persons >= 1 && selectedMeals.isNotEmpty;

  SubscriptionConfigState copyWith({int? persons, List<MealType>? selectedMeals}) {
    return SubscriptionConfigState(
      persons: persons ?? this.persons,
      selectedMeals: selectedMeals ?? this.selectedMeals,
    );
  }
}

enum MealType { breakfast, lunch, dinner }
```

## 4. Validation Rules
- Persons: Minimum 1, maximum 4 (represented as 4+)
- Meals: At least 1 meal type must be selected

## 5. Navigation Flow
```text
/cooking/subscription-config
↓
[Continue] valid form
↓
/cooking/schedule
```

## 6. CTA Logic
- Continue disabled until persons ≥ 1 AND meals selected
- No validation messages - clean disabled state only

## 7. Empty States
No empty states - all fields have defaults

## 8. Error States
None - configuration screen only

## Design Compliance
- ✅ Persons selector as larger selectable cards (GridView)
- ✅ Meal selector as AppChips in Wrap (multi-select)
- ✅ Live-updating Plan Summary with checkmarks
- ✅ Service Guarantee in AppCard
- ✅ No scheduling, dates, calendar, payment