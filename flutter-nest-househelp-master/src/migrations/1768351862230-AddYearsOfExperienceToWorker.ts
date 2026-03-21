import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddYearsOfExperienceToWorker1768351862230 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "worker" ADD COLUMN IF NOT EXISTS "yearsOfExperience" integer NOT NULL DEFAULT 0
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "worker" DROP COLUMN IF EXISTS "yearsOfExperience"
        `);
  }
}
