class CopyHelper {
  // SEVAQ COPY GUIDELINES - CALM, DECLARATIVE, TRUST-FIRST

  static String translateInfrastructureStatus(bool isActive) {
    return isActive ? "SEVAQ is handling this" : "SEVAQ is handling this";
  }

  static String translateSystemMonitoring(bool isMonitoring) {
    return isMonitoring
        ? "Assigned & monitored by SEVAQ"
        : "Assigned & monitored by SEVAQ";
  }

  static String translateWorkerAvailability(double percentage) {
    if (percentage >= 80) return "SEVAQ is handling this";
    if (percentage >= 60) return "SEVAQ is handling this";
    return "SEVAQ is handling this";
  }

  static String translateSystemHealth(bool isHealthy) {
    return isHealthy ? "SEVAQ is handling this" : "SEVAQ is handling this";
  }

  static String translateServiceAvailability(double percentage) {
    if (percentage >= 85) return "SEVAQ is handling this";
    if (percentage >= 70) return "SEVAQ is handling this";
    return "SEVAQ is handling this";
  }

  static String translateResponseTime(int minutes) {
    if (minutes <= 15) return "SEVAQ is handling this";
    if (minutes <= 30) return "SEVAQ is handling this";
    return "SEVAQ is handling this";
  }

  static String translateReliabilityStreak(int streak) {
    if (streak >= 10) return "Assigned & monitored by SEVAQ";
    if (streak >= 5) return "Assigned & monitored by SEVAQ";
    return "Assigned & monitored by SEVAQ";
  }

  static String translateExperience(int years) {
    if (years >= 10) return "Assigned & monitored by SEVAQ";
    if (years >= 5) return "Assigned & monitored by SEVAQ";
    if (years >= 2) return "Assigned & monitored by SEVAQ";
    return "Assigned & monitored by SEVAQ";
  }

  static String translateHomesServed(int count) {
    if (count >= 100) return "Covered by your monthly service";
    if (count >= 50) return "Covered by your monthly service";
    if (count >= 20) return "Covered by your monthly service";
    return "Covered by your monthly service";
  }

  // Additional SEVAQ-specific copy methods
  static String translateSubscriptionCoverage() {
    return "Covered by your monthly service";
  }

  static String translateServiceAssignment() {
    return "Assigned & monitored by SEVAQ";
  }

  static String translateSystemAssurance() {
    return "SEVAQ is handling this";
  }

  static String translateTrustMessage() {
    return "We'll take care of this";
  }
}
