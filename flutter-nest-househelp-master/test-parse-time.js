function parseTimeWindow(dateString, timeWindow) {
    const date = new Date(dateString);
    
    let startHour;
    let endHour;

    switch (timeWindow.toLowerCase()) {
        case 'morning':
            startHour = 8;
            endHour = 12;
            break;
        case 'afternoon':
            startHour = 12;
            endHour = 17;
            break;
        case 'evening':
            startHour = 17;
            endHour = 21;
            break;
        default:
            startHour = 8;
            endHour = 12;
    }

    const startTime = new Date(date);
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);

    return { startTime, endTime };
}

// Test with 'afternoon' window which is what's failing
const testDate = '2026-01-20T10:00:00.000Z';
const result = parseTimeWindow(testDate, 'afternoon');

console.log('=== parseTimeWindow Test ===');
console.log(`Input date: ${testDate}`);
console.log(`Time window: afternoon`);
console.log(`Start time: ${result.startTime.toISOString()}`);
console.log(`End time: ${result.endTime.toISOString()}`);

// Calculate what the window should be in IST (UTC+5:30)
console.log('\n=== Time Window Comparison ===');
console.log(`Server calculated start time: ${result.startTime.toISOString()} (UTC)`);
console.log(`Server calculated end time: ${result.endTime.toISOString()} (UTC)`);

// Let's see what slots exist in UTC time for our workers
console.log('\n=== Slots in UTC Time ===');
const slots = [
    { id: 85, startTime: '2026-01-20T02:30:00.000Z', endTime: '2026-01-20T05:30:00.000Z' },
    { id: 86, startTime: '2026-01-20T05:30:00.000Z', endTime: '2026-01-20T08:30:00.000Z' },
    { id: 87, startTime: '2026-01-20T08:30:00.000Z', endTime: '2026-01-20T11:30:00.000Z' }
];

console.log('Slot 85: 02:30:00 - 05:30:00 UTC');
console.log('Slot 86: 05:30:00 - 08:30:00 UTC');
console.log('Slot 87: 08:30:00 - 11:30:00 UTC');

// Check if any slot matches the calculated window
console.log('\n=== Matching Slots ===');
slots.forEach(slot => {
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    
    const matches = slotStart >= result.startTime && slotStart <= result.endTime;
    
    console.log(`Slot ${slot.id}: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
});
