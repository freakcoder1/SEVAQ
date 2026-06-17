enum MealType { breakfast, lunch, dinner }

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