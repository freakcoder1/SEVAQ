import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFcmGuestTokenTable1746450000000 implements MigrationInterface {
  name = 'CreateFcmGuestTokenTable1746450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'fcm_guest_token'
    `);

    if (tableExists.length === 0) {
      await queryRunner.createTable(
        new Table({
          name: 'fcm_guest_token',
          columns: [
            {
              name: 'deviceId',
              type: 'varchar',
              length: '256',
              isPrimary: true,
            },
            {
              name: 'token',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
      console.log('✅ Migration: Created fcm_guest_token table');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('fcm_guest_token');
  }
}
