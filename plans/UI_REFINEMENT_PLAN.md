# UI Refinement Plan - Professional Execution Phase

## Overview
The design direction is correct. Now solving: **layout engineering** and **professional UI execution**.

**Current Status**: 70% of the way to a genuinely premium product
**Previous Status**: 20%

---

## Critical Issues to Fix

### 1. HERO SECTION - CONTAINMENT FIX (CRITICAL)

**Current Problems:**
- Title too large
- Hero too short
- Subtitle clipped
- CTA positioned outside hero
- Internal spacing mathematically impossible

**EXACT FIX:**

| Property | Value |
|----------|-------|
| Height | 220px EXACTLY (fixed, not minHeight) |
| Padding | top: 20, left: 20, right: 20, bottom: 20 |
| Content Structure | PILL → 12px gap → TITLE → 8px gap → SUBTITLE → Spacer() → CTA |

**Title:**
- Font size: 26px
- Weight: 700
- Line height: 30px
- Max lines: 2
- Text: "Managed support for your home."

**Subtitle:**
- 15px medium
- Opacity: 0.9 white
- Text: "Managed by Sevaq."

**CTA:**
- Height: 40px
- Padding horizontal: 18px
- Radius: 20px
- Position: BOTTOM LEFT INSIDE HERO
- Margin bottom: 0
- NO negative positioning

---

### 2. HEADER - SIZE REDUCTION

| Property | Current | Fix |
|----------|---------|-----|
| Title | ~34px | 30px |
| Icon container | too large | 40x40 EXACT |

---

### 3. ACTIVE HOUSEHOLD OPERATIONS

| Property | Current | Fix |
|----------|---------|-----|
| Card height | ~140px | 118px |
| Card padding | - | 18px |
| Bottom padding | insufficient | 20px minimum |

---

### 4. SHADOWS - REMOVE HARSH SHADOWS

**Current:** Flutter template, cheap neumorphism, fake depth

**Fix:**
- Blur: 24
- Opacity: 0.04
- Y: 8

---

### 5. SOCIETY INTELLIGENCE

- Increase right visualization opacity slightly (currently too faint)

---

### 6. HOUSEHOLD SUPPORT SECTION

| Property | Current | Fix |
|----------|---------|-----|
| Card height | too tall | 108px |
| Subtitle | too long | MAX 1 line |
| Icon size | too large | 20px |

---

### 7. FLOATING NAVIGATION

| Property | Current | Fix |
|----------|---------|-----|
| Height | - | 68px |
| Radius | - | 24px |
| Bottom | - | 12px |
| Active pill | too large | Reduce width by 20% |

---

### 8. TONAL HIERARCHY - REDUCE PURE WHITE

**Current:** UI feels cheap due to too much pure white

**Fix:**
- Background: #F7F8F7
- Primary surfaces: #FFFFFF
- Secondary surfaces: #FAFAF8

---

### 9. ATMOSPHERIC PREMIUM FEEL

**Current:** Technically correct but emotionally flat

**Add (VERY subtle):**
- Ambient radial gradients
- Soft noise
- Intelligent operational glow
- Layered atmospheric lighting

---

### 10. CONTINUOUS ENVIRONMENT

**Current:** Sections feel independent

**Fix:**
- Reduce harsh section separations
- Reduce excessive gaps
- Reduce independent card feeling
- Create FLOW

---

## Implementation Order

1. **Hero Section** - Fix containment (height, padding, CTA)
2. **Header** - Size reduction
3. **Active Operations** - Card height and padding
4. **Shadows** - Standardize across all components
5. **Society Intelligence** - Opacity adjustment
6. **Household Support** - Card refinements
7. **Floating Navigation** - Size and position
8. **Tonal Hierarchy** - Background colors
9. **Atmospheric Effects** - Subtle gradients and glow
10. **Continuous Flow** - Section gap reduction

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/widgets/operational_hero.dart` | Height 220px, padding 20px, CTA 40px, title/subtitle text |
| `lib/widgets/floating_navigation.dart` | Height 68px, radius 24px, bottom 12px |
| `lib/widgets/active_operations.dart` | Card height 118px, padding 18px, bottom 20px |
| `lib/widgets/household_support.dart` | Card height 108px, icon 20px |
| `lib/theme.dart` | Tonal colors, shadow standardization |
| `lib/home_screen.dart` | Section gaps, background color |

---

## Success Metrics

- [ ] No text overflow
- [ ] CTA stays inside hero
- [ ] Sections don't collide
- [ ] Spacing feels stable
- [ ] Premium atmospheric feel
- [ ] Continuous environment (not component-based)