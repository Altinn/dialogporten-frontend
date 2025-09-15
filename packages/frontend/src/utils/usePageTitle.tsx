import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PageTitleOptions {
  baseTitle: string;
  searchValue?: string;
  filterState?: FilterState;
  getFilterLabel?: (key: string, values: (string | number)[]) => string | undefined;
}

export const usePageTitle = ({ baseTitle, searchValue, filterState, getFilterLabel }: PageTitleOptions) => {
  const { t } = useTranslation();

  useEffect(() => {
    const titleParts: string[] = searchValue ? [] : [baseTitle];

    if (searchValue?.trim()) {
      titleParts.push(`${t('word.search')}: "${searchValue}"`);
    }

    if (filterState && getFilterLabel) {
      const activeFilters: string[] = [];
      const filterEntries = Object.entries(filterState);
      for (const [key, values] of filterEntries) {
        if (values && values.length > 0) {
          const label = getFilterLabel(key, values);
          if (label) {
            activeFilters.push(label);
          }
        }
      }

      if (activeFilters.length > 0) {
        titleParts.push(activeFilters.join(', '));
      }
    }

    const title = titleParts.join(' + ') + ` - Altinn ${t('word.inbox')}`;

    document.title = title;
  }, [baseTitle, searchValue, filterState, getFilterLabel, t]);
};
