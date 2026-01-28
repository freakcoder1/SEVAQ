import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertServiceWorkerTableToUUID1768432631591 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "service_worker" DROP CONSTRAINT "service_worker_worker_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "service_worker" DROP CONSTRAINT "service_worker_service_id_fkey"`);

        // Convert columns to UUID
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "worker_id" TYPE varchar USING "worker_id"::varchar`);
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "service_id" TYPE varchar USING "service_id"::varchar`);

        // Convert to UUID type
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "worker_id" TYPE uuid USING "worker_id"::uuid`);
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "service_id" TYPE uuid USING "service_id"::uuid`);

        // Recreate foreign key constraints
        await queryRunner.query(`ALTER TABLE "service_worker" ADD CONSTRAINT "service_worker_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "worker"(id) ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "service_worker" ADD CONSTRAINT "service_worker_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"(id) ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "service_worker" DROP CONSTRAINT "service_worker_worker_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "service_worker" DROP CONSTRAINT "service_worker_service_id_fkey"`);

        // Convert back to INTEGER
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "worker_id" TYPE integer USING "worker_id"::integer`);
        await queryRunner.query(`ALTER TABLE "service_worker" ALTER COLUMN "service_id" TYPE integer USING "service_id"::integer`);

        // Recreate foreign key constraints
        await queryRunner.query(`ALTER TABLE "service_worker" ADD CONSTRAINT "service_worker_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "worker"(id) ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "service_worker" ADD CONSTRAINT "service_worker_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"(id) ON DELETE CASCADE`);
    }

}
