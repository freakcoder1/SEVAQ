import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Worker } from '../workers/entities/worker.entity';
import { SlotsService } from '../slots/slots.service';

@Injectable()
export class DailySlotGenerationScheduler {
  private readonly logger = new Logger(DailySlotGenerationScheduler.name);

  constructor(
    @InjectRepository(Worker)
    private workersRepository: Repository<Worker>,
    private slotsService: SlotsService,
  ) {}

  /**
   * Run daily at 12:00 AM to generate slots for all active workers
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySlotGeneration(): Promise<void> {
    this.logger.log('Running daily slot generation scheduler...');
    
    try {
      // Get all active workers
      const workers = await this.workersRepository.find({
        where: { isActive: true },
      });

      this.logger.log(`Found ${workers.length} active workers`);

      // Generate slots for the next 7 days for each worker
      const today = new Date();
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        
        // Create standard time slots for the day
        const timeSlots = this.createStandardTimeSlots(targetDate);
        
        // Create slots for each worker
        for (const worker of workers) {
          try {
            await this.slotsService.createSlotsForWorker(
              worker.id,
              targetDate,
              timeSlots,
            );
          } catch (error) {
            this.logger.error(
              `Failed to create slots for worker ${worker.id}: ${error.message}`,
            );
          }
        }
      }

      this.logger.log('Daily slot generation completed successfully');
    } catch (error) {
      this.logger.error(`Daily slot generation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Run every hour to ensure slots are available for upcoming days
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySlotGeneration(): Promise<void> {
    this.logger.log('Running hourly slot generation check...');
    
    try {
      // Get all active workers
      const workers = await this.workersRepository.find({
        where: { isActive: true },
      });

      // Generate slots for the next 3 days (to ensure coverage)
      const today = new Date();
      
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        
        // Create standard time slots for the day
        const timeSlots = this.createStandardTimeSlots(targetDate);
        
        // Create slots for each worker
        for (const worker of workers) {
          try {
            await this.slotsService.createSlotsForWorker(
              worker.id,
              targetDate,
              timeSlots,
            );
          } catch (error) {
            // Silently handle duplicate slot errors
            if (!error.message?.includes('already exists')) {
              this.logger.error(
                `Failed to create slots for worker ${worker.id}: ${error.message}`,
              );
            }
          }
        }
      }

      this.logger.log('Hourly slot generation check completed');
    } catch (error) {
      this.logger.error(`Hourly slot generation failed: ${error.message}`);
    }
  }

  /**
   * Create standard time slots for a day
   * Covers morning, afternoon, and evening time windows
   * Returns slots that can be used for both subscription and on-demand bookings
   * @param targetDate - The date to create slots for (not today)
   */
  private createStandardTimeSlots(targetDate: Date): Array<{ startTime: Date; endTime: Date }> {
    const slots: Array<{ startTime: Date; endTime: Date }> = [];
    
    // Use the target date passed from the caller, not today's date
    const baseDate = new Date(targetDate);
    baseDate.setHours(0, 0, 0, 0);
    
    // Early morning slots: 5:00 AM - 11:00 AM (6 slots) - for early morning bookings
    const earlyMorningHours = [5, 6, 7, 8, 9, 10];
    for (const hour of earlyMorningHours) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(baseDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      slots.push({ startTime, endTime });
    }

    // Morning slots: 6:00 AM - 12:00 PM (6 slots)
    const morningHours = [6, 7, 8, 9, 10, 11];
    for (const hour of morningHours) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(baseDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      slots.push({ startTime, endTime });
    }

    // Afternoon slots: 12:00 PM - 5:00 PM (5 slots)
    const afternoonHours = [12, 13, 14, 15, 16];
    for (const hour of afternoonHours) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(baseDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      slots.push({ startTime, endTime });
    }

    // Evening slots: 5:00 PM - 10:00 PM (5 slots)
    const eveningHours = [17, 18, 19, 20, 21];
    for (const hour of eveningHours) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(baseDate);
      endTime.setHours(hour + 1, 0, 0, 0);
      slots.push({ startTime, endTime });
    }

    return slots;
  }

  /**
   * Manual trigger for slot generation (for testing)
   */
  async triggerSlotGeneration(daysAhead: number = 7): Promise<void> {
    this.logger.log(`Manually triggering slot generation for ${daysAhead} days ahead`);

    const workers = await this.workersRepository.find({
      where: { isActive: true },
    });

    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      
      const timeSlots = this.createStandardTimeSlots(targetDate);
      
      for (const worker of workers) {
        await this.slotsService.createSlotsForWorker(
          worker.id,
          targetDate,
          timeSlots,
        );
      }
    }

    this.logger.log('Manual slot generation completed');
  }
}
