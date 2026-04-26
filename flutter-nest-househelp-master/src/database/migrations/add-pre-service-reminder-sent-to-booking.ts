import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPreServiceReminderSentToBooking1745676600000 implements MigrationInterface {
  name = 'AddPreServiceReminderSentToBooking1745676600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND LOWER(column_name) = 'preserviceremindersent'
    `);

    if (columns.length === 0) {
      await queryRunner.addColumns('booking', [
        new TableColumn({
          name: 'preServiceReminderSent',
          type: 'boolean',
          default: false,
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'preServiceReminderSent');
  }
}
