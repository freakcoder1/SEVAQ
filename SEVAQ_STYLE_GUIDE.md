# Sevaq Style Guide - Calm Authority Design System

## Core Visual Principles

### 1. Color Palette - Warm Neutrals & Soft Authority

#### Primary Colors
- **Primary Blue**: `#0061A4` (Authority, Trust)
- **Secondary Grey**: `#535F70` (Support, Calm)
- **Tertiary Purple**: `#6B5778` (Premium, Sophistication)

#### Background & Surface Colors
- **Background**: `#FEFBFF` (Warm White)
- **Surface**: `#FEFBFF` (Soft White)
- **Surface Variant**: `#F5F7FA` (Subtle Depth)
- **Primary Container**: `#E6F0FF` (Soft Authority)

#### Semantic Colors
- **Success**: `#2E7D32` (Confident Green)
- **Error**: `#BA1A1A` (Clear Warning)
- **Warning**: `#EF6C00` (Attention)
- **Info**: `#0277BD` (Guidance)

#### Text Colors
- **On Primary**: `#FFFFFF` (White)
- **On Secondary**: `#FFFFFF` (White)
- **On Surface**: `#1A1C1E` (Dark Charcoal)
- **On Surface Variant**: `#41484D` (Medium Grey)
- **Secondary Text**: `#6B7280` (Soft Grey)

### 2. Typography - Neutral Sans-Serif Authority

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: System UI, -apple-system, Segoe UI, Roboto
- **No decorative or playful fonts**

#### Font Weights
- **Regular**: 400 (Body text)
- **Medium**: 500 (Emphasis, buttons)
- **Semi-Bold**: 600 (Headers)
- **Bold**: 700 (Important headings)

#### Font Sizes
- **Display Large**: 57px (Hero text)
- **Display Medium**: 45px (Section headers)
- **Display Small**: 36px (Sub headers)
- **Headline Large**: 32px (Page titles)
- **Headline Medium**: 28px (Section titles)
- **Headline Small**: 24px (Card titles)
- **Title Large**: 22px (Button text)
- **Title Medium**: 16px (List items)
- **Title Small**: 14px (Labels)
- **Body Large**: 16px (Primary content)
- **Body Medium**: 14px (Secondary content)
- **Body Small**: 12px (Helper text)
- **Label Large**: 14px (Form labels)
- **Label Medium**: 12px (Small labels)
- **Label Small**: 11px (Micro text)

### 3. Spacing & Layout - 8px Grid System

#### Base Unit
- **Base Unit**: 8px
- **Multiples**: 4px, 8px, 16px, 24px, 32px, 40px, 48px, 56px, 64px

#### Component Spacing
- **Card Padding**: 16px (2 units)
- **Section Padding**: 24px (3 units)
- **Button Padding**: 12px vertical, 24px horizontal
- **Input Padding**: 16px horizontal, 12px vertical
- **List Item Padding**: 16px horizontal, 12px vertical

#### Margins
- **Component Margin**: 16px (2 units)
- **Section Margin**: 24px (3 units)
- **Grid Gutter**: 16px (2 units)

### 4. Shadows & Depth - Subtle Authority

#### Shadow System
- **Surface Shadow**: `0px 2px 8px rgba(0,0,0,0.08)` (Cards)
- **Elevation Shadow**: `0px 4px 12px rgba(0,0,0,0.12)` (Floating elements)
- **Focus Shadow**: `0px 0px 0px 3px rgba(0,97,164,0.25)` (Interactive focus)

#### Border Radius
- **Small**: 8px (Buttons, inputs)
- **Medium**: 12px (Cards, containers)
- **Large**: 16px (Hero elements)
- **Full**: 999px (Pills, badges)

### 5. Icons - Clear Communication

#### Icon Style
- **Line Icons**: 24px, stroke 2px
- **Fill Icons**: 24px, solid
- **Weight**: Medium (not too thin, not too bold)
- **Style**: Material Icons or custom line icons

#### Icon Colors
- **Primary**: `#0061A4` (Action icons)
- **Secondary**: `#535F70` (Information icons)
- **Success**: `#2E7D32` (Confirmation icons)
- **Error**: `#BA1A1A` (Warning icons)
- **Disabled**: `#A1A5A8` (Inactive icons)

### 6. Animations - Slow & Confident

#### Animation Principles
- **Duration**: 300-500ms (Slow, deliberate)
- **Easing**: `ease-in-out` (Smooth, not bouncy)
- **No spring or bounce animations**
- **Motion should feel "settled", not energetic**

#### Animation Types

##### 1. Fade Transitions
```css
/* Component fade in/out */
opacity: 0 → 1
duration: 300ms
easing: ease-in-out
```

##### 2. Slide Transitions
```css
/* Modal slide up */
transform: translateY(20px) → translateY(0)
duration: 350ms
easing: ease-in-out
```

##### 3. Scale Transitions
```css
/* Button press feedback */
transform: scale(1) → scale(0.98)
duration: 150ms
easing: ease-in-out
```

##### 4. Loading States
```css
/* Skeleton loading */
background: linear-gradient(90deg, #F5F7FA 25%, #E6F0FF 50%, #F5F7FA 75%)
animation: shimmer 1.5s infinite
```

### 7. Component Design - Calm Authority

#### Buttons
```css
/* Primary Button */
background: #0061A4
color: #FFFFFF
border-radius: 12px
padding: 12px 24px
font-weight: 500
box-shadow: 0px 4px 12px rgba(0,97,164,0.25)
transition: all 300ms ease-in-out

&:hover {
  background: #00538C
  transform: translateY(-1px)
  box-shadow: 0px 6px 16px rgba(0,97,164,0.35)
}

&:active {
  transform: translateY(0)
  box-shadow: 0px 2px 8px rgba(0,97,164,0.25)
}
```

#### Cards
```css
/* Surface Card */
background: #FEFBFF
border-radius: 12px
padding: 16px
box-shadow: 0px 2px 8px rgba(0,0,0,0.08)
border: 1px solid rgba(0,0,0,0.05)
transition: all 300ms ease-in-out

&:hover {
  box-shadow: 0px 4px 12px rgba(0,0,0,0.12)
  transform: translateY(-2px)
}
```

#### Inputs
```css
/* Text Input */
background: #F5F7FA
border: 1px solid #E1E5E9
border-radius: 12px
padding: 12px 16px
font-size: 16px
transition: all 300ms ease-in-out

&:focus {
  border-color: #0061A4
  box-shadow: 0px 0px 0px 3px rgba(0,97,164,0.25)
  background: #FFFFFF
}
```

#### Badges
```css
/* Status Badge */
background: #E6F0FF
color: #0061A4
border-radius: 999px
padding: 6px 12px
font-size: 12px
font-weight: 500
border: 1px solid rgba(0,97,164,0.2)
```

### 8. Micro-Interactions - Subtle Feedback

#### Loading States
- **Skeleton Loading**: Soft grey gradient animation
- **Progress Indicators**: Circular with smooth rotation
- **Status Updates**: Gentle fade transitions

#### State Changes
- **Success**: Green checkmark with gentle scale-in
- **Error**: Red warning with subtle shake
- **Confirmation**: Blue check with calm fade-in

#### Hover States
- **Buttons**: Slight lift and color darkening
- **Cards**: Gentle elevation increase
- **Links**: Underline with smooth transition

### 9. Accessibility - Inclusive Design

#### Color Contrast
- **Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **UI Elements**: Minimum 3:1 contrast ratio

#### Focus States
- **Visible Focus Ring**: 3px outline with 25% opacity
- **Focus Color**: Primary blue with transparency
- **No Keyboard Traps**: Logical tab order

#### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for interactive elements
- **Alt Text**: Meaningful descriptions for images

### 10. Responsive Design - Mobile First

#### Breakpoints
- **Mobile**: 0px - 768px (Primary focus)
- **Tablet**: 769px - 1024px
- **Desktop**: 1025px+ (Secondary)

#### Mobile Optimizations
- **Touch Targets**: Minimum 44px height
- **Gesture Support**: Swipe, tap, long-press
- **Performance**: Optimized animations and assets

### 11. Brand Voice in Visuals

#### Calm Authority Indicators
- **Stable Colors**: No bright reds or neon colors
- **Predictable Patterns**: Consistent layouts and interactions
- **Clear Hierarchy**: Obvious information structure
- **Subtle Motion**: Smooth, not jarring transitions

#### Trust Building Elements
- **System Status**: Always visible infrastructure health
- **Professional Imagery**: Neutral, non-distracting photos
- **Clear Communication**: No ambiguous visual metaphors
- **Consistent Experience**: Same patterns across all screens

This style guide ensures Sevaq maintains its calm, authoritative presence while providing a trustworthy and anxiety-free user experience. Every visual decision should be evaluated against these principles to maintain the brand's core promise of safety and reliability.