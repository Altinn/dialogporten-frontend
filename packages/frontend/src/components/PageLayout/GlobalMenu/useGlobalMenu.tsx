import type { BadgeProps, MenuItemProps } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BookmarkIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  InboxIcon,
  MenuGridIcon,
  PersonChatIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import type { InboxViewType } from '../../../api/useDialogs.tsx';
import { useParties } from '../../../api/useParties.ts';
import { getGlobalSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { useWindowSize } from '../useWindowSize.tsx';
export type SideBarView = InboxViewType | 'saved-searches' | 'archive' | 'bin';

export type ViewCountRecord = {
  [key in SideBarView]: number;
};

interface UseSidebarProps {
  itemsPerViewCount: ViewCountRecord;
  needsAttentionPerView: ViewCountRecord;
  dialogCountsInconclusive: boolean;
}

interface UseGlobalMenuProps {
  sidebar: MenuItemProps[];
  global: MenuItemProps[];
}

export const getAlertBadgeProps = (count: number): BadgeProps | undefined => {
  if (count > 0) {
    return {
      label: count.toString(),
      size: 'xs',
      theme: 'base',
      color: 'alert',
    };
  }
};

const getBadgeProps = (count: number, countInconclusive?: boolean): BadgeProps | undefined => {
  if (countInconclusive) {
    return {
      label: '',
      size: 'xs',
    };
  }
  if (count > 0) {
    return {
      label: count.toString(),
      size: 'sm',
    };
  }
};

const createMenuItemComponent =
  ({ to, isExternal = false }: { to: string; isExternal?: boolean }): React.FC<MenuItemProps> =>
  (props) => <Link {...props} to={to} {...(isExternal ? { target: '__blank', rel: 'noopener noreferrer' } : {})} />;

export const useGlobalMenu = ({
  itemsPerViewCount,
  needsAttentionPerView,
  dialogCountsInconclusive,
}: UseSidebarProps): UseGlobalMenuProps => {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const { selectedProfile } = useParties();
  const globalSearchQueryParams = getGlobalSearchQueryParams(search);
  const { isTabletOrSmaller } = useWindowSize();
  const linksMenuItems: MenuItemProps[] = [
    {
      id: 'all-services',
      groupId: 'global',
      icon: MenuGridIcon,
      title: t('menuBar.all_services'),
      size: 'lg',
      as: createMenuItemComponent({
        to: 'https://info.altinn.no/skjemaoversikt',
        isExternal: true,
      }),
    },
    {
      id: 'chat',
      groupId: 'global',
      icon: PersonChatIcon,
      title: t('menuBar.chat'),
      size: 'lg',
      as: createMenuItemComponent({
        to: 'https://info.altinn.no/hjelp/',
        isExternal: true,
      }),
    },
  ];
  const sidebar: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: { svgElement: InboxIcon, theme: 'base' },
      title: t('sidebar.inbox'),
      iconBadge: getAlertBadgeProps(needsAttentionPerView.inbox),
      badge: getBadgeProps(itemsPerViewCount.inbox, dialogCountsInconclusive),
      selected: pathname === PageRoutes.inbox,
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + globalSearchQueryParams,
      }),
      items: [
        {
          id: '2',
          groupId: '2',
          icon: DocPencilIcon,
          title: t('sidebar.drafts'),
          badge: getBadgeProps(itemsPerViewCount.drafts, dialogCountsInconclusive),
          selected: pathname === PageRoutes.drafts,
          as: createMenuItemComponent({
            to: PageRoutes.drafts + globalSearchQueryParams,
          }),
        },
        {
          id: '3',
          groupId: '2',
          icon: FileCheckmarkIcon,
          title: t('sidebar.sent'),
          badge: getBadgeProps(itemsPerViewCount.sent, dialogCountsInconclusive),
          selected: pathname === PageRoutes.sent,
          as: createMenuItemComponent({
            to: PageRoutes.sent + globalSearchQueryParams,
          }),
        },
        {
          id: '4',
          groupId: '3',
          icon: BookmarkIcon,
          title: t('sidebar.saved_searches'),
          badge: getBadgeProps(itemsPerViewCount['saved-searches']),
          selected: pathname === PageRoutes.savedSearches,
          as: createMenuItemComponent({
            to: PageRoutes.savedSearches + globalSearchQueryParams,
          }),
        },
        {
          id: '5',
          groupId: '4',
          icon: ArchiveIcon,
          title: t('sidebar.archived'),
          badge: getBadgeProps(itemsPerViewCount.archive, dialogCountsInconclusive),
          selected: pathname === PageRoutes.archive,
          as: createMenuItemComponent({
            to: PageRoutes.archive + globalSearchQueryParams,
          }),
        },
        {
          id: '6',
          groupId: '4',
          icon: TrashIcon,
          title: t('sidebar.deleted'),
          badge: getBadgeProps(itemsPerViewCount.bin, dialogCountsInconclusive),
          selected: pathname === PageRoutes.bin,
          as: createMenuItemComponent({
            to: PageRoutes.bin + globalSearchQueryParams,
          }),
        },
      ],
    },
  ];

  const global: MenuItemProps[] = [
    {
      ...sidebar[0],
      color: selectedProfile,
      /* do not show sub items on viewports bigger than tablet since they are already shown in the sidebar */
      items: isTabletOrSmaller ? sidebar[0].items : [],
      expanded: isTabletOrSmaller,
    },
    ...linksMenuItems,
  ];

  return { sidebar, global };
};
