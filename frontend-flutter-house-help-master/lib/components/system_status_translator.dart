class SystemStatusTranslator {
  static String translateWorkerAvailability(double percentage) {
    if (percentage >= 80) return "Backup active";
    if (percentage >= 60) return "Slight delay expected";
    return "Service adjustment needed";
  }

  static String translateResponseTime(int minutes) {
    if (minutes <= 15) return "On track";
    if (minutes <= 30) return "Slight delay expected";
    return "Extended wait time";
  }

  static String translateServiceAvailability(double percentage) {
    if (percentage >= 85) return "All services on track";
    if (percentage >= 70) return "Most services available";
    return "Limited availability";
  }

  static String translateSystemHealth(bool isHealthy) {
    return isHealthy ? "All services on track" : "Service adjustment needed";
  }
}
