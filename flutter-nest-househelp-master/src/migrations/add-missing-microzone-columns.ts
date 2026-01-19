import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingMicroZoneColumns1736660000003 implements MigrationInterface {
    name = 'AddMissingMicroZoneColumns1736660000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to micro_zone table
        await queryRunner.query(`ALTER TABLE "micro_zone" ADD COLUMN "centerLat" decimal(10,7)`);
        await queryRunner.query(`ALTER TABLE "micro_zone" ADD COLUMN "centerLng" decimal(10,7)`);
        await queryRunner.query(`ALTER TABLE "micro_zone" ADD COLUMN "radiusKm" decimal(5,2)`);
        await queryRunner.query(`ALTER TABLE "micro_zone" ADD COLUMN "zoneType" text DEFAULT 'static'`);
        await queryRunner.query(`ALTER TABLE "micro_zone" ADD COLUMN "boundaries" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from micro_zone table
        await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "boundaries"`);
        await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "zoneType"`);
        await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "radiusKm"`);
        await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "centerLng"`);
        await queryRunner.query(`ALTER TABLE "micro_zone" DROP COLUMN "centerLat"`);
    }
}