import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingServiceDetailColumns1736660000002 implements MigrationInterface {
    name = 'AddMissingServiceDetailColumns1736660000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to service table for detailed service information
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "reassuranceText" text`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "whatWillHappen" text[] DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "whatWillNotHappen" text[] DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "service" ADD COLUMN "ifSomethingGoesWrong" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from service table
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "ifSomethingGoesWrong"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "whatWillNotHappen"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "whatWillHappen"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "reassuranceText"`);
    }
}