import type { QueryItemProps } from '@altinn/altinn-components';

const stripQuotes = (value: string): string => value.replace(/"/g, '');

const isQuotedPhrase = (searchValue: string): boolean =>
  searchValue.length > 1 && searchValue[0] === '"' && searchValue[searchValue.length - 1] === '"';

/**
 * Splits a search string into its individual words.
 *
 * A value wrapped in double quotes is treated as a single exact-phrase word,
 * otherwise the value is split on whitespace into one word per token.
 */
export const getSearchWords = (searchValue: string): string[] => {
  if (isQuotedPhrase(searchValue)) {
    return [stripQuotes(searchValue)];
  }

  return stripQuotes(searchValue.trim())
    .split(' ')
    .filter((value) => value.length > 0);
};

/**
 * Builds the autocomplete query labels for a search string.
 *
 * A value wrapped in double quotes is treated as a single exact-phrase token,
 * otherwise the value is split on whitespace into one token per word.
 */
export const getSearchLabels = (searchValue: string): QueryItemProps[] => {
  if (isQuotedPhrase(searchValue)) {
    return [{ type: 'search', value: searchValue, label: stripQuotes(searchValue) }];
  }

  return getSearchWords(searchValue).map((value) => ({ type: 'search', value, label: value }));
};

/**
 * Removes a single, unbalanced double quote from the search value.
 *
 * A balanced quoted phrase (two quotes) is kept intact so the exact-phrase
 * search is preserved; a lone stray quote is dropped.
 */
export const pruneSearchValue = (searchValue: string): string => {
  const quoteCount = (searchValue.match(/"/g) ?? []).length;
  return quoteCount === 1 ? searchValue.replace('"', '') : searchValue;
};
