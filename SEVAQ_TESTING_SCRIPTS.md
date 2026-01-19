# 🧪 SEVAQ USER TESTING SCRIPTS

## 📋 DETAILED TESTING PROCEDURES

Comprehensive test scripts for validating Sevaq's trust infrastructure and anxiety reduction capabilities.

## 🎯 PRE-TEST SETUP

### Environment Configuration
```bash
# Testing Environment Setup
mkdir sevaq-testing
cd sevaq-testing

# Biometric Monitoring Setup
# - Heart rate monitor: Polar H10
# - Eye tracking: Tobii Pro Nano
# - Facial expression: Affectiva SDK
# - Screen recording: OBS Studio

# Test Data Preparation
npm run seed:test-data
npm run start:testing
```

### Participant Recruitment Criteria
- **Age Range**: 25-55 years
- **Tech Comfort**: Mixed (tech-savvy and non-tech)
- **Service Experience**: Varied (frequent and infrequent users)
- **Background**: Diverse professional and personal backgrounds

## 📝 DETAILED TEST SCRIPTS

### Script 1: First-Time User Booking

**Pre-Test Instructions**:
"Welcome to Sevaq testing. We're testing a new approach to service booking that focuses on trust and calm. Please think aloud as you use the app and share your honest reactions."

**Setup**:
1. Clear browser cache and app data
2. Reset to fresh user state
3. Start biometric monitoring
4. Record baseline stress levels

**Test Flow**:

**Step 1: Home Screen Introduction**
```
Instructions: "Please open the Sevaq app and tell me what you see."
Expected: User sees PrimaryRecommendation with "We'll handle this" CTA
Validation: Does user understand system is taking initiative?
```

**Step 2: System Recommendation**
```
Instructions: "Click on the recommendation that seems most relevant to you."
Expected: User clicks PrimaryRecommendation
Validation: User trusts system choice over browsing categories
```

**Step 3: Adaptive Booking Flow**
```
Instructions: "Continue through the booking process and tell me what you're thinking."
Expected: Full ceremony flow with system responsibility messaging
Validation: User feels system is responsible, not user making risky choice
```

**Step 4: Payment as Protection**
```
Instructions: "Complete the payment and share your feelings about this step."
Expected: Payment framed as protection, not risk
Validation: User feels safe, not anxious about payment
```

**Post-Test Questions**:
1. "How did you feel about letting the system choose for you?"
2. "Did you feel protected or at risk during the booking?"
3. "Would you trust this system for a real service booking?"

### Script 2: Returning User with Familiar Service

**Pre-Test Setup**:
- Load user with previous booking history
- Set up familiar service preferences
- Start biometric monitoring

**Test Flow**:

**Step 1: Recognition**
```
Instructions: "Open the app and tell me what you notice."
Expected: System recognizes user, shows familiar recommendation
Validation: User feels system remembers them appropriately
```

**Step 2: Compressed Flow**
```
Instructions: "Book the same service again and note the differences."
Expected: Faster flow with less ceremony
Validation: User appreciates efficiency without feeling rushed
```

**Step 3: Trust Maintenance**
```
Instructions: "How does this experience compare to your first visit?"
Expected: Maintained trust with improved efficiency
Validation: User still feels system is in charge
```

**Post-Test Questions**:
1. "Did you appreciate the faster flow?"
2. "Did you still feel the system was responsible?"
3. "How would you rate this experience vs your first visit?"

### Script 3: Service Area Boundary Testing

**Pre-Test Setup**:
- Set user location outside normal service area
- Configure waitlist functionality
- Start biometric monitoring

**Test Flow**:

**Step 1: Service Request**
```
Instructions: "Try to book a service for your current location."
Expected: System shows expansion message with waitlist option
Validation: User trusts system honesty about limitations
```

**Step 2: Waitlist Option**
```
Instructions: "Review the waitlist option and share your thoughts."
Expected: User considers joining waitlist
Validation: User feels included in system growth plans
```

**Step 3: Alternative Choice**
```
Instructions: "If you don't want to wait, what would you do?"
Expected: User may choose alternative or wait for Sevaq
Validation: User prefers trusted system over immediate alternatives
```

**Post-Test Questions**:
1. "How did you feel about the system being honest about limitations?"
2. "Would you wait for Sevaq to expand to your area?"
3. "How does this compare to other services that might overpromise?"

### Script 4: Worker Profile Trust Testing

**Pre-Test Setup**:
- Load worker profiles with infrastructure metrics
- Configure human anchor data
- Start biometric monitoring

**Test Flow**:

**Step 1: Profile Viewing**
```
Instructions: "Look at this worker's profile and tell me what you see."
Expected: Professional metrics, system backing, one human anchor
Validation: User feels safe with professional presentation
```

**Step 2: Trust Assessment**
```
Instructions: "How comfortable would you feel with this worker in your home?"
Expected: Trust based on system verification, not personal details
Validation: System backing more important than personal stories
```

**Step 3: Human Connection**
```
Instructions: "What do you think about the 'Previously booked by you' note?"
Expected: One human anchor provides sufficient familiarity
Validation: Professional distance with human touch is ideal
```

**Post-Test Questions**:
1. "Did the worker profile make you feel safe?"
2. "Was the 'Previously booked by you' note helpful?"
3. "Would you prefer more or less personal information?"

### Script 5: System Status Anxiety Testing

**Pre-Test Setup**:
- Configure system status with confidence signals
- Set up technical metrics for comparison
- Start biometric monitoring

**Test Flow**:

**Step 1: Status Visibility**
```
Instructions: "Notice the system status during booking."
Expected: Simple confidence signals like "Backup active"
Validation: User understands and trusts confidence signals
```

**Step 2: Signal Interpretation**
```
Instructions: "What does 'Backup active' mean to you?"
Expected: User interprets as system reliability
Validation: Simple signals more effective than technical details
```

**Step 3: Anxiety Reduction**
```
Instructions: "How does seeing this status affect your anxiety?"
Expected: Reduced anxiety from system visibility
Validation: Confidence signals effectively reduce stress
```

**Post-Test Questions**:
1. "Did the system status make you feel more confident?"
2. "Would you prefer more technical details or simple signals?"
3. "How important is system visibility during booking?"

## 📊 DATA COLLECTION SCRIPTS

### Biometric Monitoring Setup
```javascript
// Heart Rate Monitoring
const heartRateMonitor = new PolarH10();
heartRateMonitor.startMonitoring();
heartRateMonitor.recordBaseline();

// Eye Tracking Setup
const eyeTracker = new TobiiProNano();
eyeTracker.calibrate(participant);
eyeTracker.startRecording();

// Facial Expression Analysis
const facialAnalysis = new AffectivaSDK();
facialAnalysis.startAnalysis();
```

### Screen Recording Script
```bash
# Start OBS recording
obs --startrecording --output "test-session-${participantId}.mp4"

# Record system logs
npm run start:dev -- --log-level=debug > test-logs.txt

# Monitor API calls
curl -X GET "http://localhost:3000/api/health" > api-health.txt
```

### Survey Script
```javascript
// Post-test survey
const survey = {
  anxietyReduction: {
    question: "How anxious did you feel during the booking process?",
    scale: [1: "Very anxious", 5: "Not anxious at all"]
  },
  trustBuilding: {
    question: "How much do you trust Sevaq's recommendations?",
    scale: [1: "Not at all", 5: "Completely"]
  },
  systemResponsibility: {
    question: "Who do you feel is responsible for the service quality?",
    options: ["Me", "The worker", "The system", "Shared responsibility"]
  }
};
```

## 🎯 VALIDATION PROCEDURES

### Success Criteria Validation
```javascript
// Anxiety Reduction Validation
function validateAnxietyReduction(baselineHR, bookingHR) {
  const reduction = ((baselineHR - bookingHR) / baselineHR) * 100;
  return reduction >= 10; // 10%+ reduction required
}

// Trust Building Validation
function validateTrustBuilding(acceptanceRate, satisfactionScore) {
  return acceptanceRate >= 0.8 && satisfactionScore >= 4.5;
}

// Infrastructure Design Validation
function validateInfrastructureDesign(userFeedback) {
  const calmAuthority = userFeedback.includes("calm") || userFeedback.includes("trusting");
  const professionalDistance = !userFeedback.includes("too personal");
  return calmAuthority && professionalDistance;
}
```

### Real-time Monitoring
```javascript
// Live validation during testing
const validationEngine = {
  checkAnxiety: (currentHR, baselineHR) => {
    if (validateAnxietyReduction(baselineHR, currentHR)) {
      console.log("✅ Anxiety reduction criteria met");
    }
  },
  
  checkTrust: (userActions) => {
    if (userActions.acceptedRecommendation) {
      console.log("✅ Trust building criteria met");
    }
  },
  
  checkDesign: (userFeedback) => {
    if (validateInfrastructureDesign(userFeedback)) {
      console.log("✅ Infrastructure design criteria met");
    }
  }
};
```

## 📋 TESTING CHECKLIST

### Pre-Test Checklist
- [ ] Biometric monitoring equipment calibrated
- [ ] Screen recording software configured
- [ ] Test data loaded and verified
- [ ] Participant consent forms completed
- [ ] Baseline measurements recorded

### During Test Checklist
- [ ] All scenarios completed successfully
- [ ] Biometric data being recorded
- [ ] Screen recording active
- [ ] User comments being captured
- [ ] Validation criteria being monitored

### Post-Test Checklist
- [ ] All data files saved and labeled
- [ ] Equipment properly stored
- [ ] Participant thanked and debriefed
- [ ] Initial observations documented
- [ ] Data ready for analysis

## 🚀 EXECUTION TIMELINE

### Day 1-2: Setup
- Configure testing environment
- Calibrate biometric equipment
- Load test data and scenarios

### Day 3-7: Execution
- Run all 5 scenarios with 10+ participants
- Collect quantitative and qualitative data
- Monitor validation criteria in real-time

### Day 8-10: Analysis
- Process biometric data
- Analyze user feedback
- Generate validation reports

### Day 11-14: Iteration
- Implement design improvements
- Re-test critical scenarios
- Validate improvements

This comprehensive testing framework ensures Sevaq's trust infrastructure delivers measurable anxiety reduction and trust building for users.