import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNotificationSentToBooking1712217600000 implements MigrationInterface {
  name = 'AddNotificationSentToBooking1712217600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'booking' AND LOWER(column_name) = 'notificationsent'
    `);

    if (columns.length === 0) {
      await queryRunner.addColumns('booking', [
        new TableColumn({
          name: 'notificationSent',
          type: 'boolean',
          default: false,
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking', 'notificationSent');
  }
}
