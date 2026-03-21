import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingServiceBookingColumns1736660000001 implements MigrationInterface {
  name = 'AddMissingServiceBookingColumns1736660000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to service table (only if they don't exist)
    const serviceColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'subcategory'
    `);
    if (serviceColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "subcategory" text`,
      );
    }

    const isAvailableColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'isAvailable'
    `);
    if (isAvailableColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "isAvailable" boolean DEFAULT true`,
      );
    }

    const isFastBookingColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'isFastBooking'
    `);
    if (isFastBookingColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "isFastBooking" boolean DEFAULT false`,
      );
    }

    const estimatedWaitTimeColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'estimatedWaitTime'
    `);
    if (estimatedWaitTimeColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "estimatedWaitTime" integer`,
      );
    }

    const workerCountColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'workerCount'
    `);
    if (workerCountColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "workerCount" integer`,
      );
    }

    const imageUrlColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'imageUrl'
    `);
    if (imageUrlColumns.length === 0) {
      await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "imageUrl" text`);
    }

    // Add missing column to booking table (only if it doesn't exist)
    const isPaidColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name = 'isPaid'
    `);
    if (isPaidColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "booking" ADD COLUMN "isPaid" boolean DEFAULT false`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from service table
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "imageUrl"`);
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "workerCount"`);
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "estimatedWaitTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "isFastBooking"`,
    );
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "isAvailable"`);
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "subcategory"`);

    // Remove column from booking table
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "isPaid"`);
  }
}
