import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

export class UpdateWorkerLocations {
  private readonly logger = new Logger(UpdateWorkerLocations.name);

  async run(dataSource: DataSource): Promise<void> {
    this.logger.log('Updating worker locations to user location...');

    // User's current location from device
    const userLat = 28.5804;
    const userLng = 77.4393;

    // Update all workers to be near the user location
    // Spread them slightly around the user's location (within 500m)
    const workerUpdates = [
      { id: '367d6c4f-bbd1-4c4a-9afa-fa58b3951cf2', lat: 28.58, lng: 77.439 }, // Amit Kumar
      {
        id: '26eac4de-83de-445a-8e72-3db172af16fa',
        lat: 28.5808,
        lng: 77.4395,
      }, // Priya Sharma
      {
        id: 'b954e849-c910-44e7-b111-0dee81b58b5e',
        lat: 28.5802,
        lng: 77.4388,
      }, // Rajesh Verma
      {
        id: '24435c2a-92db-4a2a-89ad-17829cd1d1ec',
        lat: 28.5806,
        lng: 77.4396,
      }, // Sunita Devi
      {
        id: '501316ba-8159-404f-a2c2-b596932ad046',
        lat: 28.5804,
        lng: 77.4393,
      }, // Vikram Singh
    ];

    for (const update of workerUpdates) {
      await dataSource.query(
        `UPDATE worker SET "currentLat" = $1, "currentLng" = $2, "lastLocationUpdate" = NOW() WHERE id = $3`,
        [update.lat, update.lng, update.id],
      );
      this.logger.log(
        `Updated worker ${update.id} to (${update.lat}, ${update.lng})`,
      );
    }

    this.logger.log('Worker locations updated successfully');

    // Also update the service area to cover this location
    await this.updateServiceArea(dataSource, userLat, userLng);
  }

  private async updateServiceArea(
    dataSource: DataSource,
    userLat: number,
    userLng: number,
  ): Promise<void> {
    this.logger.log(
      `Updating service area to cover user location (${userLat}, ${userLng})...`,
    );

    // Calculate bounds around user location (about 5km radius)
    const latOffset = 0.045; // ~5km
    const lngOffset = 0.045; // ~5km at this latitude

    await dataSource.query(
      `UPDATE service_area SET "minLat" = $1, "maxLat" = $2, "minLng" = $3, "maxLng" = $4, "coverageMap" = $5 WHERE name = '201306 Area'`,
      [
        userLat - latOffset,
        userLat + latOffset,
        userLng - lngOffset,
        userLng + lngOffset,
        JSON.stringify({
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [userLng - lngOffset, userLat - latOffset],
                [userLng + lngOffset, userLat - latOffset],
                [userLng + lngOffset, userLat + latOffset],
                [userLng - lngOffset, userLat + latOffset],
                [userLng - lngOffset, userLat - latOffset],
              ],
            ],
          ],
        }),
      ],
    );

    // Update micro-zones around user location
    const zoneUpdates = [
      { name: '201306 - Sector 1', lat: userLat - 0.005, lng: userLng - 0.005 },
      { name: '201306 - Sector 2', lat: userLat, lng: userLng },
      { name: '201306 - Sector 3', lat: userLat + 0.005, lng: userLng + 0.005 },
    ];

    for (const zone of zoneUpdates) {
      await dataSource.query(
        `UPDATE micro_zone SET "centerLat" = $1, "centerLng" = $2, boundaries = $3 WHERE name = $4`,
        [
          zone.lat,
          zone.lng,
          JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [zone.lng - 0.005, zone.lat - 0.005],
                [zone.lng + 0.005, zone.lat - 0.005],
                [zone.lng + 0.005, zone.lat + 0.005],
                [zone.lng - 0.005, zone.lat + 0.005],
                [zone.lng - 0.005, zone.lat - 0.005],
              ],
            ],
          }),
          zone.name,
        ],
      );
      this.logger.log(
        `Updated zone ${zone.name} to (${zone.lat}, ${zone.lng})`,
      );
    }

    this.logger.log('Service area and zones updated successfully');
  }
}
