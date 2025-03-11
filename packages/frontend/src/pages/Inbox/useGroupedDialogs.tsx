import type {
  DialogListGroupProps,
  DialogListItemProps,
  DialogListItemState,
  FilterState,
} from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import type { InboxViewType } from '../../api/useDialogs.tsx';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from './InboxItemInput.ts';
import { getDialogStatus } from './status.ts';

interface GroupedItem {
  id: string | number;
  label: string;
  items: InboxItemInput[];
  orderIndex: number | null;
}

interface DialogListGroupPropsSort extends DialogListGroupProps {
  orderIndex?: number | null;
}

interface UseGroupedDialogsOutput {
  groupedDialogs: DialogListItemProps[];
  groups: Record<string, DialogListGroupPropsSort>;
}

interface UseGroupedDialogsProps {
  items: InboxItemInput[];
  filters?: FilterState;
  displaySearchResults: boolean;
  viewType: InboxViewType;
  isLoading: boolean;
}

const sortByUpdatedAt = (arr: DialogListItemProps[]) => {
  return arr.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
};

const renderLoadingItems = (size: number): DialogListItemProps[] => {
  return Array.from({ length: size }, (_, index) => {
    const randomTitle = Math.random()
      .toString(2)
      .substring(2, 9 + Math.floor(Math.random() * 7));
    const randomDescription = Math.random()
      .toString(2)
      .substring(2, 10 + Math.floor(Math.random() * 21));
    return {
      groupId: 'loading',
      title: randomTitle,
      id: `${index}`,
      summary: randomDescription,
      state: 'normal',
      loading: true,
    };
  });
};

const getDialogState = (viewType: InboxViewType): DialogListItemState => {
  switch (viewType) {
    case 'archive':
      return 'archived';
    case 'bin':
      return 'trashed';
    default:
      return 'normal';
  }
};

const useGroupedDialogs = ({
  items,
  displaySearchResults,
  viewType,
  isLoading,
}: UseGroupedDialogsProps): UseGroupedDialogsOutput => {
  const { t } = useTranslation();
  const format = useFormat();

  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;

  const allWithinSameYear = items.every((d) => new Date(d.updatedAt).getFullYear() === new Date().getFullYear());
  const isNotInbox = items.every((d) => ['drafts', 'sent', 'bin', 'archive'].includes(d.viewType));

  const formatDialogItem = (item: InboxItemInput, groupId: string): DialogListItemProps => ({
    groupId,
    title: item.title,
    label: !item.isSeenByEndUser ? t('word.new') : undefined,
    id: item.id,
    sender: item.sender,
    summary: item.summary,
    state: getDialogState(viewType),
    recipient: item.receiver,
    attachmentsCount: item.guiAttachmentCount,
    seenBy: item.seenByLabel
      ? {
          seenByEndUser: item.isSeenByEndUser,
          seenByOthersCount: item.seenByOthersCount,
          label: item.seenByLabel,
        }
      : undefined,
    status: getDialogStatus(item.status, t),
    seen: item.isSeenByEndUser,
    updatedAt: item.updatedAt,
    updatedAtLabel: format(item.updatedAt, formatString),
    as: (props: LinkProps) => (
      <Link state={{ fromView: location.pathname }} {...props} to={`/inbox/${item.id}/${location.search}`} />
    ),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  return useMemo(() => {
    if (isLoading) {
      return {
        groupedDialogs: renderLoadingItems(5),
        groups: {
          loading: { title: t(`word.loading`) },
        },
      };
    }

    if (!displaySearchResults && isNotInbox) {
      return {
        groupedDialogs: items.map((item) => formatDialogItem(item, viewType)),
        groups: {
          [viewType]: { title: t(`inbox.heading.title.${viewType}`, { count: items.length }) },
        },
      };
    }

    const getOrderIndex = (updatedAt: Date, isDateKey: boolean) => {
      if (!isDateKey) return null;

      if (allWithinSameYear) {
        return updatedAt.getMonth();
      }
      return updatedAt.getFullYear();
    };

    const groupedItems = items.reduce<GroupedItem[]>((acc, item, _, list) => {
      const updatedAt = new Date(item.updatedAt);
      const groupKey = displaySearchResults
        ? item.viewType
        : allWithinSameYear
          ? format(updatedAt, 'LLLL')
          : format(updatedAt, 'yyyy');

      const isDateKey = !displaySearchResults;

      const label = displaySearchResults
        ? t(`inbox.heading.search_results.${groupKey}`, {
            count: list.filter((i) => i.viewType === groupKey).length,
          })
        : groupKey;

      const existingGroup = acc.find((group) => group.id === groupKey);

      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const orderIndex = getOrderIndex(updatedAt, isDateKey);

        acc.push({ id: groupKey, label, items: [item], orderIndex });
      }

      return acc;
    }, []);

    const groups = Object.fromEntries(
      groupedItems.map(({ id, label, orderIndex }) => [id, { title: label, orderIndex }]),
    );

    const mappedGroupedDialogs = groupedItems.flatMap(({ id, items }) =>
      items.map((item) => formatDialogItem(item, id.toString())),
    );

    const groupedDialogs = sortByUpdatedAt(mappedGroupedDialogs);

    return { groupedDialogs, groups };
  }, [items, displaySearchResults, t, format, isNotInbox, viewType, allWithinSameYear, isLoading]);
};

export default useGroupedDialogs;
