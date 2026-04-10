import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastNotificationSentToSubscriptions1700000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const checkColumn = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'last_notification_sent_at'
    `);

    if (checkColumn.length === 0) {
      console.log('Adding last_notification_sent_at column to subscriptions table...');
      await queryRunner.query(`
        ALTER TABLE subscriptions
        ADD COLUMN last_notification_sent_at TIMESTAMP NULL
      `);
      console.log('Successfully added last_notification_sent_at column');
    } else {
      console.log('Column last_notification_sent_at already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('subscriptions', 'last_notification_sent_at');
  }
}
