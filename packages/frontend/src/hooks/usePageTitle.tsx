import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PageTitleOptions {
  baseTitle: string;
  searchValue?: string;
  filterState?: FilterState;
  getFilterLabel?: (key: string, values: (string | number)[]) => string | undefined;
}

const translateInboxViewType = (baseTitle: string, t: TFunction): string => {
  const viewTypeMap: Record<string, string> = {
    inbox: 'sidebar.inbox',
    drafts: 'sidebar.drafts',
    sent: 'sidebar.sent',
    archive: 'sidebar.archived',
    bin: 'sidebar.deleted',
  };

  return viewTypeMap[baseTitle] ? t(viewTypeMap[baseTitle]) : baseTitle;
};

export const usePageTitle = ({ baseTitle, searchValue, filterState, getFilterLabel }: PageTitleOptions) => {
  const { t } = useTranslation();

  useEffect(() => {
    const translatedBaseTitle = translateInboxViewType(baseTitle, t);

    const titleParts: string[] = searchValue ? [] : [translatedBaseTitle];

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
