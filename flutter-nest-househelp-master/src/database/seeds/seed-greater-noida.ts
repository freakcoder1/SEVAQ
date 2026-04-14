import { DataSource, Repository } from 'typeorm';
import { ServiceArea } from '../../locations/entities/service_area.entity';
import { MicroZone } from '../../locations/entities/micro_zone.entity';
import { Logger } from '@nestjs/common';

export class SeedGreaterNoidaAreas {
  private readonly logger = new Logger(SeedGreaterNoidaAreas.name);

  async run(dataSource: DataSource): Promise<void> {
    const serviceAreaRepository = dataSource.getRepository(ServiceArea);
    const microZoneRepository = dataSource.getRepository(MicroZone);

    this.logger.log('Starting Greater Noida service area seeding...');

    // Check if Greater Noida area already exists
    const existingArea = await serviceAreaRepository.findOne({
      where: {
        name: 'Greater Noida - Greater Noida West',
      },
    });

    if (existingArea) {
      this.logger.log(
        'Greater Noida service area already exists, skipping creation',
      );
      await this.verifySeedData(serviceAreaRepository, microZoneRepository);
      return;
    }

    this.logger.log(
      'Creating Greater Noida service area near user location (28.5804571, 77.4392382)',
    );

    // Create Greater Noida service area covering the user's location
    const serviceAreaGN = serviceAreaRepository.create({
      name: 'Greater Noida - Greater Noida West',
      pincode: '201306',
      minLat: 28.57, // Covering area around user's location
      maxLat: 28.59,
      minLng: 77.43,
      maxLng: 77.45,
      isActive: true,
      coverageMap: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [77.43, 28.57],
              [77.45, 28.57],
              [77.45, 28.59],
              [77.43, 28.59],
              [77.43, 28.57],
            ],
          ],
        ],
      },
    });

    await serviceAreaRepository.save(serviceAreaGN);
    this.logger.log('Created Greater Noida service area');

    // Create micro-zones within the Greater Noida area covering user's location
    const microZones = [
      {
        name: 'Greater Noida - Alpha 1',
        centerLat: 28.5805, // Near user's location 28.5804571
        centerLng: 77.4392, // Near user's location 77.4392382
        radiusKm: 2.0, // 2km radius to cover the area
        zoneType: 'static',
        isActive: true,
      },
      {
        name: 'Greater Noida - Alpha 2',
        centerLat: 28.575,
        centerLng: 77.445,
        radiusKm: 1.5,
        zoneType: 'static',
        isActive: true,
      },
      {
        name: 'Greater Noida - Beta',
        centerLat: 28.585,
        centerLng: 77.435,
        radiusKm: 1.5,
        zoneType: 'static',
        isActive: true,
      },
      {
        name: 'Greater Noida - Commercial Belt',
        centerLat: 28.582,
        centerLng: 77.442,
        radiusKm: 1.0,
        zoneType: 'static',
        isActive: true,
      },
    ];

    for (const zoneData of microZones) {
      const microZone = microZoneRepository.create({
        ...zoneData,
        serviceArea: serviceAreaGN,
        boundaries: {
          type: 'Polygon',
          coordinates: [
            [
              [zoneData.centerLng - 0.01, zoneData.centerLat - 0.01],
              [zoneData.centerLng + 0.01, zoneData.centerLat - 0.01],
              [zoneData.centerLng + 0.01, zoneData.centerLat + 0.01],
              [zoneData.centerLng - 0.01, zoneData.centerLat + 0.01],
              [zoneData.centerLng - 0.01, zoneData.centerLat - 0.01],
            ],
          ],
        },
      });

      await microZoneRepository.save(microZone);
      this.logger.log(
        `Created micro-zone: ${zoneData.name} at (${zoneData.centerLat}, ${zoneData.centerLng})`,
      );
    }

    this.logger.log('Service area seeding completed for Greater Noida');
    await this.verifySeedData(serviceAreaRepository, microZoneRepository);
  }

  private async verifySeedData(
    serviceAreaRepository: Repository<ServiceArea>,
    microZoneRepository: Repository<MicroZone>,
  ): Promise<void> {
    this.logger.log('Verifying seeded data...');

    const serviceAreas = await serviceAreaRepository.find({
      where: { isActive: true },
    });
    this.logger.log(`Found ${serviceAreas.length} active service areas`);

    const microZones = await microZoneRepository.find({
      where: { isActive: true },
    });
    this.logger.log(`Found ${microZones.length} active micro-zones`);

    for (const area of serviceAreas) {
      this.logger.debug(
        `Service Area: ${area.name} - bounds: [${area.minLat}, ${area.maxLat}] x [${area.minLng}, ${area.maxLng}]`,
      );
    }

    for (const zone of microZones) {
      this.logger.debug(
        `Micro Zone: ${zone.name} - center: (${zone.centerLat}, ${zone.centerLng}), radius: ${zone.radiusKm}km`,
      );
    }

    this.logger.log('Seed data verification completed');
  }
}
