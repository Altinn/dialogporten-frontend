import type { SavedSearch } from '../../entities.ts';
import { encryptPersonUrn } from '../../party/personUrnCipher.ts';

export const encryptSavedSearchUrns = (search: SavedSearch): SavedSearch => {
  const urn = search.data?.urn;
  if (!Array.isArray(urn)) return search;
  return { ...search, data: { ...search.data, urn: urn.map((u) => encryptPersonUrn(u) as string) } };
};
