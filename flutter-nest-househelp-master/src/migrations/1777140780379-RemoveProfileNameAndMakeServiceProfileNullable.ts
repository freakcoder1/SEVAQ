import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProfileNameAndMakeServiceProfileNullable1777140780379 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop profileName column from service_profiles table
        await queryRunner.query(`ALTER TABLE "service_profiles" DROP COLUMN "profileName"`);
        
        // Make serviceProfileId nullable in subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "serviceProfileId" DROP NOT NULL`);
        
        // Add custom_plan_data column to subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD COLUMN "custom_plan_data" JSON`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert custom_plan_data column addition
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "custom_plan_data"`);
        
        // Revert serviceProfileId to not nullable
        // Note: This will fail if there are null values, so we need to set them to a default first
        await queryRunner.query(`UPDATE "subscriptions" SET "serviceProfileId" = 1 WHERE "serviceProfileId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "serviceProfileId" SET NOT NULL`);
        
        // Revert profileName column addition (simplified - original was VARCHAR with enum)
        await queryRunner.query(`ALTER TABLE "service_profiles" ADD COLUMN "profileName" VARCHAR`);
    }

}
