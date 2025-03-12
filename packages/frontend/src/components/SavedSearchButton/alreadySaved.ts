import type { SavedSearchData, SavedSearchesFieldsFragment } from 'bff-types-generated';
import type { InboxViewType } from '../../api/useDialogs.tsx';
import { PageRoutes } from '../../pages/routes.ts';

type JsonValue = string | number | boolean | JsonObject | JsonArray | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

const deepEqual = (value1: unknown, value2: unknown): boolean => {
  if (value1 === null && value2 === null) return true;

  if (typeof value1 !== typeof value2) return false;

  if (typeof value1 === 'object' && typeof value2 === 'object') {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return arraysAreEqual(value1, value2);
    }

    if (!Array.isArray(value1) && !Array.isArray(value2)) {
      return objectsAreEqual(value1 as JsonObject, value2 as JsonObject);
    }
  }

  return value1 === value2;
};

const objectsAreEqual = (obj1: JsonObject, obj2: JsonObject): boolean => {
  if (obj1 === null || obj2 === null) return obj1 === obj2;

  const keys1 = Object.keys(obj1).sort();
  const keys2 = Object.keys(obj2).sort();

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
};

const arraysAreEqual = (arr1: JsonArray, arr2: JsonArray): boolean => {
  if (arr1.length !== arr2.length) return false;

  const normalize = (item: JsonValue): string => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return JSON.stringify(
        Object.keys(item)
          .sort()
          .reduce((acc, key) => {
            acc[key] = item[key];
            return acc;
          }, {} as JsonObject),
      );
    }
    return JSON.stringify(item);
  };

  const sortedArr1 = arr1.map(normalize).sort();
  const sortedArr2 = arr2.map(normalize).sort();

  return sortedArr1.every((item, index) => item === sortedArr2[index]);
};

/**
 * Finds a previously saved search that matches the given search data.
 *
 * @param {SavedSearchData} searchDataToCheck - The search data to check against saved searches.
 * @param {SavedSearchesFieldsFragment[] | undefined} savedSearches - The list of saved searches, or undefined if none exist.
 * @param {InboxViewType} viewType - The type of inbox view.
 * @returns {SavedSearchesFieldsFragment | undefined} - The matching saved search if found, otherwise undefined.
 *
 * The function compares each key-value pair in `searchDataToCheck` against `savedSearches`
 * using deep equality to determine if an identical search is already saved.
 */
export const getAlreadySavedSearch = (
  searchDataToCheck: SavedSearchData,
  savedSearches: SavedSearchesFieldsFragment[] | undefined,
  viewType: InboxViewType,
): SavedSearchesFieldsFragment | undefined => {
  return (savedSearches ?? [])
    .filter((savedSearch) => savedSearch.data.fromView === PageRoutes[viewType])
    .find((prevSaved) => {
      const prevSavedData = prevSaved.data as SavedSearchData;
      return Object.keys(searchDataToCheck).every((key) => {
        const prevSavedDataKey = prevSavedData[key as keyof SavedSearchData];
        const searchDataToCheckKey = searchDataToCheck[key as keyof SavedSearchData];
        console.info(prevSavedDataKey, searchDataToCheckKey);
        return deepEqual(prevSavedDataKey, searchDataToCheckKey);
      });
    });
};
