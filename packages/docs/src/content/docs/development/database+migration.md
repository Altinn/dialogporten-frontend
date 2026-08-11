---
title: "Database migration"
---
Migrations will be run automatically during CI/CD (or when starting the project with 'make dev' locally), however:

- If you have made changes to the database models you will need to create a new migration and generate it, see example below:
  
  - **First: START UP LOCAL DEVELOPMENT SERVER**
  
    - Below commands should be run from ./packages/bff
    - "name-of-my-change" should obviously be named something more appropriate
  

    ```sh
    CLIENT_ID="<CLIENT ID HERE>" CLIENT_SECRET="CLIENT SECRET HERE" pnpm typeorm migration:generate src/migrations/name-of-my-change --dataSource src/data-source.ts
    ```

      Output should look something like:
    ```sh
    CLIENT_ID="<<CENCORED>>" CLIENT_SECRET="<<CENCORED>>" pnpm typeorm migration:generate src/migrations/name-of-my-change --dataSource src/data-source.ts

    > bff@1.0.0 typeorm /Users/digdir/dialogporten-frontend/packages/bff
    > typeorm-ts-node-esm "migration:generate" "src/migrations/name-of-my-change" "--dataSource" "src/data-source.ts"

    Migration /Users/digdir/dialogporten-frontend/packages/bff/src/migrations/1737028371799-name-of-my-change.ts has been generated successfully.
    ```
- After these migration files are generated, restart project if in local dev env - if not then migration will be ran in CI/CD.

- IMPORTANT: If you are creating a "nullable: false" row, remember to add the "DEFAULT 'your default value'" to your generated migration script (see example below), which all pre-existing data will get as value of this new column.
    ```js
  import { MigrationInterface, QueryRunner } from 'typeorm';

  export class AddNonNull1737471965228 implements MigrationInterface {
      name = 'AddNonNull1737471965228';

      public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `ALTER TABLE "saved_search" ADD "nonnulltest" character varying(255) NOT NULL DEFAULT 'default_value'`,
        );
      }

      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_search" DROP COLUMN "nonnulltest"`);
      }
  }

    ```

- Troubleshooting:
  - Delete bff/dist folder to clear old files if you get error running the migration
- **TEST LOCALLY** before pushing to branch.

