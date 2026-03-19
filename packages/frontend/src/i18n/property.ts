import i18n from 'i18next';

export type LocalizationObject = {
  languageCode: string;
  value: string;
  [key: string]: unknown; // allows any other properties
};

export type ValueType = Array<LocalizationObject> | null | undefined;

/**
 * Retrieves a localized object from a list based on the specified or current locale.
 *
 * - Returns the object matching the preferred locale if it exists.
 * - If no match is found, it returns the object matching the fallback locale ('nb').
 * - If neither is found, it returns the first object in the array.
 * - If the array is empty, `null`, or `undefined`, it returns `undefined`.
 *
 * @param {LocalizationObject[] | null | undefined} value - The array of localized objects to search.
 * @param {string} [locale] - The preferred locale (e.g., 'en', 'nb'). Defaults to the current `i18n` language if not provided.
 * @returns {LocalizationObject | undefined} - The matching object, the first object, or `undefined` if none are found.
 */
export const getPreferredPropertyByLocale = <T extends LocalizationObject>(
  value: Array<T> | null | undefined,
  locale?: string,
): T | undefined => {
  const fallbackLocale = 'nb';
  const currentLocale = locale ?? i18n.language;

  if (value) {
    return (
      value.find((item) => item.languageCode === currentLocale) ??
      value.find((item) => item.languageCode === fallbackLocale) ??
      value[0]
    );
  }
  return undefined;
};
