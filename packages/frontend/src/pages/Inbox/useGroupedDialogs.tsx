import {
  Button,
  ContextMenu,
  type ContextMenuProps,
  type DialogListGroupProps,
  type DialogListItemProps,
  type FilterState,
  ItemSelect,
} from '@altinn/altinn-components';
import { CheckmarkIcon, InformationSquareIcon } from '@navikt/aksel-icons';
import { SystemLabel } from 'bff-types-generated';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import { Link, type LinkProps, useSearchParams } from 'react-router-dom';
import { MAX_COUNT_BULK_DIALOGS } from '../../api/hooks/useBulkActions.tsx';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useGlobalState } from '../../useGlobalState.ts';
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

type FilterScope = 'DEFAULT' | 'ARCHIVE' | 'BIN' | 'ALL';

interface UseGroupedDialogsOutput {
  groupedDialogs: DialogListItemProps[];
  groups: Record<string, DialogListGroupPropsSort>;
  title?: string;
  description?: ReactNode;
}

interface UseGroupedDialogsProps {
  items: InboxItemInput[];
  viewType: InboxViewType;
  /* There are more dialogs */
  hasNextPage: boolean;
  isLoading: boolean;
  filters?: FilterState;
  filterState?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  isFetchingNextPage?: boolean;
  /* true if the search results are displayed */
  displaySearchResults?: boolean;
  /* used to open modal with seen by log */
  onSeenByLogModalChange: (input: CurrentSeenByLog) => void;
  /* used to open modal showing access/service info for a dialog */
  onAccessInfoModalChange: (dialogId: string) => void;
}

const SCOPE_TO_SYSTEM_LABEL: Record<Exclude<FilterScope, 'ALL'>, SystemLabel> = {
  DEFAULT: SystemLabel.Default,
  ARCHIVE: SystemLabel.Archive,
  BIN: SystemLabel.Bin,
};

const getDialogListDescription = ({
  t,
  viewType,
  viewIsEmpty,
  displaySearchResults,
  filterScope,
  hasNoResults,
  onScopeChange,
}: {
  t: TFunction;
  viewType: InboxViewType;
  viewIsEmpty: boolean;
  displaySearchResults: boolean;
  filterScope: FilterScope;
  hasNoResults: boolean;
  onScopeChange: (scope: FilterScope) => void;
}): ReactNode | undefined => {
  if (viewIsEmpty) {
    return t(`inbox.heading.no_results.${viewType}`);
  }

  if (!displaySearchResults) return undefined;

  if (filterScope === 'ALL' && hasNoResults) {
    return '';
  }

  if (filterScope === 'ALL') {
    return (
      <>
        {t('inbox.heading.narrow_scope')}{' '}
        <Button variant="tinted" size="mini" onClick={() => onScopeChange('DEFAULT')}>
          {t('status.default')}
        </Button>{' '}
        <Button variant="tinted" size="mini" onClick={() => onScopeChange('ARCHIVE')}>
          {t('status.archive')}
        </Button>{' '}
        {t('word.or')}{' '}
        <Button variant="tinted" size="mini" onClick={() => onScopeChange('BIN')}>
          {t('status.bin')}
        </Button>
      </>
    );
  }

  return (
    <>
      {t('inbox.heading.expand_scope')}{' '}
      <Button variant="tinted" size="mini" onClick={() => onScopeChange('ALL')}>
        {t('inbox.heading.scope.all_folders')}
      </Button>
    </>
  );
};

const BANKRUPTCY_SERVICE_RESOURCE = 'urn:altinn:resource:app_brg_konkursbehandling';

export const isDueAtExpired = (dueAt?: string): boolean => {
  if (!dueAt) return false;
  const time = new Date(dueAt).getTime();
  if (Number.isNaN(time)) return false;
  return time < Date.now();
};

const sortGroupedDialogs = (arr: DialogListItemProps[]) => {
  return arr.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
};

const stripTitlelessSingleGroup = (
  groups: Record<string, DialogListGroupPropsSort>,
): Record<string, DialogListGroupPropsSort> => {
  const keys = Object.keys(groups);
  if (keys.length === 1 && !groups[keys[0]]?.title) return {};
  return groups;
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

const useGroupedDialogs = ({
  items,
  displaySearchResults,
  viewType,
  isLoading,
  isFetchingNextPage,
  onSeenByLogModalChange,
  onAccessInfoModalChange,
  hasNextPage,
  filterState,
  onFiltersChange,
}: UseGroupedDialogsProps): UseGroupedDialogsOutput => {
  const { t } = useTranslation();
  const format = useFormat();
  const [searchParams] = useSearchParams();
  const systemLabelActions = useDialogActions();
  const [allOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);
  const [bulkMode, setBulkMode] = useGlobalState<boolean>(QUERY_KEYS.BULK_MODE, false);
  const [bulkedIds, setBulkedIds] = useGlobalState<string[]>(QUERY_KEYS.BULK_MODE_SELECTED_IDS, []);
  const collapseGroups = !!displaySearchResults;
  const filterScope = (searchParams.get('systemLabel') || 'ALL') as FilterScope;
  const getSearchTitle = (viewType: InboxViewType, count: number, hasNextPage: boolean, filterScope: FilterScope) =>
    (hasNextPage ? t('word.moreThan') : '') +
    t(`inbox.heading.title.${viewType}`, { count }) +
    (viewType !== 'archive' && viewType !== 'bin' && filterScope !== 'ALL'
      ? t(`inbox.heading.scope.${filterScope}`)
      : '');

  const onScopeChange = (scope: FilterScope) => {
    if (!onFiltersChange || !filterState) return;
    const next: FilterState = { ...filterState };
    if (scope === 'ALL') {
      next.systemLabel = [];
    } else {
      next.systemLabel = [SCOPE_TO_SYSTEM_LABEL[scope]];
    }
    onFiltersChange(next);
  };

  const viewIsEmpty = !isLoading && items.length === 0 && !displaySearchResults;
  const description = getDialogListDescription({
    t,
    viewType,
    viewIsEmpty,
    displaySearchResults: !!displaySearchResults,
    filterScope,
    hasNoResults: !isLoading && items.length === 0,
    onScopeChange,
  });

  const clockPrefix = t('word.clock_prefix');
  const formatString = `do MMMM yyyy ${clockPrefix ? `'${clockPrefix}' ` : ''}HH.mm`;
  const allWithinSameYear = items.every((d) => new Date(d.contentUpdatedAt).getFullYear() === new Date().getFullYear());
  const useDateGrouping = !displaySearchResults;

  const onToggleBulkId = (id: string) => {
    if (bulkedIds?.includes(id)) {
      const newBulkedIds = bulkedIds.filter((bulkedId) => bulkedId !== id);
      setBulkedIds(newBulkedIds);
      if (!newBulkedIds.length) {
        setBulkMode(false);
      }
    } else {
      setBulkedIds([...bulkedIds, id]);
    }
  };

  const formatDialogItem = (item: InboxItemInput, groupId: string): DialogListItemProps => {
    const contextMenu: ContextMenuProps = {
      id: 'dialog-context-menu-' + item.id,
      placement: 'right',
      color: item.recipient.type === 'person' ? 'person' : 'company',
      items: [
        {
          id: 'select-multiple',
          groupId: 'mark-as',
          title: t('bulk_action.select_multiple'),
          icon: CheckmarkIcon,
          onClick: () => {
            setBulkMode(true);
            setBulkedIds([item.id]);
          },
        },
        ...(item ? systemLabelActions(item.id, item.label, item.unread) : []),
        ...(item.seenByLabel
          ? [
              {
                id: 'seenby-log',
                groupId: 'logs',
                title: item.seenByLabel,
                icon: item.seenByLog,
                onClick: () => {
                  onSeenByLogModalChange({
                    title: item.title,
                    dialogId: item.id,
                    items: item.seenByLog.items,
                  });
                },
              },
            ]
          : []),
        {
          id: 'access-info',
          groupId: 'logs',
          title: t('dialog.access_info.menu_item'),
          icon: InformationSquareIcon,
          onClick: () => onAccessInfoModalChange(item.id),
        },
      ],
      'aria-label': t('dialog.context_menu.label', { title: item.title }),
    };

    const disabledBulkItem = bulkMode && bulkedIds.length >= MAX_COUNT_BULK_DIALOGS && !bulkedIds.includes(item.id);

    return {
      groupId,
      title: item.title,
      id: item.id,
      recipientLabel: t('word.to'),
      archivedAtLabel: item.viewType === 'archive' ? t(`status.archive`) : '',
      trashedAtLabel: item.viewType === 'bin' ? t(`status.bin`) : '',
      sender: item.sender,
      summary: item.summary,
      recipient: item.recipient,
      color: item.recipient.type?.toLowerCase() as 'person' | 'company',
      grouped: allOrganizationsSelected,
      attachmentsCount: item.guiAttachmentCount,
      seenByLog: item.seenByLog,
      unread: item.unread,
      unreadLabel: t('word.unread'),
      unreadItemsLabel: t('word.unread_content'),
      unreadItems: item.unreadItems,
      selectable: bulkMode,
      tabIndex: bulkMode ? 0 : undefined,
      selected: bulkedIds?.includes(item.id),
      controls: bulkMode ? (
        <ItemSelect
          checked={bulkedIds?.includes(item.id)}
          onClick={() => onToggleBulkId(item.id)}
          disabled={disabledBulkItem}
        />
      ) : (
        <ContextMenu {...contextMenu} />
      ),
      status: getDialogStatus(item.status, t),
      extendedStatusLabel: item.extendedStatus,
      updatedAt: item.contentUpdatedAt,
      updatedAtLabel: format(item.contentUpdatedAt, formatString),
      dueAtLabel: item.dueAt ? t('dialog.due_at', { date: format(item.dueAt, formatString) }) : undefined,
      dueAtExpired: isDueAtExpired(item.dueAt),
      dueAt: item.dueAt,
      sentCount: item.fromPartyTransmissionsCount ?? 0,
      receivedCount: item.fromServiceOwnerTransmissionsCount ?? 0,
      ariaLabel: item.title,
      ...(bulkMode ? { onClick: () => onToggleBulkId(item.id) } : {}),
      disabled: disabledBulkItem,
      as: bulkMode
        ? 'button'
        : (props: LinkProps) => (
            <Link state={{ fromView: location.pathname }} {...props} to={`/inbox/${item.id}/${location.search}`} />
          ),
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  const grouped = useMemo((): UseGroupedDialogsOutput => {
    if (isLoading) {
      return {
        groupedDialogs: renderLoadingItems(5),
        groups: {
          loading: { title: t(`word.loading`) },
        },
      };
    }

    if (!displaySearchResults && !useDateGrouping && !isLoading) {
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
        groups: stripTitlelessSingleGroup(groups),
        title: getSearchTitle(viewType, items.length, hasNextPage, filterScope),
      };
    }

    const groupedItems: GroupedItem[] = [];
    const bankruptcyDialogs = items.filter((item) => item.serviceResource === BANKRUPTCY_SERVICE_RESOURCE);
    const regularDialogs = items.filter((item) => item.serviceResource !== BANKRUPTCY_SERVICE_RESOURCE);
    const title = getSearchTitle(viewType, regularDialogs.length, hasNextPage, filterScope);

    if (bankruptcyDialogs.length > 0) {
      groupedItems.push({
        id: 'bankruptcy',
        items: bankruptcyDialogs,
        // Konkurs dialogs should always be in top
        orderIndex: 9999,
      });
    }

    if (collapseGroups) {
      groupedItems.push({
        id: 'collapsed',
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

    return { groupedDialogs, groups: stripTitlelessSingleGroup(groups), title };
  }, [items, displaySearchResults, t, format, viewType, allWithinSameYear, isLoading, isFetchingNextPage]);

  return { ...grouped, description };
};

export default useGroupedDialogs;
