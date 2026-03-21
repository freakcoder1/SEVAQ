import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';
import { Slot } from '../slots/entities/slot.entity';
import * as bcrypt from 'bcrypt';

export async function seedWorkersWithSlots(dataSource: DataSource) {
  console.log('Seeding workers with slots...');

  // Find existing services
  const services = await dataSource.getRepository(Service).find();
  if (services.length === 0) {
    console.log('No services found. Please create services first.');
    return;
  }

  // Sample workers data
  const workersData = [
    {
      firstName: 'Ramesh',
      lastName: 'Kumar',
      email: 'ramesh.kumar@example.com',
      phone: '+919876543210',
      bio: 'Experienced housekeeping professional with 5 years of experience in residential cleaning.',
      rating: 4.8,
      reviewCount: 120,
      yearsOfExperience: 5,
      homesServedInArea: 85,
      reliabilityStreak: 15,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5805083,
      longitude: 77.4392111,
      microZoneId: 'Greater Noida - Alpha 1',
      serviceAreaId: 'Greater Noida',
      serviceRadiusKm: 25, // Increased from 3 to 25km for better coverage
      availabilitySchedule: [
        { day: 1, startTime: '08:00', endTime: '18:00' }, // Monday
        { day: 2, startTime: '08:00', endTime: '18:00' }, // Tuesday
        { day: 3, startTime: '08:00', endTime: '18:00' }, // Wednesday
        { day: 4, startTime: '08:00', endTime: '18:00' }, // Thursday
        { day: 5, startTime: '08:00', endTime: '18:00' }, // Friday
        { day: 6, startTime: '09:00', endTime: '17:00' }, // Saturday
        { day: 0, startTime: '10:00', endTime: '14:00' }, // Sunday
      ],
    },
    {
      firstName: 'Sunita',
      lastName: 'Singh',
      email: 'sunita.singh@example.com',
      phone: '+919876543211',
      bio: 'Professional cook specializing in Indian and continental cuisine.',
      rating: 4.9,
      reviewCount: 95,
      yearsOfExperience: 8,
      homesServedInArea: 60,
      reliabilityStreak: 20,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5812345,
      longitude: 77.4389876,
      microZoneId: 'Greater Noida - Alpha 2',
      serviceAreaId: 'Greater Noida',
      serviceRadiusKm: 25, // Increased from 2.5 to 25km for better coverage
      availabilitySchedule: [
        { day: 1, startTime: '09:00', endTime: '19:00' }, // Monday
        { day: 2, startTime: '09:00', endTime: '19:00' }, // Tuesday
        { day: 3, startTime: '09:00', endTime: '19:00' }, // Wednesday
        { day: 4, startTime: '09:00', endTime: '19:00' }, // Thursday
        { day: 5, startTime: '09:00', endTime: '19:00' }, // Friday
        { day: 6, startTime: '10:00', endTime: '16:00' }, // Saturday
        { day: 0, startTime: '11:00', endTime: '15:00' }, // Sunday
      ],
    },
    {
      firstName: 'Amit',
      lastName: 'Sharma',
      email: 'amit.sharma@example.com',
      phone: '+919876543212',
      bio: 'Multi-skilled professional offering both cleaning and cooking services.',
      rating: 4.7,
      reviewCount: 78,
      yearsOfExperience: 4,
      homesServedInArea: 55,
      reliabilityStreak: 12,
      isVerified: true,
      isTrained: true,
      isMonitored: true,
      isActive: true,
      latitude: 28.5798765,
      longitude: 77.4401234,
      microZoneId: 'Greater Noida - Beta',
      serviceAreaId: 'Greater Noida',
      serviceRadiusKm: 25, // Increased from 3.5 to 25km for better coverage
      availabilitySchedule: [
        { day: 1, startTime: '07:00', endTime: '17:00' }, // Monday
        { day: 2, startTime: '07:00', endTime: '17:00' }, // Tuesday
        { day: 3, startTime: '07:00', endTime: '17:00' }, // Wednesday
        { day: 4, startTime: '07:00', endTime: '17:00' }, // Thursday
        { day: 5, startTime: '07:00', endTime: '17:00' }, // Friday
        { day: 6, startTime: '08:00', endTime: '14:00' }, // Saturday
        { day: 0, startTime: '09:00', endTime: '13:00' }, // Sunday
      ],
    },
  ];

  const userRepository = dataSource.getRepository(User);
  const workerRepository = dataSource.getRepository(Worker);
  const slotRepository = dataSource.getRepository(Slot);

  for (const workerData of workersData) {
    try {
      // Create user for the worker
      const user = new User();
      user.email = workerData.email;
      user.password = await bcrypt.hash('worker123', 10);
      user.firstName = workerData.firstName;
      user.lastName = workerData.lastName;
      user.role = 'worker';
      user.phone = workerData.phone;
      user.latitude = workerData.latitude;
      user.longitude = workerData.longitude;
      user.preferredLat = workerData.latitude;
      user.preferredLng = workerData.longitude;
      user.hasCompletedLocationSetup = true;
      user.locationHistory = [];

      const savedUser = await userRepository.save(user);

      // Create worker
      const worker = new Worker();
      worker.userId = savedUser.id as any;
      worker.user = savedUser;
      worker.bio = workerData.bio;
      worker.rating = workerData.rating;
      worker.reviewCount = workerData.reviewCount;
      worker.yearsOfExperience = workerData.yearsOfExperience;
      worker.homesServedInArea = workerData.homesServedInArea;
      worker.reliabilityStreak = workerData.reliabilityStreak;
      worker.isVerified = workerData.isVerified;
      worker.isTrained = workerData.isTrained;
      worker.isMonitored = workerData.isMonitored;
      worker.isActive = workerData.isActive;
      worker.latitude = workerData.latitude;
      worker.longitude = workerData.longitude;

      worker.serviceAreaId = workerData.serviceAreaId;
      worker.isAvailable = true;
      worker.currentLat = workerData.latitude;
      worker.currentLng = workerData.longitude;
      worker.lastLocationUpdate = new Date();
      worker.serviceRadiusKm = workerData.serviceRadiusKm;
      worker.availabilitySchedule = workerData.availabilitySchedule;

      // Assign services (cleaning and cooking)
      worker.services = services;

      const savedWorker = await workerRepository.save(worker);

      // Create time slots for the next 7 days
      await createWorkerSlots(dataSource, savedWorker, slotRepository);

      console.log(
        `✅ Created worker: ${workerData.firstName} ${workerData.lastName}`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to create worker ${workerData.firstName} ${workerData.lastName}:`,
        error,
      );
    }
  }

  console.log('Workers seeding completed!');
}

async function createWorkerSlots(
  dataSource: DataSource,
  worker: Worker,
  slotRepository: any,
) {
  const today = new Date();

  // Create slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);

    // Get worker's availability for this day
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const availability = worker.availabilitySchedule.find(
      (avail) => avail.day === dayOfWeek,
    );

    // If no specific availability for this day, use default availability
    if (!availability) {
      // Use default availability for this day (9 AM to 6 PM UTC)
      const defaultStartTime = '09:00';
      const defaultEndTime = '18:00';

      // Create slot with default availability
      const [startHour] = defaultStartTime.split(':').map(Number);
      const [endHour] = defaultEndTime.split(':').map(Number);

      const startTime = new Date(
        Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          startHour,
          0,
          0,
          0,
        ),
      );
      const endTime = new Date(
        Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          endHour,
          0,
          0,
          0,
        ),
      );

      const slot = new Slot();
      slot.date = currentDate;
      slot.startTime = startTime;
      slot.endTime = endTime;
      slot.isBooked = false;
      slot.maxBookings = 1;
      slot.currentBookings = 0;
      slot.worker = worker;

      await slotRepository.save(slot);
      continue; // Skip to next iteration
    }

    const [startHour] = availability.startTime.split(':').map(Number);
    const [endHour] = availability.endTime.split(':').map(Number);

    // Create 3-hour time slots from start to end time
    for (let hour = startHour; hour < endHour; hour += 3) {
      const startTime = new Date(
        Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          hour,
          0,
          0,
          0,
        ),
      );
      const endTime = new Date(
        Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          hour + 3,
          0,
          0,
          0,
        ),
      );

      // Skip if end time exceeds availability
      if (
        endTime >
        new Date(
          Date.UTC(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate(),
            endHour,
            0,
            0,
            0,
          ),
        )
      ) {
        break;
      }

      const slot = new Slot();
      slot.date = currentDate;
      slot.startTime = startTime;
      slot.endTime = endTime;
      slot.isBooked = false;
      slot.maxBookings = 1;
      slot.currentBookings = 0;
      slot.worker = worker;

      await slotRepository.save(slot);
    }
  }
}
