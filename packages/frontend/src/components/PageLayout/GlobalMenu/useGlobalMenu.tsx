import type { BadgeProps, MenuItemProps } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BellIcon,
  BookmarkIcon,
  ClockDashedIcon,
  CogIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  HandshakeIcon,
  HeartIcon,
  InboxFillIcon,
  MenuGridIcon,
  PadlockUnlockedIcon,
  PersonChatIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import type { InboxViewType } from '../../../api/hooks/useDialogs.tsx';
import { useParties } from '../../../api/hooks/useParties.ts';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
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
      color: 'danger',
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
  (props) => {
    // @ts-ignore
    return <Link {...props} to={to} {...(isExternal ? { target: '__blank', rel: 'noopener noreferrer' } : {})} />;
  };

export const useGlobalMenu = ({
  itemsPerViewCount,
  needsAttentionPerView,
  dialogCountsInconclusive,
}: UseSidebarProps): UseGlobalMenuProps => {
  const { t } = useTranslation();
  const { pathname, search: currentSearchQuery } = useLocation();
  const { selectedProfile } = useParties();
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
  const sidebarInbox: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: { svgElement: InboxFillIcon, theme: 'base' },
      title: t('sidebar.inbox'),
      iconBadge: getAlertBadgeProps(needsAttentionPerView.inbox),
      badge: getBadgeProps(itemsPerViewCount.inbox, dialogCountsInconclusive),
      selected: pathname === PageRoutes.inbox,
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
      }),
      items: [
        {
          id: '2',
          groupId: '2',
          icon: { svgElement: DocPencilIcon, theme: 'default' },
          title: t('sidebar.drafts'),
          badge: getBadgeProps(itemsPerViewCount.drafts, dialogCountsInconclusive),
          selected: pathname === PageRoutes.drafts,
          as: createMenuItemComponent({
            to: PageRoutes.drafts + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '2',
          icon: { svgElement: FileCheckmarkIcon, theme: 'default' },
          title: t('sidebar.sent'),
          badge: getBadgeProps(itemsPerViewCount.sent, dialogCountsInconclusive),
          selected: pathname === PageRoutes.sent,
          as: createMenuItemComponent({
            to: PageRoutes.sent + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '4',
          groupId: '3',
          icon: { svgElement: BookmarkIcon, theme: 'default' },
          title: t('sidebar.saved_searches'),
          badge: getBadgeProps(itemsPerViewCount['saved-searches']),
          selected: pathname === PageRoutes.savedSearches,
          as: createMenuItemComponent({
            to: PageRoutes.savedSearches + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '5',
          groupId: '4',
          icon: { svgElement: ArchiveIcon, theme: 'default' },
          title: t('sidebar.archived'),
          badge: getBadgeProps(itemsPerViewCount.archive, dialogCountsInconclusive),
          selected: pathname === PageRoutes.archive,
          as: createMenuItemComponent({
            to: PageRoutes.archive + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '6',
          groupId: '4',
          icon: { svgElement: TrashIcon, theme: 'default' },
          title: t('sidebar.deleted'),
          badge: getBadgeProps(itemsPerViewCount.bin, dialogCountsInconclusive),
          selected: pathname === PageRoutes.bin,
          as: createMenuItemComponent({
            to: PageRoutes.bin + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const profileSidebar: MenuItemProps[] = [
    {
      id: '1',
      groupId: 'global',
      size: 'lg',
      icon: { svgElement: InboxFillIcon, theme: 'base' },
      title: t('sidebar.profile'),
      selected: pathname === PageRoutes.profile,
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
      }),
      items: [
        {
          id: '2',
          groupId: '2',
          icon: { svgElement: HeartIcon, theme: 'default' },
          title: t('sidebar.profile.parties'),
          selected: pathname === PageRoutes.partiesOverview,
          as: createMenuItemComponent({
            to: PageRoutes.partiesOverview + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          groupId: '3',
          icon: { svgElement: HandshakeIcon, theme: 'default' },
          title: t('sidebar.profile.authorize'),
          selected: pathname === PageRoutes.authorize,
          as: createMenuItemComponent({
            to: PageRoutes.authorize + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '4',
          groupId: '3',
          icon: { svgElement: PadlockUnlockedIcon, theme: 'default' },
          title: t('sidebar.profile.access'),
          selected: pathname === PageRoutes.access,
          as: createMenuItemComponent({
            to: PageRoutes.access + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '5',
          groupId: '2',
          icon: { svgElement: BellIcon, theme: 'default' },
          title: t('sidebar.profile.notifications'),
          selected: pathname === PageRoutes.notifications,
          as: createMenuItemComponent({
            to: PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '6',
          groupId: '4',
          icon: { svgElement: CogIcon, theme: 'default' },
          title: t('sidebar.profile.settings'),
          selected: pathname === PageRoutes.settings,
          as: createMenuItemComponent({
            to: PageRoutes.settings + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '7',
          groupId: '5',
          icon: { svgElement: ClockDashedIcon, theme: 'default' },
          title: t('sidebar.profile.activities'),
          selected: pathname === PageRoutes.activities,
          as: createMenuItemComponent({
            to: PageRoutes.activities + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const sidebar = pathname.includes(PageRoutes.profile) ? profileSidebar : sidebarInbox;

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
