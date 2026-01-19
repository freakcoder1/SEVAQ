# Sevaq Assignment In Progress Flow Diagram

## Complete User Flow

```mermaid
flowchart TD
    A[User taps 'Confirm & request professional'] --> B[AssignmentInProgressScreen]
    
    B --> C{Assignment Status Check}
    
    C -->|Assigned| D[Update UI to 'Professional assigned']
    C -->|In Progress| E[Continue checking]
    C -->|No assignment yet| E
    C -->|Error| E
    
    E --> F{Check count >= 10?}
    
    F -->|Yes| G[Show delay message]
    F -->|No| H[Continue checking]
    
    G --> I{Assignment completes?}
    H --> I
    
    I -->|Yes| D
    I -->|No| J{Still checking?}
    
    J -->|Yes| K[Continue checking]
    J -->|No| L[Show failure state]
    
    D --> M[Show assigned professional details]
    M --> N[Enable 'View request details' CTA]
    
    L --> O[Show failure message]
    O --> P[Show 'Change time' and 'Contact support' options]
    
    B --> Q[Service Summary Card]
    B --> R[Status Indicator]
    B --> S[What Happens Next Section]
    B --> T[Support Entry Section]
    B --> U[Primary CTA]
    
    Q --> V[Display service type, date, time, price]
    R --> W[Progress bar or animated dots]
    S --> X[Clear expectation setting]
    T --> Y[Always visible help option]
    U --> Z[Contextual 'View request details' button]
    
    style B fill:#e8f5e9
    style D fill:#c8e6c9
    style G fill:#fff3cd
    style L fill:#f8d7da
    style Q fill:#f8f9fa
    style R fill:#f8f9fa
    style S fill:#f8f9fa
    style T fill:#f8f9fa
    style U fill:#f8f9fa
```

## State Transitions

```mermaid
stateDiagram-v2
    [*] --> InProgress: Screen loads
    
    InProgress --> Assigned: Assignment successful
    InProgress --> Delayed: Check count >= 10
    InProgress --> Failed: Assignment failed
    
    Delayed --> Assigned: Assignment successful
    Delayed --> Failed: Assignment failed after delay
    
    Assigned --> [*]: User views details
    Failed --> [*]: User takes action
    
    state InProgress {
        [*] --> Checking
        Checking --> Updating: Status change
        Updating --> Checking: Continue monitoring
    }
    
    state Assigned {
        [*] --> DisplayDetails
        DisplayDetails --> EnableCTA
    }
    
    state Delayed {
        [*] --> ShowMessage
        ShowMessage --> ContinueChecking
    }
    
    state Failed {
        [*] --> ShowError
        ShowError --> ShowOptions
    }
```

## Component Hierarchy

```mermaid
graph TD
    A[AssignmentInProgressScreen] --> B[Header]
    A --> C[StatusIndicator]
    A --> D[ServiceSummaryCard]
    A --> E[WhatHappensNextSection]
    A --> F[SupportSection]
    A --> G[PrimaryCTA]
    
    B --> B1[Title: 'Finding a professional']
    B --> B2[Subtitle: 'We're assigning...']
    
    C --> C1[Progress Bar OR Animated Dots]
    C --> C2[Status Text: 'Assignment in progress']
    C --> C3[Helper Text: 'This usually takes a few minutes']
    
    D --> D1[Service Icon]
    D --> D2[Service Name]
    D --> D3[Date & Time]
    D --> D4[Price]
    
    E --> E1[Step 1: 'We assign a verified professional']
    E --> E2[Step 2: 'You'll be notified once assigned']
    E --> E3[Step 3: 'Payment will be requested after assignment']
    
    F --> F1[Help Icon]
    F --> F2[Text: 'Need help?']
    F --> F3[Action: Open support options]
    
    G --> G1[Button: 'View request details']
    G --> G2[Style: Outlined, contextual]
    
    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#e0f2f1
    style F fill:#fce4ec
    style G fill:#f1f8e9
```

## Auto-Update Flow

```mermaid
sequenceDiagram
    participant User
    participant Screen
    participant Backend
    participant Timer
    
    User->>Screen: Taps 'Confirm & request professional'
    Screen->>Screen: Navigate to AssignmentInProgressScreen
    Screen->>Timer: Start polling (2s intervals)
    
    loop Every 2 seconds
        Timer->>Screen: Trigger status check
        Screen->>Backend: GET /assignments/status/latest
        Backend-->>Screen: Status response
        alt Status = 'assigned'
            Screen->>Screen: Update UI to assigned state
            Screen->>Screen: Show professional details
            Screen->>Screen: Enable CTAs
        else Status = 'in_progress'
            Screen->>Screen: Continue polling
            Screen->>Screen: Increment check count
        else Status = 'failed'
            Screen->>Screen: Show failure state
            Screen->>Screen: Navigate to failure screen
        end
    end
    
    alt Check count >= 10
        Screen->>Screen: Show delay message
        Screen->>Screen: Continue polling
    end
    
    User->>Screen: Views assigned professional
    Screen->>Screen: Enable 'View request details'
    
    User->>Screen: Taps support
    Screen->>Screen: Open chat/call support
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Network Error] --> B[Continue polling]
    C[Assignment Failed] --> D[Show failure message]
    E[Timeout] --> F[Show delay message]
    
    B --> G[Increment check count]
    G --> H{Check count >= 10?}
    
    H -->|Yes| I[Show delay message]
    H -->|No| J[Continue polling]
    
    I --> K[Continue polling with delay message]
    K --> L{Assignment successful?}
    
    L -->|Yes| M[Update to assigned state]
    L -->|No| N{Still within timeout?}
    
    N -->|Yes| K
    N -->|No| O[Show failure state]
    
    D --> P[Show 'Change time' option]
    D --> Q[Show 'Contact support' option]
    
    style A fill:#fff3cd
    style C fill:#f8d7da
    style E fill:#fff3cd
    style D fill:#f8d7da
    style I fill:#fff3cd
    style M fill:#c8e6c9
    style O fill:#f8d7da
```

This comprehensive flow diagram shows:

1. **Complete User Journey**: From confirmation to assignment completion
2. **State Transitions**: How the screen changes based on assignment status
3. **Component Hierarchy**: How UI components are organized
4. **Auto-Update Flow**: How the screen monitors assignment status
5. **Error Handling**: How different error scenarios are handled

The diagrams ensure that the implementation will be robust, user-friendly, and meet all the specified requirements for building trust and reducing user anxiety during the assignment process.