import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type InboxViewType, getViewType } from '../../api/useDialogs.tsx';
import type { InboxItemInput } from '../../components';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';

interface DialogCategory {
  label: string;
  id: string;
  items: InboxItemInput[];
}

interface UseGroupedDialogsProps {
  items: InboxItemInput[];
  filters: FilterState;
  displaySearchResults: boolean;
  viewType: InboxViewType;
}

const useGroupedDialogs = ({ items, displaySearchResults, viewType }: UseGroupedDialogsProps): DialogCategory[] => {
  const { t } = useTranslation();
  const format = useFormat();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  return useMemo(() => {
    const allWithinSameYear = items.every((d) => new Date(d.updatedAt).getFullYear() === new Date().getFullYear());
    const youAreNotInInbox = items.every((d) => ['drafts', 'sent', 'bin', 'archive'].includes(getViewType(d)));

    if (!displaySearchResults && youAreNotInInbox) {
      return [
        {
          label: t(`inbox.heading.title.${viewType}`, { count: items.length }),
          id: viewType,
          items,
        },
      ];
    }

    return items.reduce((acc: DialogCategory[], item, _, list) => {
      const createdAt = new Date(item.createdAt);
      const viewType = getViewType(item);
      const key = displaySearchResults
        ? viewType
        : allWithinSameYear
          ? format(createdAt, 'LLLL')
          : format(createdAt, 'yyyy');

      const label = displaySearchResults
        ? t(`inbox.heading.search_results.${key}`, { count: list.filter((i) => getViewType(i) === key).length })
        : key;

      const existingCategory = acc.find((c) => c.id === key);

      if (existingCategory) {
        existingCategory.items.push(item);
      } else {
        acc.push({ label, id: key, items: [item] });
      }

      return acc;
    }, []);
  }, [items, displaySearchResults]);
};

export default useGroupedDialogs;
