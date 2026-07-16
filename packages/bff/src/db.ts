import { DataSource, type Repository } from 'typeorm';
import { Group, Party, ProfileTable, SavedSearch } from './entities.ts';

export let GroupRepository: Repository<Group> | undefined = undefined;
export let ProfileRepository: Repository<ProfileTable> | undefined = undefined;
export let SavedSearchRepository: Repository<SavedSearch> | undefined = undefined;
export let PartyRepository: Repository<Party> | undefined = undefined;

export let dataSource: DataSource | undefined = undefined;

export const initRepositories = (initializedDataSource: DataSource) => {
  dataSource = initializedDataSource;

  GroupRepository = initializedDataSource.getRepository(Group);
  ProfileRepository = initializedDataSource.getRepository(ProfileTable);
  SavedSearchRepository = initializedDataSource.getRepository(SavedSearch);
  PartyRepository = initializedDataSource.getRepository(Party);

  return {
    GroupRepository,
    PartyRepository,
    ProfileRepository,
    SavedSearchRepository,
    dataSource: initializedDataSource,
  };
};

export const connectToDB = async () => {
  // we don't want to import data-source.ts in the initial import, because it loads config.ts
  // which is not needed for example for generating bff-types
  const { connectionOptions } = await import('./data-source.ts');
  return initRepositories(await new DataSource(connectionOptions).initialize());
};
