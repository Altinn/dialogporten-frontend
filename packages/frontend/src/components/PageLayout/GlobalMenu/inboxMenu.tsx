import type { MenuItemProps, MenuItemSize, MenuProps, Theme } from '@altinn/altinn-components';
import {
  ArchiveIcon,
  BookmarkIcon,
  Buildings2Icon,
  ChatExclamationmarkIcon,
  DocPencilIcon,
  FileCheckmarkIcon,
  InboxFillIcon,
  InformationSquareIcon,
  LeaveIcon,
  MenuGridIcon,
  PadlockLockedFillIcon,
  PersonCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@navikt/aksel-icons';
import {
  createMessageBoxLink,
  getAboutNewAltinnLink,
  getAccessAMUILink,
  getNeedHelpLink,
  getNewFormLink,
  getStartNewBusinessLink,
} from '../../../auth';
import { i18n } from '../../../i18n/config.ts';
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
  currentPartyUuid,
}: {
  t: (key: string, vars?: Record<string, string>) => string;
  currentEndUserName?: string;
  pathname: string;
  currentSearchQuery: string;
  fromView?: string;
  currentPartyUuid?: string;
}): UseGlobalMenuProps {
  const menuGroups = {
    shortcuts: {
      divider: true,
      defaultIconTheme: 'transparent' as Theme,
      defaultItemSize: 'sm' as MenuItemSize,
      title: t('word.shortcuts'),
    },
    global: {
      divider: false,
    },
    help: {
      divider: true,
      defaultIconTheme: 'transparent' as Theme,
      defaultItemSize: 'sm' as MenuItemSize,
    },
    'profile-shortcut': {
      divider: true,
      title: t('parties.current_end_user', { name: currentEndUserName ?? 'n/a' }),
    },
  };

  const shortcuts: MenuItemProps[] = [
    {
      id: 'beta-exit',
      'data-testid': 'sidebar-exit',
      groupId: 'shortcuts',
      icon: LeaveIcon,
      title: t('altinn.beta.exit'),
      as: createMenuItemComponent({
        to: createMessageBoxLink(currentPartyUuid),
      }),
    },
    {
      id: 'new-schema',
      'data-testid': 'sidebar-new-schema',
      groupId: 'shortcuts',
      icon: PlusIcon,
      title: t('altinn.new_schema'),
      as: createMenuItemComponent({
        to: getNewFormLink(currentPartyUuid, i18n.language),
      }),
    },
  ];

  const helpItems: MenuItemProps[] = [
    {
      id: 'about-altinn',
      'data-testid': 'about-altinn',
      groupId: 'help',
      icon: InformationSquareIcon,
      title: t('global_menu.about_altinn'),
      as: createMenuItemComponent({
        to: getAboutNewAltinnLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'start-business',
      'data-testid': 'start-business',
      groupId: 'help',
      icon: Buildings2Icon,
      title: t('global_menu.start_business'),
      as: createMenuItemComponent({
        to: getStartNewBusinessLink(currentPartyUuid, i18n.language),
      }),
    },
    {
      id: 'need-help',
      'data-testid': 'need-help',
      groupId: 'help',
      icon: ChatExclamationmarkIcon,
      title: t('global_menu.need_help'),
      as: createMenuItemComponent({
        to: getNeedHelpLink(currentPartyUuid, i18n.language),
      }),
    },
  ];

  const inboxItems: MenuItemProps[] = [
    {
      id: '1',
      'data-testid': 'sidebar-inbox',
      groupId: 'global',
      size: 'lg',
      icon: InboxFillIcon,
      title: t('sidebar.inbox'),
      selected: isRouteSelected(pathname, PageRoutes.inbox, fromView),
      expanded: true,
      as: createMenuItemComponent({
        to: PageRoutes.inbox + pruneSearchQueryParams(currentSearchQuery),
      }),
      badge: {
        label: t('word.beta'),
        color: 'neutral',
        variant: 'base',
      },
      items: [
        {
          id: '2',
          size: 'md',
          'data-testid': 'sidebar-drafts',
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
          size: 'md',
          'data-testid': 'sidebar-sent',
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
          size: 'md',
          'data-testid': 'sidebar-saved-searches',
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
          size: 'md',
          'data-testid': 'sidebar-archive',
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
          size: 'md',
          'data-testid': 'sidebar-bin',
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
    variant: 'tinted',
    groups: {
      ...menuGroups,
      shortcuts: {
        ...menuGroups.shortcuts,
        divider: false,
      },
    },
    items: [
      ...inboxItems.map((item, idx) => ({
        ...item,
        badge: idx === 0 ? undefined : item.badge,
      })),
      ...shortcuts,
    ],
  };

  const mobileMenu: MenuProps = {
    groups: menuGroups,
    items: [
      ...inboxItems.map((item, idx) => ({
        ...item,
        items: (item.items ?? []).map((it) => ({
          ...it,
          dataTestId: (it['data-testid'] ?? '') + '-mobile-menu' + (it['data-testid'] ? '' : '-' + idx),
        })),
        dataTestId: (item['data-testid'] ?? '') + '-mobile-menu' + (item['data-testid'] ? '' : '-' + idx),
      })),
      {
        id: 'am',
        groupId: 'global',
        size: 'lg',
        icon: PadlockLockedFillIcon,
        as: 'a',
        href: getAccessAMUILink(currentPartyUuid),
        title: t('altinn.access_management'),
        selected: false,
        badge: {
          label: t('word.beta'),
          color: 'neutral',
          variant: 'base',
        },
      },
      {
        id: 'all-forms',
        groupId: 'global',
        size: 'lg',
        icon: MenuGridIcon,
        title: t('global_menu.all_forms_services'),
        as: createMenuItemComponent({
          to: getNewFormLink(currentPartyUuid, i18n.language),
        }),
        selected: false,
      },
      ...helpItems,
      {
        groupId: 'profile-shortcut',
        id: 'profile',
        size: 'sm',
        as: createMenuItemComponent({
          to: PageRoutes.profile + pruneSearchQueryParams(currentSearchQuery),
        }),
        icon: PersonCircleIcon,
        title: t('sidebar.profile'),
        selected: false,
        expanded: true,
        items: [],
      },
    ],
  };
  const desktopMenu: MenuProps = {
    ...mobileMenu,
    items: [{ ...mobileMenu.items[0], expanded: false, items: [] }, ...mobileMenu.items.slice(1)],
    groups: {
      ...mobileMenu.groups,
    },
  };
  mobileMenu.items.push(...shortcuts);

  return { sidebarMenu, mobileMenu, desktopMenu };
}
