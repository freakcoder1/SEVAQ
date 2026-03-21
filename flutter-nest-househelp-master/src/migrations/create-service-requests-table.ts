import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceRequestsTable1736660000004 implements MigrationInterface {
  name = 'CreateServiceRequestsTable1736660000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'service_requests'
      )
    `);

    if (!tableExists[0].exists) {
      // Create service_requests table
      await queryRunner.query(`
              CREATE TABLE "service_requests" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "userId" uuid NOT NULL,
                  "serviceId" uuid NOT NULL,
                  "date" date NOT NULL,
                  "timeWindow" character varying NOT NULL CHECK ("timeWindow" IN ('morning', 'afternoon', 'evening')),
                  "priceSnapshot" decimal(10,2) NOT NULL,
                  "assignmentStatus" character varying NOT NULL DEFAULT 'REQUESTED',
                  "assignedWorkerId" character varying,
                  "assignedSlotId" character varying,
                  "failureReason" character varying,
                  "metadata" json,
                  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                  CONSTRAINT "PK_service_requests" PRIMARY KEY ("id")
              )
          `);

      // Create indexes
      await queryRunner.query(
        `CREATE INDEX "IDX_service_requests_userId_createdAt" ON "service_requests" ("userId", "createdAt")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_service_requests_assignmentStatus_createdAt" ON "service_requests" ("assignmentStatus", "createdAt")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_service_requests_assignmentStatus_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_requests_userId_createdAt"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "service_requests"`);
  }
}
