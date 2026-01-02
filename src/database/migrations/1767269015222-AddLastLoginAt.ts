import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastLoginAt1767269015222 implements MigrationInterface {
  name = 'AddLastLoginAt1767269015222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`lastLoginAt\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`lastLoginAt\``);
  }
}
