// Test parsing of dates from frontend
const testDates = [
    '2026-01-23T08:00:00.000',   // Frontend format
    '2026-01-23T11:00:00.000',   // Frontend format
    '2026-01-23T08:00:00.000Z',  // Proper ISO8601
];

testDates.forEach((dateStr, index) => {
    console.log(`\nTest ${index + 1}: ${dateStr}`);
    try {
        const date = new Date(dateStr);
        console.log(`  Parsed date: ${date}`);
        console.log(`  Time: ${date.getTime()}`);
        if (isNaN(date.getTime())) {
            console.log('  ❌ Invalid date');
        }
    } catch (e) {
        console.log('  ❌ Error parsing:', e);
    }
});

// Test duration calculation
console.log('\n\nTesting duration calculation:');
const startTimeStr = '2026-01-23T08:00:00.000';
const endTimeStr = '2026-01-23T11:00:00.000';
const basePrice = 500;

const startTime = new Date(startTimeStr);
const endTime = new Date(endTimeStr);
const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
const totalAmount = basePrice * durationHours;

console.log(`  Start time: ${startTime}`);
console.log(`  End time: ${endTime}`);
console.log(`  Duration: ${durationHours} hours`);
console.log(`  Total amount: ${totalAmount}`);
