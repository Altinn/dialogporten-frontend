import { DataSource, type Repository } from 'typeorm';
import { Group, Party, ProfileTable, SavedSearch } from './entities.ts';

export let GroupRepository: Repository<Group> | undefined = undefined;
export let ProfileRepository: Repository<ProfileTable> | undefined = undefined;
export let SavedSearchRepository: Repository<SavedSearch> | undefined = undefined;
export let PartyRepository: Repository<Party> | undefined = undefined;

export let dataSource: DataSource | undefined = undefined;

export const connectToDB = async () => {
  // we don't want to import data-source.ts in the initial import, because it loads config.ts
  // which is not needed for example for generating bff-types
  const { connectionOptions } = await import('./data-source.ts');
  dataSource = await new DataSource(connectionOptions).initialize();

  GroupRepository = dataSource.getRepository(Group);
  ProfileRepository = dataSource.getRepository(ProfileTable);
  SavedSearchRepository = dataSource.getRepository(SavedSearch);
  PartyRepository = dataSource.getRepository(Party);

  if (!GroupRepository) {
    throw new Error('GroupRepository not initialized');
  }
  if (!PartyRepository) {
    throw new Error('PartyRepository not initialized');
  }
  if (!ProfileRepository) {
    throw new Error('ProfileRepository not initialized');
  }
  if (!SavedSearchRepository) {
    throw new Error('SavedSearchRepository not initialized');
  }

  return { ProfileRepository, SavedSearchRepository, dataSource };
};
