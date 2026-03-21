import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingMicroZoneColumns1736660000003 implements MigrationInterface {
  name = 'AddMissingMicroZoneColumns1736660000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to micro_zone table (only if they don't exist)
    const centerLatColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'micro_zone' AND column_name = 'centerLat'
    `);
    if (centerLatColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "micro_zone" ADD COLUMN "centerLat" decimal(10,7)`,
      );
    }

    const centerLngColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'micro_zone' AND column_name = 'centerLng'
    `);
    if (centerLngColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "micro_zone" ADD COLUMN "centerLng" decimal(10,7)`,
      );
    }

    const radiusKmColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'micro_zone' AND column_name = 'radiusKm'
    `);
    if (radiusKmColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "micro_zone" ADD COLUMN "radiusKm" decimal(5,2)`,
      );
    }

    const zoneTypeColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'micro_zone' AND column_name = 'zoneType'
    `);
    if (zoneTypeColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "micro_zone" ADD COLUMN "zoneType" text DEFAULT 'static'`,
      );
    }

    const boundariesColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'micro_zone' AND column_name = 'boundaries'
    `);
    if (boundariesColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "micro_zone" ADD COLUMN "boundaries" json`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from micro_zone table
    await queryRunner.query(
      `ALTER TABLE "micro_zone" DROP COLUMN "boundaries"`,
    );
    await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "zoneType"`);
    await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "radiusKm"`);
    await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "centerLng"`);
    await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "centerLat"`);
  }
}
