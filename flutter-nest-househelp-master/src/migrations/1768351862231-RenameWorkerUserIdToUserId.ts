import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameWorkerUserIdToUserId1768351862231 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker" RENAME COLUMN "userId" TO "user_id"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker" RENAME COLUMN "user_id" TO "userId"
        `);
    }

}