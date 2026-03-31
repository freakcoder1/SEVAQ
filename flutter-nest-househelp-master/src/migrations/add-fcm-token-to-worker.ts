import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFcmTokenToWorker1739999999999 implements MigrationInterface {
  name = 'AddFcmTokenToWorker1739999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'worker',
      new TableColumn({
        name: 'fcmToken',
        type: 'text',
        isNullable: true,
      }),
    );
    console.log('Added fcmToken column to worker table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('worker', 'fcmToken');
    console.log('Dropped fcmToken column from worker table');
  }
}