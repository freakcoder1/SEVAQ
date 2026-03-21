import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneUniqueConstraint1738467600000 implements MigrationInterface {
  name = 'AddPhoneUniqueConstraint1738467600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if users table exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `);

    if (!tableExists[0].exists) {
      console.log('Users table does not exist, skipping phone constraint migration');
      return;
    }

    // Step 1: Check for existing duplicate phone numbers
    const duplicates = await queryRunner.query(`
      SELECT phone, COUNT(*) as count
      FROM users
      WHERE phone IS NOT NULL
      GROUP BY phone
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.warn(`Found ${duplicates.length} duplicate phone numbers:`);
      duplicates.forEach((dup: any) => {
        console.warn(`  Phone: ${dup.phone}, Count: ${dup.count}`);
      });

      // Step 2: Keep only the oldest user for each duplicate phone number
      await queryRunner.query(`
        DELETE FROM users
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM users
          WHERE phone IS NOT NULL
          GROUP BY phone
        )
        AND phone IS NOT NULL
      `);
      console.log('Removed duplicate phone number entries');
    }

    // Step 3: Check if unique constraint already exists
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_user_phone' AND table_name = 'users'
      )
    `);

    if (!constraintExists[0].exists) {
      // Add unique constraint to phone column
      await queryRunner.query(`
        ALTER TABLE users
        ADD CONSTRAINT UQ_user_phone UNIQUE (phone)
      `);
      console.log('Added unique constraint on phone column');
    }

    // Step 4: Check if index already exists
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'idx_user_phone' AND tablename = 'users'
      )
    `);

    if (!indexExists[0].exists) {
      // Add index for performance
      await queryRunner.query(`
        CREATE INDEX IDX_user_phone ON users(phone)
      `);
      console.log('Added index on phone column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_user_phone
    `);

    // Remove unique constraint
    await queryRunner.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS UQ_user_phone
    `);
  }
}
