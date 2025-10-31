import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BookmarkIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  HandshakeFillIcon,
  InboxFillIcon,
  InformationSquareIcon,
  LeaveIcon,
  PersonCircleIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import { createMessageBoxLink } from '../../../auth';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import { createMenuItemComponent, isRouteSelected } from './shared.tsx';
import type { UseGlobalMenuProps } from './useGlobalMenu.tsx';

export function buildInboxMenu({
  t,
  currentEndUserName,
  pathname,
  currentSearchQuery,
  fromView,
  showAmLink,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  fromView?: string;
  showAmLink?: boolean;
}): UseGlobalMenuProps {
  const menuGroups = {
    shortcuts: {
      divider: showAmLink,
      defaultIconTheme: 'transparent' as Theme,
      defaultItemSize: 'sm' as MenuItemSize,
      title: t('word.shortcuts'),
    },
    global: {
      divider: false,
    },
    'profile-shortcut': {
      divider: true,
      title: t('parties.current_end_user', { name: currentEndUserName ?? 'n/a' }),
    },
  };

  const betaShortcuts: MenuItemProps[] = [
    {
      id: 'beta-about',
      dataTestId: 'sidebar-about',
      groupId: 'shortcuts',
      icon: InformationSquareIcon,
      title: t('altinn.beta.about'),
      as: createMenuItemComponent({
        to: PageRoutes.about + pruneSearchQueryParams(currentSearchQuery),
      }),
      selected: isRouteSelected(pathname, PageRoutes.about, fromView),
    },
    {
      id: 'beta-exit',
      dataTestId: 'sidebar-exit',
      groupId: 'shortcuts',
      icon: LeaveIcon,
      title: t('altinn.beta.exit'),
      as: createMenuItemComponent({
        to: createMessageBoxLink(),
      }),
    },
  ];

  const inboxItems: MenuItemProps[] = [
    {
      id: '1',
      dataTestId: 'sidebar-inbox',
      groupId: 'global',
      size: 'lg',
      icon: InboxFillIcon,
      title: t('sidebar.inbox'),
      selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
      }),
      items: [
        {
          id: '2',
          dataTestId: 'sidebar-drafts',
          groupId: '2',
          icon: DocPencilIcon,
          title: t('sidebar.drafts'),
          selected: isRouteSelected(pathname, PageRoutes.drafts, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.drafts + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '3',
          dataTestId: 'sidebar-sent',
          groupId: '2',
          icon: FileCheckmarkIcon,
          title: t('sidebar.sent'),
          selected: isRouteSelected(pathname, PageRoutes.sent, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.sent + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '4',
          dataTestId: 'sidebar-saved-searches',
          groupId: '3',
          icon: BookmarkIcon,
          title: t('sidebar.saved_searches'),
          selected: isRouteSelected(pathname, PageRoutes.savedSearches, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.savedSearches + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '5',
          dataTestId: 'sidebar-archive',
          groupId: '4',
          icon: ArchiveIcon,
          title: t('sidebar.archived'),
          selected: isRouteSelected(pathname, PageRoutes.archive, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.archive + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
        {
          id: '6',
          dataTestId: 'sidebar-bin',
          groupId: '4',
          icon: TrashIcon,
          title: t('sidebar.deleted'),
          selected: isRouteSelected(pathname, PageRoutes.bin, fromView),
          as: createMenuItemComponent({
            to: PageRoutes.bin + pruneSearchQueryParams(currentSearchQuery),
          }),
        },
      ],
    },
  ];

  const sidebarMenu: MenuProps = {
    groups: {
      ...menuGroups,
      shortcuts: {
        ...menuGroups.shortcuts,
        divider: false,
      },
    },
    variant: 'subtle',
    defaultIconTheme: 'default',
    items: [
      ...inboxItems.map((item, idx) => ({
        ...item,
        iconTheme: idx === 0 ? 'base' : item.iconTheme,
      })),
      ...betaShortcuts,
    ],
  };

  const mobileMenu: MenuProps = {
    groups: menuGroups,
    items: [
      ...inboxItems.map((item, idx) => ({
        ...item,
        items: (item.items ?? []).map((it) => ({
          ...it,
          dataTestId: (it.dataTestId ?? '') + '-mobile-menu' + (it.dataTestId ? '' : '-' + idx),
        })),
        dataTestId: (item.dataTestId ?? '') + '-mobile-menu' + (item.dataTestId ? '' : '-' + idx),
      })),
      {
        id: 'am',
        groupId: 'global',
        size: 'lg',
        icon: HandshakeFillIcon,
        hidden: !showAmLink,
        as: 'a',
        href: 'https://am.ui.at23.altinn.cloud/accessmanagement/ui/users',
        title: t('altinn.access_management'),
        selected: false,
      },
      ...betaShortcuts,
      {
        groupId: 'profile-shortcut',
        id: 'profile',
        size: 'md',
        as: createMenuItemComponent({
          to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
        }),
        icon: PersonCircleIcon,
        iconTheme: 'transparent',
        title: t('sidebar.profile'),
        selected: false,
        expanded: true,
        items: [],
      },
    ],
    defaultIconTheme: 'tinted',
  };

  const desktopMenu: MenuProps = {
    ...mobileMenu,
    items: [{ ...mobileMenu.items[0], expanded: false, items: [] }, ...mobileMenu.items.slice(1)],
    groups: {
      ...mobileMenu.groups,
      shortcuts: {
        ...mobileMenu.groups?.shortcuts,
        divider: true,
      },
    },
  };

  return { sidebarMenu, mobileMenu, desktopMenu };
}
