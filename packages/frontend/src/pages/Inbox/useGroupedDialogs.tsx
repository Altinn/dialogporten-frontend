import type {
  DialogListGroupProps,
  DialogListItemProps,
  DialogListItemState,
  FilterState,
} from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
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
  viewType: InboxViewType;
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  /* true if the search results are displayed */
  displaySearchResults?: boolean;
  /* collapse all groups into one group, default=false 	(Only if displaySearchResults===true) */
  collapseGroups?: boolean;
  /* title for the collapsed group, only applicable if collapseGroups=true */
  getCollapsedGroupTitle?: (count: number) => string;
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
  isFetchingNextPage,
  getCollapsedGroupTitle,
  collapseGroups = false,
}: UseGroupedDialogsProps): UseGroupedDialogsOutput => {
  const { t } = useTranslation();
  const format = useFormat();

  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  const allWithinSameYear = items.every((d) => new Date(d.updatedAt).getFullYear() === new Date().getFullYear());
  const isInbox = viewType === 'inbox';

  const formatDialogItem = (item: InboxItemInput, groupId: string): DialogListItemProps => ({
    groupId,
    title: item.title,
    label: !item.isSeenByEndUser ? t('word.new') : undefined,
    badge: !item.isSeenByEndUser
      ? {
          label: t('word.unread'),
          theme: 'surface-hover',
        }
      : undefined,
    id: item.id,
    recipientLabel: t('word.to'),
    sender: item.sender,
    summary: item.viewType === 'inbox' ? item.summary : undefined,
    state: getDialogState(item.viewType),
    recipient: item.recipient,
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
    ariaLabel: `${item.title}`,
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

    if (!displaySearchResults && !isInbox) {
      const groupedDialogs = items.map((item) => formatDialogItem(item, item.viewType));
      if (isFetchingNextPage) {
        groupedDialogs.push(...renderLoadingItems(1));
      }
      return {
        groupedDialogs,
        groups: {
          [viewType]: { title: t(`inbox.heading.title.${viewType}`, { count: items.length }) },
        },
      };
    }

    const groupedItems: GroupedItem[] = [];

    if (collapseGroups) {
      groupedItems.push({
        id: 'collapsed',
        label: getCollapsedGroupTitle?.(items.length) ?? t('inbox.heading.collapsed_group_default'),
        items,
        orderIndex: null,
      });
    } else {
      items.reduce((acc, item, _, list) => {
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
          const viewTypeIndex = ['bin', 'archive', 'sent', 'drafts', 'inbox'].indexOf(item.viewType);
          const orderIndex = isDateKey
            ? allWithinSameYear
              ? updatedAt.getMonth()
              : updatedAt.getFullYear()
            : viewTypeIndex;
          acc.push({ id: groupKey, label, items: [item], orderIndex });
        }

        return acc;
      }, groupedItems);
    }

    const groups = Object.fromEntries(
      groupedItems.map(({ id, label, orderIndex }) => [id, { title: label, orderIndex }]),
    );

    const mappedGroupedDialogs = groupedItems.flatMap(({ id, items }) =>
      items.map((item) => formatDialogItem(item, id.toString())),
    );

    const groupedDialogs = sortByUpdatedAt(mappedGroupedDialogs);

    if (isFetchingNextPage) {
      groupedDialogs.push(...renderLoadingItems(1));
    }
    return { groupedDialogs, groups };
  }, [items, displaySearchResults, t, format, viewType, allWithinSameYear, isLoading]);
};

export default useGroupedDialogs;
