
/**
 * Centralized application constants
 * All magic numbers and shared values should be defined here
 * Following DRY principle and single source of truth architecture
 */

// Geospatial constants
export const EARTH_RADIUS_KM = 6371;

// Timezone configuration
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

// Scheduler intervals and timing
export const SCHEDULER_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const SCHEDULER_MAX_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const SCHEDULER_DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
export const SCHEDULER_MAX_EXECUTION_TIME_MS = 90 * 1000; // 90 seconds
export const NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Database connection configuration
export const DB_MAX_RETRIES = 5;
export const DB_INITIAL_RETRY_DELAY_MS = 1000;
export const DB_MAX_RETRY_DELAY_MS = 30000;
export const DB_CONNECTION_TIMEOUT_MS = 10000;

// Assignment system configuration
export const MAX_ASSIGNMENT_RADIUS_KM = 15;
export const DEFAULT_LOCATION_LAT = 28.5804579;
export const DEFAULT_LOCATION_LNG = 77.4392951;

// Performance thresholds
export const PERFORMANCE_WARNING_THRESHOLD_MS = 1000;
export const PERFORMANCE_CRITICAL_THRESHOLD_MS = 5000;
