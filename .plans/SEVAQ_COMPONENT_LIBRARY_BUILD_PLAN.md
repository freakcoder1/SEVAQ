# SEVAQ COMPONENT LIBRARY BUILD PLAN

## Goal
Build reusable design system components in `shared/components/` using SevaQ design tokens.

## Components to Create

### 1. AppButton (`app_button.dart`)
**Primary CTA:**
- Full width
- Green background (#1A5D49)
- White text
- 56 height
- 16 border radius
- Theme-driven

**Secondary CTA:**
- Outlined style
- White background
- Green border (#1A5D49)
- 56 height
- 16 border radius

### 2. AppTextField (`app_text_field.dart`)
- Filled style (background: #F5F6F6)
- 16 border radius
- No heavy borders
- Focus ring with primary green at 25% opacity

### 3. AppCard (`app_card.dart`)
- Minimal style
- No shadows
- Border using #E8ECEB
- 20 border radius for cards
- Theme-driven surface color

### 4. AppSectionHeader (`app_section_header.dart`)
- Contains: Back button + Title
- Optional: Subtitle
- Uses Inter typography (SemiBold 24 for title)
- Theme surface background

### 5. AppChip (`app_chip.dart`)
- 14 border radius
- Background: #EAF5F1 (primary green light)
- Selected: #1A5D49 (primary green)
- Spacing: horizontal 8, vertical 4

### 6. AppLoading (`app_loading.dart`)
- Calm, professional loading indicator
- Uses primary green color
- No bounce/elastic animations (per design system)

## Implementation Rules

1. **Stateless where possible** - All components extend StatelessWidget
2. **Theme-driven** - All colors, spacing, radius come from design tokens
3. **No business logic** - Pure UI components only
4. **No service-specific content** - Generic, reusable components
5. **Material 3** - Use Material 3 widgets and theming

## Design Token References

From `SEVAQ_DESIGN_SYSTEM.md`:
- Primary Green: #1A5D49
- Primary Green Light: #EAF5F1
- Background: #FAFAFA
- Surface: #FFFFFF
- Border: #E8ECEB
- Text Primary: #111111
- Text Secondary: #666666

From `SEVAQ_COMPONENT_LIBRARY.md`:
- Primary CTA: 56 height, full width
- Secondary CTA: Outlined
- Inputs: Filled style, 16 radius
- Cards: 20 radius, no shadows
- Chips: 14 radius

## File Output

```
lib/shared/components/
├── app_button.dart
├── app_text_field.dart
├── app_card.dart
├── app_section_header.dart
├── app_chip.dart
└── app_loading.dart
```

## Build Order

1. AppButton - Most used component
2. AppTextField - Form inputs
3. AppCard - Containers
4. AppSectionHeader - Navigation headers
5. AppChip - Selection chips
6. AppLoading - Feedback state