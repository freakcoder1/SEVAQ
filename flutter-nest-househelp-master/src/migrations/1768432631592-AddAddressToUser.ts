import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressToUser1768432631592 implements MigrationInterface {
    name = 'AddAddressToUser1768432631592';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "address" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
    }
}