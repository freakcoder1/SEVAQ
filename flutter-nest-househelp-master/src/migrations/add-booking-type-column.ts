import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingTypeColumn1736660000002 implements MigrationInterface {
  name = 'AddBookingTypeColumn1736660000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const existingColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND column_name = 'type'
    `);

    if (existingColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "booking" ADD COLUMN "type" text DEFAULT 'on_demand'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "type"`);
  }
}
