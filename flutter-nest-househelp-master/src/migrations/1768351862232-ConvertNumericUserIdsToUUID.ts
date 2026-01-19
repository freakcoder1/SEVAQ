import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class ConvertNumericUserIdsToUUID1768351862232 implements MigrationInterface {
    name = 'ConvertNumericUserIdsToUUID1768351862232';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Start transaction
        await queryRunner.startTransaction();

        try {
            // 1. Drop foreign key constraints
            await queryRunner.query(`
                ALTER TABLE "worker" DROP CONSTRAINT "worker_userId_fkey"
            `);
            console.log('Dropped worker foreign key constraint');

            await queryRunner.query(`
                ALTER TABLE "booking" DROP CONSTRAINT "booking_userId_fkey"
            `);
            console.log('Dropped booking foreign key constraint');

            await queryRunner.query(`
                ALTER TABLE "service_request" DROP CONSTRAINT "service_request_userId_fkey"
            `);
            console.log('Dropped service_request foreign key constraint');

            // 2. Change the column type from integer to varchar to allow UUID strings
            await queryRunner.query(`
                ALTER TABLE "user" ALTER COLUMN id TYPE varchar USING id::varchar
            `);
            console.log('Changed user.id column type to varchar');

            // 3. Change foreign key column types
            await queryRunner.query(`
                ALTER TABLE "worker" ALTER COLUMN "user_id" TYPE varchar USING "user_id"::varchar
            `);
            console.log('Changed worker.user_id column type to varchar');

            await queryRunner.query(`
                ALTER TABLE "booking" ALTER COLUMN "userId" TYPE varchar USING "userId"::varchar
            `);
            console.log('Changed booking.userId column type to varchar');

            await queryRunner.query(`
                ALTER TABLE "service_request" ALTER COLUMN "userId" TYPE varchar USING "userId"::varchar
            `);
            console.log('Changed service_request.userId column type to varchar');

            // 3. Get all users
            const users = await queryRunner.query(`
                SELECT id FROM "user"
                ORDER BY id ASC
            `);

            console.log(`Found ${users.length} users to migrate`);

            // 4. Create a mapping of old numeric IDs to new UUIDs
            const idMapping: Record<string, string> = {};

            for (const user of users) {
                const oldId = user.id.toString();
                const newId = uuidv4();
                idMapping[oldId] = newId;
            }

            // 5. Update user IDs in the user table
            for (const [oldId, newId] of Object.entries(idMapping)) {
                await queryRunner.query(`
                    UPDATE "user" SET id = '${newId}' WHERE id = '${oldId}'
                `);
            }
            console.log(`Updated ${users.length} user IDs in user table`);

            // 6. Update related tables that reference user IDs
            // Workers table
            for (const [oldId, newId] of Object.entries(idMapping)) {
                await queryRunner.query(`
                    UPDATE "worker" SET "user_id" = '${newId}' WHERE "user_id" = '${oldId}'
                `);
            }
            console.log(`Updated worker references for ${Object.keys(idMapping).length} users`);

            // Bookings table
            for (const [oldId, newId] of Object.entries(idMapping)) {
                await queryRunner.query(`
                    UPDATE "booking" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'
                `);
            }
            console.log(`Updated booking references for ${Object.keys(idMapping).length} users`);

            // Service requests table
            for (const [oldId, newId] of Object.entries(idMapping)) {
                await queryRunner.query(`
                    UPDATE "service_request" SET "userId" = '${newId}' WHERE "userId" = '${oldId}'
                `);
            }
            console.log(`Updated service request references for ${Object.keys(idMapping).length} users`);

            // Assignment metrics table (already uuid, skip update)
            console.log('Skipping assignment_metrics table update (already uuid)');

            // User behavior metrics table (already uuid, skip update)
            console.log('Skipping user_behavior_metrics table update (already uuid)');

            // 7. Change all columns to uuid type
            await queryRunner.query(`
                ALTER TABLE "user" ALTER COLUMN id DROP DEFAULT
            `);
            await queryRunner.query(`
                ALTER TABLE "user" ALTER COLUMN id TYPE uuid USING id::uuid
            `);
            console.log('Changed user.id column type to uuid');

            await queryRunner.query(`
                ALTER TABLE "worker" ALTER COLUMN "user_id" TYPE uuid USING "user_id"::uuid
            `);
            console.log('Changed worker.user_id column type to uuid');

            await queryRunner.query(`
                ALTER TABLE "booking" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid
            `);
            console.log('Changed booking.userId column type to uuid');

            await queryRunner.query(`
                ALTER TABLE "service_request" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid
            `);
            console.log('Changed service_request.userId column type to uuid');

            // 8. Recreate foreign key constraints
            await queryRunner.query(`
                ALTER TABLE "worker" ADD CONSTRAINT "worker_userId_fkey" FOREIGN KEY ("user_id") REFERENCES "user"(id)
            `);
            console.log('Recreated worker foreign key constraint');

            await queryRunner.query(`
                ALTER TABLE "booking" ADD CONSTRAINT "booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id)
            `);
            console.log('Recreated booking foreign key constraint');

            await queryRunner.query(`
                ALTER TABLE "service_request" ADD CONSTRAINT "service_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id)
            `);
            console.log('Recreated service_request foreign key constraint');

            // Commit transaction
            await queryRunner.commitTransaction();
            console.log('Migration completed successfully!');

        } catch (error) {
            // Rollback transaction on error
            await queryRunner.rollbackTransaction();
            console.error('Migration failed, rolled back:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // This migration is not reversible as we can't guarantee the original numeric IDs
        // are still available and not reassigned
        console.warn('This migration cannot be safely reversed.');
        console.warn('UUIDs cannot be converted back to the original numeric IDs.');
    }
}