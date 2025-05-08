import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedActorGroups1748946209349 implements MigrationInterface {
  name = 'AddedActorGroups1748946209349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "isfavorite" boolean NOT NULL DEFAULT false, "profilePid" character varying, CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "party" ("id" character varying NOT NULL, CONSTRAINT "PK_e6189b3d533e140bb33a6d2cec1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "group_parties_party" ("groupId" integer NOT NULL, "partyId" character varying NOT NULL, CONSTRAINT "PK_c8c033661ef90031d66453cfc9b" PRIMARY KEY ("groupId", "partyId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_ad5e2073c782eb60cb6e7800f7" ON "group_parties_party" ("groupId") `);
    await queryRunner.query(`CREATE INDEX "IDX_3d02ba95297556543b830d9c5e" ON "group_parties_party" ("partyId") `);
    await queryRunner.query(`ALTER TABLE "profile" DROP COLUMN "favoriteActors"`);
    await queryRunner.query(
      `ALTER TABLE "group" ADD CONSTRAINT "FK_6a5691f556be211d7045a79e0e6" FOREIGN KEY ("profilePid") REFERENCES "profile"("pid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_parties_party" ADD CONSTRAINT "FK_ad5e2073c782eb60cb6e7800f75" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_parties_party" ADD CONSTRAINT "FK_3d02ba95297556543b830d9c5e3" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "group_parties_party" DROP CONSTRAINT "FK_3d02ba95297556543b830d9c5e3"`);
    await queryRunner.query(`ALTER TABLE "group_parties_party" DROP CONSTRAINT "FK_ad5e2073c782eb60cb6e7800f75"`);
    await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_6a5691f556be211d7045a79e0e6"`);
    await queryRunner.query(`ALTER TABLE "profile" ADD "favoriteActors" text array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3d02ba95297556543b830d9c5e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad5e2073c782eb60cb6e7800f7"`);
    await queryRunner.query(`DROP TABLE "group_parties_party"`);
    await queryRunner.query(`DROP TABLE "party"`);
    await queryRunner.query(`DROP TABLE "group"`);
  }
}
