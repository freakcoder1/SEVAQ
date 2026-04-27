import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropNotNullConstraintOnServiceProfileId1745700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop NOT NULL constraint on serviceProfileId column in subscriptions table
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "serviceProfileId" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add NOT NULL constraint (only if all values are NOT NULL)
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "serviceProfileId" SET NOT NULL;
    `);
  }
}
