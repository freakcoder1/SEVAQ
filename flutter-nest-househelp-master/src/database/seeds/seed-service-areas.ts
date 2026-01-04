import { DataSource } from 'typeorm';
import { ServiceArea } from '../../locations/entities/service_area.entity';
import { MicroZone } from '../../locations/entities/micro_zone.entity';

export class SeedServiceAreas {
  async run(dataSource: DataSource): Promise<void> {
    const serviceAreaRepository = dataSource.getRepository(ServiceArea);
    const microZoneRepository = dataSource.getRepository(MicroZone);

    // Check if 201306 area already exists
    const existingArea = await serviceAreaRepository.findOne({
      where: {
        name: '201306 Area'
      }
    });

    if (existingArea) {
      console.log('201306 service area already exists');
      return;
    }

    // Create 201306 service area
    // Coordinates for 201306 postal code area (approximate)
    const serviceArea201306 = serviceAreaRepository.create({
      name: '201306 Area',
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
    console.log('Created 201306 service area');

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
      console.log(`Created micro-zone: ${zoneData.name}`);
    }

    console.log('Service area seeding completed for 201306');
  }
}