import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingServiceDetailColumns1736660000002 implements MigrationInterface {
  name = 'AddMissingServiceDetailColumns1736660000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to service table for detailed service information (only if they don't exist)
    const reassuranceTextColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'reassuranceText'
    `);
    if (reassuranceTextColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "reassuranceText" text`,
      );
    }

    const whatWillHappenColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'whatWillHappen'
    `);
    if (whatWillHappenColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "whatWillHappen" text[] DEFAULT '{}'`,
      );
    }

    const whatWillNotHappenColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'whatWillNotHappen'
    `);
    if (whatWillNotHappenColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "whatWillNotHappen" text[] DEFAULT '{}'`,
      );
    }

    const ifSomethingGoesWrongColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service' AND column_name = 'ifSomethingGoesWrong'
    `);
    if (ifSomethingGoesWrongColumns.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "service" ADD COLUMN "ifSomethingGoesWrong" text`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from service table
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "ifSomethingGoesWrong"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "whatWillNotHappen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "whatWillHappen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" DROP COLUMN "reassuranceText"`,
    );
  }
}
