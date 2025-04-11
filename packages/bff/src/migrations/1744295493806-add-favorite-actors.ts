import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFavoriteActors1744295493806 implements MigrationInterface {
  name = 'AddFavoriteActors1744295493806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "profile" 
            ADD "favoriteActors" text[] NOT NULL DEFAULT '{}' 
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "profile" 
            DROP COLUMN "favoriteActors"
        `);
  }
}
