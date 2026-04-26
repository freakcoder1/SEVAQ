import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomPlanDataToSubscription1769856000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "custom_plan_data" JSON DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "custom_plan_data";
    `);
  }
}