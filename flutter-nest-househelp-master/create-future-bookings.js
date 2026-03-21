const { AppDataSource } = require('./src/database/data-source');
const { Booking } = require('./src/bookings/entities/booking.entity');
const { User } = require('./src/users/entities/user.entity');
const { Worker } = require('./src/workers/entities/worker.entity');
const { Service } = require('./src/services/entities/service.entity');

async function createFutureBookings() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Find a test user
    const user = await User.findOne({ 
      where: { email: 'test.user1@example.com' } 
    });
    
    if (!user) {
      console.error('User not found: test.user1@example.com');
      return;
    }
    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // Find available workers and services
    const worker = await Worker.findOne({ 
      where: { id: 2 },
      relations: ['user'] 
    });
    
    const service = await Service.findOne({ where: { id: 1 } });

    if (!worker || !service) {
      console.error('Worker or Service not found');
      return;
    }
    console.log(`Found worker: ${worker.id}, service: ${service.id}`);

    const now = new Date();
    
    // Create bookings for the next 5 days
    const futureDates = [
      { date: new Date(now.getTime() + 2 * 60 * 60 * 1000), name: '2 hours from now' }, // 2 hours from now (within 24h window)
      { date: new Date(now.getTime() + 12 * 60 * 60 * 1000), name: '12 hours from now' }, // 12 hours from now
      { date: new Date(now.getTime() + 26 * 60 * 60 * 1000), name: '26 hours from now' }, // 26 hours from now (just outside 24h window)
      { date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), name: '3 days from now' }, // 3 days from now
      { date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), name: '5 days from now' }, // 5 days from now
    ];

    const timeSlots = [
      { start: '08:00:00', end: '10:00:00' },
      { start: '10:00:00', end: '12:00:00' },
      { start: '14:00:00', end: '16:00:00' },
      { start: '16:00:00', end: '18:00:00' },
    ];

    let createdCount = 0;
    for (const dateInfo of futureDates) {
      for (const slot of timeSlots) {
        // Parse the date and time
        const dateStr = dateInfo.date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Check if this booking already exists
        const existingBooking = await Booking.findOne({
          where: {
            userId: user.id,
            date: new Date(year, month - 1, day),
            startTime: slot.start,
          }
        });

        if (existingBooking) {
          console.log(`Booking already exists for ${dateInfo.name} at ${slot.start}`);
          continue;
        }

        const booking = new Booking();
        booking.userId = user.id;
        booking.workerId = worker.id;
        booking.serviceId = service.id;
        booking.date = new Date(year, month - 1, day);
        booking.startTime = slot.start;
        booking.endTime = slot.end;
        booking.status = 'confirmed';
        booking.isPaid = true;
        booking.totalAmount = 500;
        booking.publicId = `BK-FUTURE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await booking.save();
        console.log(`Created booking: ${dateInfo.name} at ${slot.start}`);
        createdCount++;
      }
    }

    console.log(`\nTotal new bookings created: ${createdCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating future bookings:', error);
    process.exit(1);
  }
}

createFutureBookings();
