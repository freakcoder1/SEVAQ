import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixWorkerLocationData1736660000000 implements MigrationInterface {
    name = 'FixWorkerLocationData1736660000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Set default location for existing workers without location data
        await queryRunner.query(`
            UPDATE "worker" 
            SET 
                "latitude" = 28.5804579,
                "longitude" = 77.4392951,
                "currentLat" = 28.5804579,
                "currentLng" = 77.4392951
            WHERE "latitude" IS NULL OR "longitude" IS NULL
        `);

        // Now we can safely add NOT NULL constraints
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "latitude" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "longitude" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "currentLat" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "currentLng" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove NOT NULL constraints
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "latitude" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "longitude" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "currentLat" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "worker" ALTER COLUMN "currentLng" DROP NOT NULL`);
    }
}