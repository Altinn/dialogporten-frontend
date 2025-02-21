import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSetup1740152903372 implements MigrationInterface {
  name = 'InitSetup1740152903372';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profile" ("pid" character varying NOT NULL, "language" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_7e4969ca10d9fab5fee6dc86e92" PRIMARY KEY ("pid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "saved_search" ("id" SERIAL NOT NULL, "data" json NOT NULL, "name" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "profilePid" character varying, CONSTRAINT "PK_563b338d8b4878fa46697c8f3f2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "saved_search" ADD CONSTRAINT "FK_75a7ac13ccabbd7242d7b7cb982" FOREIGN KEY ("profilePid") REFERENCES "profile"("pid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "saved_search" DROP CONSTRAINT "FK_75a7ac13ccabbd7242d7b7cb982"`);
    await queryRunner.query(`DROP TABLE "saved_search"`);
    await queryRunner.query(`DROP TABLE "profile"`);
  }
}
