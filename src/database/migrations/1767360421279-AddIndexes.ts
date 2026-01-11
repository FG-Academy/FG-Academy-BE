import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1767360421279 implements MigrationInterface {
  name = 'AddIndexes1767360421279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_enrollment_user_course\` ON \`enrollment\` (\`userId\`, \`courseId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_lecture_time_record_updated_at\` ON \`lecture_time_record\` (\`updatedAt\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_quiz_submit_quiz\` ON \`quiz_submit\` (\`quizId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_quiz_submit_user_quiz\` ON \`quiz_submit\` (\`userId\`, \`quizId\`)`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_user_email\` ON \`user\` (\`email\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_user_email\` ON \`user\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_quiz_submit_user_quiz\` ON \`quiz_submit\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_quiz_submit_quiz\` ON \`quiz_submit\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_lecture_time_record_updated_at\` ON \`lecture_time_record\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_enrollment_user_course\` ON \`enrollment\``,
    );
  }
}
