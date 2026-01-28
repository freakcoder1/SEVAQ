import { DataSource, Repository } from 'typeorm';
import { ServiceArea } from '../../locations/entities/service_area.entity';
import { MicroZone } from '../../locations/entities/micro_zone.entity';
import { Logger } from '@nestjs/common';

export class SeedServiceAreas {
  private readonly logger = new Logger(SeedServiceAreas.name);

  async run(dataSource: DataSource): Promise<void> {
    const serviceAreaRepository = dataSource.getRepository(ServiceArea);
    const microZoneRepository = dataSource.getRepository(MicroZone);

    this.logger.log('Starting service area seeding...');

    // Check if 201306 area already exists
    const existingArea = await serviceAreaRepository.findOne({
      where: {
        name: '201306 Area'
      }
    });

    if (existingArea) {
      this.logger.log('201306 service area already exists, skipping creation');
      await this.verifySeedData(serviceAreaRepository, microZoneRepository);
      return;
    }

    this.logger.log('Creating 201306 service area with approximate coordinates for Noida/Greater Noida region');

    // Create 201306 service area
    // Coordinates for 201306 postal code area (Noida/Greater Noida region, India)
    const serviceArea201306 = serviceAreaRepository.create({
      name: '201306 Area',
      pincode: '201306',
      minLat: 28.6100,  // Approximate latitude for 201306
      maxLat: 28.6300,
      minLng: 77.3600,  // Approximate longitude for 201306
      maxLng: 77.3800,
      isActive: true,
      coverageMap: {
        type: 'MultiPolygon',
        coordinates: [[[
          [77.3600, 28.6100],
          [77.3800, 28.6100],
          [77.3800, 28.6300],
          [77.3600, 28.6300],
          [77.3600, 28.6100]
        ]]]
      }
    });

    await serviceAreaRepository.save(serviceArea201306);
    this.logger.log('Created 201306 service area');

    // Create micro-zones within the 201306 area
    const microZones = [
      {
        name: '201306 - Sector 1',
        centerLat: 28.6150,
        centerLng: 77.3650,
        radiusKm: 1.0,
        zoneType: 'static',
        isActive: true
      },
      {
        name: '201306 - Sector 2',
        centerLat: 28.6200,
        centerLng: 77.3700,
        radiusKm: 1.0,
        zoneType: 'static',
        isActive: true
      },
      {
        name: '201306 - Sector 3',
        centerLat: 28.6250,
        centerLng: 77.3750,
        radiusKm: 1.0,
        zoneType: 'static',
        isActive: true
      }
    ];

    for (const zoneData of microZones) {
      const microZone = microZoneRepository.create({
        ...zoneData,
        serviceArea: serviceArea201306,
        boundaries: {
          type: 'Polygon',
          coordinates: [[
            [zoneData.centerLng - 0.005, zoneData.centerLat - 0.005],
            [zoneData.centerLng + 0.005, zoneData.centerLat - 0.005],
            [zoneData.centerLng + 0.005, zoneData.centerLat + 0.005],
            [zoneData.centerLng - 0.005, zoneData.centerLat + 0.005],
            [zoneData.centerLng - 0.005, zoneData.centerLat - 0.005]
          ]]
        }
      });

      await microZoneRepository.save(microZone);
      this.logger.log(`Created micro-zone: ${zoneData.name} at (${zoneData.centerLat}, ${zoneData.centerLng})`);
    }

    this.logger.log('Service area seeding completed for 201306');
    await this.verifySeedData(serviceAreaRepository, microZoneRepository);
  }

  private async verifySeedData(serviceAreaRepository: Repository<ServiceArea>, microZoneRepository: Repository<MicroZone>): Promise<void> {
    this.logger.log('Verifying seeded data...');

    const serviceAreas = await serviceAreaRepository.find({ where: { isActive: true } });
    this.logger.log(`Found ${serviceAreas.length} active service areas`);
    
    const microZones = await microZoneRepository.find({ where: { isActive: true } });
    this.logger.log(`Found ${microZones.length} active micro-zones`);

    for (const area of serviceAreas) {
      this.logger.debug(`Service Area: ${area.name} - bounds: [${area.minLat}, ${area.maxLat}] x [${area.minLng}, ${area.maxLng}]`);
    }

    for (const zone of microZones) {
      this.logger.debug(`Micro Zone: ${zone.name} - center: (${zone.centerLat}, ${zone.centerLng}), radius: ${zone.radiusKm}km`);
    }

    this.logger.log('Seed data verification completed');
  }
}
