# Sevaq Screens Locking Plan

## Purpose
To ensure that the Pre-Service Reminder and Service In Progress screens maintain their trust-building design and functionality by locking them to prevent future modifications that could break trust principles.

## Screens to Lock

### 1. Pre-Service Reminder Screen
- File: `lib/widgets/pre_service_reminder_banner.dart`
- Purpose: Provide timely reminders about upcoming services without giving users unnecessary control

### 2. Service In Progress Screen  
- File: `lib/screens/service_in_progress_screen.dart`
- Purpose: Show real-time service status without control, reinforce managed service promise

### 3. Service Completed Screen (Closure)
- File: `lib/screens/service_completed_screen.dart`
- Purpose: Confirm service completion and close the mental loop

## Locking Mechanisms

### 1. Documentation Lock
- Create comprehensive specifications for each screen (already done)
- Include explicit guidelines on what can and cannot be changed
- Add trust principle compliance checklist

### 2. Code Comments
- Add prominent warning comments at the top of each file
- Clearly state the purpose and design principles
- Warn against making changes that break trust principles

### 3. Pull Request Guidelines
- Add explicit review guidelines for these screens
- Require architectural approval for any changes
- Include trust principle compliance checks in PR reviews

### 4. Version Control
- Tag the current state of these screens in version control
- Create a branch protection rule to require review for changes to these files

## Implementation Steps

### 1. Add Warning Comments to Files

#### Pre-Service Reminder Banner
```dart
/// WARNING: DO NOT MODIFY THIS FILE WITHOUT ARCHITECTURAL APPROVAL
/// 
/// This widget implements the Pre-Service Reminder screen, which is critical
/// for building and maintaining user trust in SEVAQ's managed service model.
/// 
/// Trust Principles:
/// - Visibility without control
/// - Reassurance focused
/// - No user actions or controls
/// - Timely reminders with SEVAQ responsibility emphasized
/// 
/// Changes to this widget must comply with these principles and require
/// architectural review.
```

#### Service In Progress Screen
```dart
/// WARNING: DO NOT MODIFY THIS FILE WITHOUT ARCHITECTURAL APPROVAL
/// 
/// This screen implements the Service In Progress state, which is critical
/// for building and maintaining user trust in SEVAQ's managed service model.
/// 
/// Trust Principles:
/// - Status-only display (no user control)
/// - Support access provided
/// - Outcome ownership reassured
/// - No worker-user communication
/// - SEVAQ as intermediary
/// 
/// Changes to this screen must comply with these principles and require
/// architectural review.
```

#### Service Completed Screen
```dart
/// WARNING: DO NOT MODIFY THIS FILE WITHOUT ARCHITECTURAL APPROVAL
/// 
/// This screen implements the Service Completed state, which is critical
/// for building and maintaining user trust in SEVAQ's managed service model.
/// 
/// Trust Principles:
/// - Confirmation of outcome
/// - Closure of mental loop
/// - Reduction of post-service anxiety
/// - No upsells or rating requests
/// - Professional and calm tone
/// 
/// Changes to this screen must comply with these principles and require
/// architectural review.
```

### 2. Update Pull Request Template
Add section to PR template:
```markdown
## Trust Principle Compliance Check (for screen changes)

If you are modifying any of the following files, please ensure compliance with SEVAQ's trust principles:

- `lib/widgets/pre_service_reminder_banner.dart`
- `lib/screens/service_in_progress_screen.dart`
- `lib/screens/service_completed_screen.dart`

### Required Checklist:
- [ ] No user control or actionable buttons added
- [ ] No upsell or rating requests introduced
- [ ] SEVAQ responsibility is emphasized
- [ ] Calm and reassuring tone maintained
- [ ] Content focuses on outcome rather than process
- [ ] No direct worker-user communication channels added

### Architectural Approval Required:
- [ ] This change has been reviewed and approved by the architecture team
```

### 3. Branch Protection Rule
Create a branch protection rule that:
- Requires at least one review from the architecture team for changes to these files
- Blocks merging without architectural approval
- Requires status checks to pass before merging

## Review Process

### For Any Changes to Locked Screens
1. Create a detailed design document explaining the change
2. Schedule a review meeting with the architecture team
3. Present the change and explain how it complies with trust principles
4. Address any concerns or feedback from the architecture team
5. Only merge after explicit approval

## Consequences of Non-Compliance
- Changes that break trust principles may be reverted
- Developers may be required to undergo additional training on SEVAQ's design principles
- Critical changes may require a formal redesign process

## Maintenance Exceptions
- Bug fixes that do not change functionality
- Performance optimizations that preserve behavior
- Accessibility improvements that maintain trust principles

These exceptions still require review but have a streamlined approval process.
