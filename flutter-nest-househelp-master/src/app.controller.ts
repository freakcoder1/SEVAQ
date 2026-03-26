import { Controller, Get, Post, UseGuards, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';
import { SeedServiceAreas } from './database/seeds/seed-service-areas';
import { SeedGreaterNoidaAreas } from './database/seeds/seed-greater-noida';
import { EnhancedWorkerSeeding } from './database/seeds/enhanced-worker-seeding';
import { SeedCustomers } from './database/seeds/seed-customers';
import { SeedServiceProfiles } from './database/seeds/seed-service-profiles';
import { SeedServices } from './database/seeds/seed-services';
import { DataSource } from 'typeorm';
import { AdminGuard } from './auth/admin.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.healthService.check();
  }

  @Post('seed')
  // @UseGuards(AdminGuard) // Removed for Railway deployment - call without auth
  async runSeed() {
    const ds = this.dataSource;
    console.log('🌱 Starting database seeding...');

    const results: string[] = [];

    try {
      const seedServiceAreas = new SeedServiceAreas();
      await seedServiceAreas.run(ds);
      results.push('✅ Service areas seeded');
    } catch (e: any) { results.push(`❌ Service areas: ${e.message}`); }

    try {
      const seedGreaterNoida = new SeedGreaterNoidaAreas();
      await seedGreaterNoida.run(ds);
      results.push('✅ Greater Noida areas seeded');
    } catch (e: any) { results.push(`❌ Greater Noida: ${e.message}`); }

    try {
      const seedCustomers = new SeedCustomers();
      await seedCustomers.run(ds);
      results.push('✅ Customers seeded');
    } catch (e: any) { results.push(`❌ Customers: ${e.message}`); }

    try {
      const seedServiceProfiles = new SeedServiceProfiles();
      await seedServiceProfiles.run(ds);
      results.push('✅ Service profiles seeded');
    } catch (e: any) { results.push(`❌ Service profiles: ${e.message}`); }

    try {
      const seedServices = new SeedServices();
      await seedServices.run(ds);
      results.push('✅ Services seeded');
    } catch (e: any) { results.push(`❌ Services: ${e.message}`); }

    try {
      const enhancedWorker = new EnhancedWorkerSeeding();
      await enhancedWorker.run(ds);
      results.push('✅ Workers seeded');
    } catch (e: any) { results.push(`❌ Workers: ${e.message}`); }

    console.log('🌱 Seeding complete:', results);
    return { message: 'Seeding complete', results };
  }
}
