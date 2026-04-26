import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUniqueConstraintOnSubscriptionServiceProfile implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint on serviceProfileId in subscriptions table
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "REL_25f06021d5e959312ce6fabe3c"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the unique constraint if rolling back (note: this assumes OneToOne relationship)
    await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "REL_25f06021d5e959312ce6fabe3c" UNIQUE ("serviceProfileId")`);
  }
}
