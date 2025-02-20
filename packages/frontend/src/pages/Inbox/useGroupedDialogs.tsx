import type {
  DialogListGroupProps,
  DialogListItemProps,
  DialogListItemState,
  DialogStatusValue,
  FilterState,
} from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import type { InboxViewType } from '../../api/useDialogs.tsx';
import type { InboxItemInput } from '../../components';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';

interface GroupedItem {
  id: string | number;
  label: string;
  items: InboxItemInput[];
}

interface UseGroupedDialogsOutput {
  mappedGroupedDialogs: DialogListItemProps[];
  groups?: Record<string, DialogListGroupProps>;
}

interface UseGroupedDialogsProps {
  items: InboxItemInput[];
  filters: FilterState;
  displaySearchResults: boolean;
  viewType: InboxViewType;
  isLoading: boolean;
}

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
    id: item.id,
    sender: {
      name: item.sender.name,
      type: item.sender.isCompany ? 'company' : 'person',
      imageUrl: item.sender.imageURL,
      imageUrlAlt: t('dialog.imageAltURL', { companyName: item.sender.name }),
    },
    summary: item.summary,
    state: getDialogState(viewType),
    recipient: {
      name: item.receiver.name,
      type: item.receiver.isCompany ? 'company' : 'person',
      imageUrl: item.receiver.imageURL!,
      imageUrlAlt: t('dialog.imageAltURL', { companyName: item.receiver.name }),
    },
    attachmentsCount: item.guiAttachmentCount,
    seenBy: {
      seenByEndUser: item.isSeenByEndUser,
      seenByOthersCount: item.seenByOthersCount,
      label: item.seenByLabel,
    },
    status: {
      label: t(`filter.query.${item.status.replace(/-/g, '_').toLowerCase()}`),
      value: status.replace(/-/g, '_').toLowerCase() as unknown as DialogStatusValue,
    },
    seen: item.isSeenByEndUser,
    updatedAt: item.updatedAt,
    updatedAtLabel: format(item.updatedAt, formatString),
    as: (props: LinkProps) => (
      <Link state={{ fromView: location.pathname }} {...props} to={`/inbox/${item.id}/${location.search}`} />
    ),
  });

  return useMemo(() => {
    if (isLoading) {
      return {
        mappedGroupedDialogs: renderLoadingItems(5),
        groups: {
          loading: { title: t(`word.loading`) },
        },
      };
    }

    if (!displaySearchResults && isNotInbox) {
      return {
        mappedGroupedDialogs: items.map((item) => formatDialogItem(item, viewType)),
        groups: {
          [viewType]: { title: t(`inbox.heading.title.${viewType}`, { count: items.length }) },
        },
      };
    }

    const groupedItems = items.reduce<GroupedItem[]>((acc, item, _, list) => {
      const createdAt = new Date(item.createdAt);

      const groupKey = displaySearchResults
        ? item.viewType
        : allWithinSameYear
          ? format(createdAt, 'LLLL')
          : format(createdAt, 'yyyy');

      const label = displaySearchResults
        ? t(`inbox.heading.search_results.${groupKey}`, {
            count: list.filter((i) => i.viewType === groupKey).length,
          })
        : groupKey;

      const existingGroup = acc.find((group) => group.id === groupKey);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        acc.push({ id: groupKey, label, items: [item] });
      }

      return acc;
    }, []);

    const groups = Object.fromEntries(groupedItems.map(({ id, label }) => [id, { title: label }]));

    const mappedGroupedDialogs = groupedItems.flatMap(({ id, items }) =>
      items.map((item) => formatDialogItem(item, id.toString())),
    );

    return { mappedGroupedDialogs, groups };
  }, [items, displaySearchResults, t, format, isNotInbox, viewType, allWithinSameYear]);
};

export default useGroupedDialogs;
