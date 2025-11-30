import {
  type BadgeColor,
  type BadgeSize,
  type BadgeVariant,
  ContextMenu,
  type ContextMenuProps,
  type DialogListGroupProps,
  type DialogListItemProps,
  type DialogListItemState,
  type FilterState,
} from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useDialogActions } from '../DialogDetailsPage/useDialogActions.tsx';
import type { CurrentSeenByLog } from './Inbox.tsx';
import type { InboxItemInput } from './InboxItemInput.ts';
import { getDialogStatus } from './status.ts';

interface GroupedItem {
  id: string | number;
  title?: string;
  description?: string;
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
  viewType: InboxViewType;
  /* There are more dialogs */
  hasNextPage: boolean;
  isLoading: boolean;
  filters?: FilterState;
  isFetchingNextPage?: boolean;
  /* true if the search results are displayed */
  displaySearchResults?: boolean;
  /* used to open modal with seen by log */
  onSeenByLogModalChange: (input: CurrentSeenByLog) => void;
}

const BANKRUPTCY_SERVICE_RESOURCE = 'urn:altinn:resource:app_brg_konkursbehandling';
const MIGRATED_SERVICE_RESOURCE = 'migratedcorrespondence';

const sortGroupedDialogs = (arr: DialogListItemProps[]) => {
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

const getItemBadge = (viewType: InboxViewType, hasUnopenedContent: boolean, t: (key: string) => string) => {
  if (viewType === 'bin' || viewType === 'archive') {
    return {
      color: 'neutral' as BadgeColor,
      label: t(`status.${viewType}`),
      size: 'sm' as BadgeSize,
      variant: 'subtle' as BadgeVariant,
    };
  }
  if (hasUnopenedContent) {
    return {
      label: t('word.unread'),
      size: 'xs' as BadgeSize,
      variant: 'tinted' as BadgeVariant,
    };
  }
  return undefined;
};

const useGroupedDialogs = ({
  items,
  displaySearchResults,
  viewType,
  isLoading,
  isFetchingNextPage,
  onSeenByLogModalChange,
  hasNextPage,
}: UseGroupedDialogsProps): UseGroupedDialogsOutput => {
  const { t } = useTranslation();
  const format = useFormat();
  const systemLabelActions = useDialogActions();
  const { allOrganizationsSelected } = useParties();
  const collapseGroups = displaySearchResults || viewType !== 'inbox';
  const getCollapsedGroupTitle = (viewType: InboxViewType, count: number, hasNextPage: boolean) =>
    (hasNextPage ? t('word.moreThan') : '') + t(`inbox.heading.title.${viewType}`, { count });

  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  const allWithinSameYear = items.every((d) => new Date(d.contentUpdatedAt).getFullYear() === new Date().getFullYear());
  const isInbox = viewType === 'inbox';

  const formatDialogItem = (item: InboxItemInput, groupId: string): DialogListItemProps => {
    const contextMenu: ContextMenuProps = {
      id: 'dialog-context-menu-' + item.id,
      placement: 'right',
      items: [
        ...systemLabelActions(item.id, item.label),
        {
          id: 'seenby-log',
          groupId: 'logs',
          label: item.seenByLabel,
          as: 'button',
          icon: item.seenByLog,
          hidden: !item.seenByLabel,
          onClick: () => {
            onSeenByLogModalChange({
              title: item.title,
              dialogId: item.id,
              items: item.seenByLog.items,
            });
          },
        },
      ],
      ariaLabel: t('dialog.context_menu.label', { title: item.title }),
    };

    const getIsUnread = (item: InboxItemInput) => {
      const isMigrated = item.serviceResource?.includes(MIGRATED_SERVICE_RESOURCE);
      if (isMigrated) {
        return item.hasUnopenedContent;
      }
      return item.seenSinceLastContentUpdate.length === 0 && !item.hasUnopenedContent;
    };

    return {
      groupId,
      title: item.title,
      badge: getItemBadge(item.viewType, item.hasUnopenedContent, t),
      id: item.id,
      recipientLabel: t('word.to'),
      sender: item.sender,
      summary: item.viewType === 'inbox' ? item.summary : undefined,
      state: getDialogState(item.viewType),
      recipient: item.recipient,
      color: item.recipient.type?.toLowerCase() as 'person' | 'company',
      grouped: allOrganizationsSelected,
      attachmentsCount: item.guiAttachmentCount,
      seenByLog: item.seenByLog,
      unread: getIsUnread(item),
      status: getDialogStatus(item.status, t),
      extendedStatusLabel: item.extendedStatus,
      controls: <ContextMenu {...contextMenu} />,
      updatedAt: item.contentUpdatedAt,
      updatedAtLabel: format(item.contentUpdatedAt, formatString),
      dueAtLabel: item.dueAt ? t('dialog.due_at', { date: format(item.dueAt, formatString) }) : undefined,
      dueAt: item.dueAt,
      sentCount: item.fromPartyTransmissionsCount ?? 0,
      receivedCount: item.fromServiceOwnerTransmissionsCount ?? 0,
      ariaLabel: item.title,
      as: (props: LinkProps) => (
        <Link state={{ fromView: location.pathname }} {...props} to={`/inbox/${item.id}/${location.search}`} />
      ),
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  return useMemo(() => {
    if (isLoading) {
      return {
        groupedDialogs: renderLoadingItems(5),
        groups: {
          loading: { title: t(`word.loading`) },
        },
      };
    }

    if (!displaySearchResults && !isInbox && !isLoading) {
      const groups: Record<string, DialogListGroupPropsSort> = {};
      const allDialogs: DialogListItemProps[] = [];

      // bankruptcy exception
      const bankruptcyDialogs = items.filter((item) => item.serviceResource === BANKRUPTCY_SERVICE_RESOURCE);
      const regularItems = items.filter((item) => item.serviceResource !== BANKRUPTCY_SERVICE_RESOURCE);

      // bankruptcy group
      if (bankruptcyDialogs.length > 0) {
        groups.bankruptcy = {
          orderIndex: 9999,
        };
        allDialogs.push(...bankruptcyDialogs.map((item) => formatDialogItem(item, 'bankruptcy')));
      }

      groups[viewType] = {
        title: getCollapsedGroupTitle(viewType, regularItems.length, hasNextPage),
        description: <Trans i18nKey={`inbox.heading.description.${viewType}`} components={{ strong: <strong /> }} />,
        orderIndex: null,
      };
      allDialogs.push(...regularItems.map((item) => formatDialogItem(item, item.viewType)));

      const groupedDialogs = sortGroupedDialogs(allDialogs);
      if (isFetchingNextPage) {
        groupedDialogs.push(...renderLoadingItems(1));
      }
      return {
        groupedDialogs,
        groups,
      };
    }

    const groupedItems: GroupedItem[] = [];

    const bankruptcyDialogs = items.filter((item) => item.serviceResource === BANKRUPTCY_SERVICE_RESOURCE);
    const regularDialogs = items.filter((item) => item.serviceResource !== BANKRUPTCY_SERVICE_RESOURCE);

    if (bankruptcyDialogs.length > 0) {
      groupedItems.push({
        id: 'bankruptcy',
        items: bankruptcyDialogs,
        orderIndex: 9999, //put on top
      });
    }

    if (collapseGroups) {
      groupedItems.push({
        id: 'collapsed',
        title: getCollapsedGroupTitle(viewType, regularDialogs.length, hasNextPage),
        description: t('search.results.description'),
        items: regularDialogs,
        orderIndex: null,
      });
    } else {
      regularDialogs.reduce((acc, item, _, list) => {
        const updatedAt = new Date(item.contentUpdatedAt);
        const month = format(updatedAt, 'LLLL');
        const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

        const groupKey = displaySearchResults
          ? item.viewType
          : allWithinSameYear
            ? capitalizedMonth
            : format(updatedAt, 'yyyy');

        const groupByDate = !displaySearchResults;
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
          const orderIndex = groupByDate
            ? allWithinSameYear
              ? updatedAt.getMonth()
              : updatedAt.getFullYear()
            : viewTypeIndex;
          acc.push({ id: groupKey, title: label, description: '', items: [item], orderIndex });
        }

        return acc;
      }, groupedItems);
    }

    const groups = Object.fromEntries(
      groupedItems.map(({ id, title, description, orderIndex }) => [id, { title, orderIndex, description }]),
    );

    const mappedGroupedDialogs = groupedItems.flatMap(({ id, items: groupItems }) =>
      groupItems.map((item) => formatDialogItem(item, id.toString())),
    );

    const groupedDialogs = sortGroupedDialogs(mappedGroupedDialogs);

    if (isFetchingNextPage) {
      groupedDialogs.push(...renderLoadingItems(1));
    }

    return { groupedDialogs, groups };
  }, [items, displaySearchResults, t, format, viewType, allWithinSameYear, isLoading, isFetchingNextPage]);
};

export default useGroupedDialogs;
