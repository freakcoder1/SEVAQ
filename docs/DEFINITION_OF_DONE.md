# Definition of Done - SevaQ Screens

Every screen must satisfy these criteria before merge:

## Code Quality
- [ ] `flutter analyze` passes with no issues
- [ ] `dart format --set-exit-if-changed .` passes
- [ ] `flutter test` passes for affected tests

## Design System
- [ ] Uses only AppSpacing tokens (no hardcoded spacing)
- [ ] Uses only AppColors tokens (no hardcoded colors)
- [ ] Uses only AppRadius tokens (no hardcoded radii)
- [ ] Uses shared components only (no duplicated widgets)
- [ ] Button height = 56px (AppButton)
- [ ] Input height = 56px (AppTextField)

## Loading & Error States
- [ ] Loading state wrapped inside CTA button
- [ ] Inline error message displayed when state.error != null
- [ ] Empty state handled for lists/API data
- [ ] All async actions have retry support

## Navigation
- [ ] Back navigation works correctly
- [ ] Deep links handled if applicable
- [ ] No duplicate submissions allowed

## Documentation
- [ ] Screen documented in `docs/SCREEN_INVENTORY.md`
- [ ] State transitions documented if complex