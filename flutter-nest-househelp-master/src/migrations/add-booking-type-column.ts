import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingTypeColumn1736660000002 implements MigrationInterface {
    name = 'AddBookingTypeColumn1736660000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" ADD COLUMN "type" text DEFAULT 'on_demand'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "type"`);
    }
}
