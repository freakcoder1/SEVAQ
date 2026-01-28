const tomorrow = new Date('2026-01-22T08:00:00+05:30');
const now = new Date();
const diffMs = tomorrow - now;
const diffHours = diffMs / (1000 * 60 * 60);
const diffMinutes = diffMs / (1000 * 60);

console.log('=== Time Difference Calculation ===');
console.log('Current time:', now.toISOString());
console.log('Booking time:', tomorrow.toISOString());
console.log('Time difference:', diffHours.toFixed(2), 'hours');
console.log('Time difference:', diffMinutes.toFixed(2), 'minutes');

// Check if it's within 24h ± 0.5h window
const is24hWindow = diffHours >= 23.5 && diffHours <= 24.5;
console.log('Within 24h window:', is24hWindow);

// Check if it's within 4-5h window
const isTestWindow = diffHours >= 4 && diffHours <= 5;
console.log('Within test window:', isTestWindow);
