import 'reflect-metadata';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initRepositories } from '../../src/db.ts';
import { Group, Party, ProfileTable, SavedSearch, type SavedSearchData } from '../../src/entities.ts';
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  updateSavedSearch,
} from '../../src/graphql/savedSearches/service.ts';
import { InitialSetup1740152869286 } from '../../src/migrations/1740152869286-initial_setup.ts';
import { InitSetup1740152903372 } from '../../src/migrations/1740152903372-init_setup.ts';
import { AddFavoriteActors1744295493806 } from '../../src/migrations/1744295493806-add-favorite-actors.ts';
import { AddedPartyGroups1749195944667 } from '../../src/migrations/1749195944667-added-party-groups.ts';

let container: StartedPostgreSqlContainer | undefined;
let dataSource: DataSource;

const createProfile = async (pid: string) => {
  const profile = new ProfileTable();
  profile.pid = pid;
  profile.groups = [];
  return await dataSource.getRepository(ProfileTable).save(profile);
};

const searchData: SavedSearchData = {
  searchString: 'skatt',
  fromView: '/',
  filters: [{ id: 'sender', value: 'urn:altinn:organization:identifier-no:991825827' }],
  urn: ['urn:altinn:person:identifier-no:08895699684'],
};

beforeAll(async () => {
  let url = process.env.TEST_DATABASE_URL;
  if (!url) {
    container = await new PostgreSqlContainer('postgres:16').start();
    url = container.getConnectionUri();
  }
  dataSource = await new DataSource({
    type: 'postgres',
    url,
    entities: [ProfileTable, Group, Party, SavedSearch],
    migrations: [
      InitialSetup1740152869286,
      InitSetup1740152903372,
      AddFavoriteActors1744295493806,
      AddedPartyGroups1749195944667,
    ],
    migrationsRun: true,
  }).initialize();
  initRepositories(dataSource);
});

afterAll(async () => {
  await dataSource?.destroy();
  await container?.stop();
});

beforeEach(async () => {
  await dataSource.query(
    'TRUNCATE TABLE "saved_search", "group_parties_party", "group", "party", "profile" RESTART IDENTITY CASCADE',
  );
});

describe('savedSearches against a real database', () => {
  it('runs all migrations on a fresh database', async () => {
    expect(await dataSource.showMigrations()).toBe(false);
    const executed = await dataSource.query('SELECT name FROM "migrations" ORDER BY "id" ASC');
    expect(executed.map((migration: { name: string }) => migration.name)).toEqual([
      'InitialSetup1740152869286',
      'InitSetup1740152903372',
      'AddFavoriteActors1744295493806',
      'AddedPartyGroups1749195944667',
    ]);
  });

  it('round-trips a saved search with its JSON data intact', async () => {
    const profile = await createProfile('pid-1');
    const created = await createSavedSearch({ name: 'Mine krav', data: searchData, profile });

    expect(created.id).toBeGreaterThan(0);

    const searches = await listSavedSearches('pid-1');
    expect(searches).toHaveLength(1);
    expect(searches[0].name).toBe('Mine krav');
    expect(searches[0].data).toEqual(searchData);
    expect(searches[0].createdAt).toBeInstanceOf(Date);
  });

  it('lists only searches belonging to the given profile', async () => {
    const profileA = await createProfile('pid-a');
    const profileB = await createProfile('pid-b');
    await createSavedSearch({ name: 'A sin', data: searchData, profile: profileA });
    await createSavedSearch({ name: 'B sin', data: searchData, profile: profileB });

    const searchesA = await listSavedSearches('pid-a');
    expect(searchesA.map((s) => s.name)).toEqual(['A sin']);

    expect(await listSavedSearches('pid-b')).toHaveLength(1);
    expect(await listSavedSearches('pid-unknown')).toHaveLength(0);
  });

  it('orders named searches alphabetically before unnamed ones', async () => {
    const profile = await createProfile('pid-1');
    await createSavedSearch({ name: '', data: searchData, profile });
    await createSavedSearch({ name: 'b-navn', data: searchData, profile });
    await dataSource.getRepository(SavedSearch).insert({ data: searchData, profile });
    await createSavedSearch({ name: 'a-navn', data: searchData, profile });

    const searches = await listSavedSearches('pid-1');
    expect(searches.map((s) => s.name).slice(0, 2)).toEqual(['a-navn', 'b-navn']);
    expect(searches.map((s) => s.name).slice(2)).toEqual(expect.arrayContaining(['', null]));
  });

  it('updates the name of a saved search', async () => {
    const profile = await createProfile('pid-1');
    const created = await createSavedSearch({ name: 'Gammelt navn', data: searchData, profile });

    const result = await updateSavedSearch(created.id, 'Nytt navn');
    expect(result.affected).toBe(1);

    const searches = await listSavedSearches('pid-1');
    expect(searches[0].name).toBe('Nytt navn');
  });

  it('deletes a saved search and reports affected rows', async () => {
    const profile = await createProfile('pid-1');
    const created = await createSavedSearch({ name: 'Slett meg', data: searchData, profile });

    const result = await deleteSavedSearch(created.id);
    expect(result.affected).toBe(1);
    expect(await listSavedSearches('pid-1')).toHaveLength(0);

    const secondAttempt = await deleteSavedSearch(created.id);
    expect(secondAttempt.affected).toBe(0);
  });
});
