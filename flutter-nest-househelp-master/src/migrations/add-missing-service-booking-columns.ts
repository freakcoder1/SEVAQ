import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingServiceBookingColumns1736660000001 implements MigrationInterface {
    name = 'AddMissingServiceBookingColumns1736660000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to service table
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "subcategory" text`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "isAvailable" boolean DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "isFastBooking" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "estimatedWaitTime" integer`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "workerCount" integer`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "imageUrl" text`);

        // Add missing column to booking table
        await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN "isPaid" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from service table
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "workerCount"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "estimatedWaitTime"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "isFastBooking"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "isAvailable"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "subcategory"`);

        // Remove column from booking table
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "isPaid"`);
    }
}