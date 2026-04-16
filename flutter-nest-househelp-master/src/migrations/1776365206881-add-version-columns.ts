import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVersionColumns1776365206881 implements MigrationInterface {
    name = 'AddVersionColumns1776365206881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "version" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "booking" ADD "version" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "worker" ADD "version" integer NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "worker" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "version"`);
    }

}
