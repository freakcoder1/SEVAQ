# SEVAQ FOUNDATION BUILD PROMPT

## Phase 1 — Foundation Layer (Use this prompt for Poolside)

```text
You are the lead Flutter architect for SevaQ.

Read and follow:

.plans/SEVAQ_DESIGN_SYSTEM.md
.plans/SEVAQ_COMPONENT_LIBRARY.md
.plans/SEVAQ_API_MAPPING.md
.plans/SEVAQ_SCREEN_INVENTORY.md

Goal:
Create the Flutter foundation only.

Tech Stack:

* Flutter
* Material 3
* Riverpod
* GoRouter
* Feature-first architecture

Requirements:

Create folder structure:

lib/

core/
theme/
router/
network/
constants/
utils/

shared/
widgets/
components/
models/

features/
auth/
home/
cooking/
cleaning/
bookings/
profile/

Tasks:

1. Create AppTheme
2. Create AppColors from design system
3. Create AppTypography
4. Create AppSpacing
5. Create AppRadius
6. Configure Material 3 theme
7. Configure GoRouter
8. Create route constants
9. Create Riverpod setup
10. Create app entry point

Do NOT create any UI screens.

Do NOT create business logic.

Do NOT create mock designs.

Output:
Production-ready Flutter foundation with clean architecture and file structure.
```

---

## Success Criteria

After Poolside finishes, you should have:

```
lib/
├── core/
├── shared/
├── features/
├── main.dart
```

and the app should:

* Compile
* Run
* Have theme configured
* Have router configured
* Have Riverpod configured

**No screens yet.**

---

## Next Prompt (After Foundation Phase)

```text
Build AUTH_01_Login

Use:

SEVAQ_DESIGN_SYSTEM.md
SEVAQ_COMPONENT_LIBRARY.md

Follow exact SevaQ design language.

Implement only AUTH_01_Login.

Do not touch any other screen.
```

---

## Notes

- Existing `frontend-flutter-house-help-master` uses `provider` package - migrate to Riverpod
- Existing `lib/theme.dart` has different colors - replace with SEVAQ_DESIGN_SYSTEM.md values
- Existing `lib/services/api_service.dart` - adapt to new `core/network/` layer
- Existing structure is flat - restructure to feature-first architecture