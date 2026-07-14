import { SavedSearchRepository } from '../../db.ts';
import { type ProfileTable, SavedSearch, type SavedSearchData } from '../../entities.ts';

interface CreateSavedSearch {
  name: string;
  data: SavedSearchData;
  profile: ProfileTable;
}

export const listSavedSearches = async (pid: string | undefined) => {
  if (!SavedSearchRepository) return [];

  return await SavedSearchRepository.createQueryBuilder('s')
    .where('s.profilePid = :pid', { pid })
    .orderBy("CASE WHEN s.name IS NULL OR s.name = '' THEN 1 ELSE 0 END", 'ASC')
    .addOrderBy('s.name', 'ASC')
    .addOrderBy('s.updatedAt', 'DESC')
    .getMany();
};

export const createSavedSearch = async ({ name, data, profile }: CreateSavedSearch) => {
  const newSavedSearch = new SavedSearch();
  newSavedSearch.name = name;
  newSavedSearch.data = data;
  newSavedSearch.profile = profile;
  return await SavedSearchRepository!.save(newSavedSearch);
};

export const deleteSavedSearch = async (id: number) => {
  return await SavedSearchRepository!.delete({ id });
};

export const updateSavedSearch = async (id: number, name: string) => {
  return await SavedSearchRepository!.update(id, { name });
};
