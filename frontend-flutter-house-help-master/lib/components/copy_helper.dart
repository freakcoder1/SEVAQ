class CopyHelper {
  static String translateInfrastructureStatus(bool isActive) {
    return isActive ? "Available and on track" : "Service adjustment needed";
  }

  static String translateSystemMonitoring(bool isMonitoring) {
    return isMonitoring ? "We're watching this visit" : "Monitoring active";
  }

  static String translateWorkerAvailability(double percentage) {
    if (percentage >= 80) return "Backup active";
    if (percentage >= 60) return "Slight delay expected";
    return "Service adjustment needed";
  }

  static String translateSystemHealth(bool isHealthy) {
    return isHealthy ? "All services on track" : "Service adjustment needed";
  }

  static String translateServiceAvailability(double percentage) {
    if (percentage >= 85) return "All services on track";
    if (percentage >= 70) return "Most services available";
    return "Limited availability";
  }

  static String translateResponseTime(int minutes) {
    if (minutes <= 15) return "On track";
    if (minutes <= 30) return "Slight delay expected";
    return "Extended wait time";
  }

  static String translateReliabilityStreak(int streak) {
    if (streak >= 10) return "Consistently reliable";
    if (streak >= 5) return "Reliable performance";
    return "Building reliability";
  }

  static String translateExperience(int years) {
    if (years >= 10) return "Extensive experience";
    if (years >= 5) return "Experienced professional";
    if (years >= 2) return "Professional experience";
    return "Trained professional";
  }

  static String translateHomesServed(int count) {
    if (count >= 100) return "Extensively serves your area";
    if (count >= 50) return "Commonly serves your area";
    if (count >= 20) return "Familiar with your area";
    return "New to your area";
  }
}
