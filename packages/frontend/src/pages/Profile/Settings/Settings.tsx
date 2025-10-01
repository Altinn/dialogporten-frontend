import {
  type AvatarProps,
  type BreadcrumbsProps,
  Heading,
  List,
  PageBase,
  PageNav,
  SettingsItem,
  type SettingsItemProps,
  SettingsSection,
  Toolbar,
  formatDisplayName,
} from '@altinn/altinn-components';
import { BellIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { pruneSearchQueryParams } from '../../Inbox/queryParams.ts';
import { PageRoutes } from '../../routes';
import {
  type NotificationType,
  UserNotificationSettingsModal,
} from '../PartiesOverviewPage/UserNotificationSettingsModal';
import { flattenParties } from '../PartiesOverviewPage/partyFieldToNotificationsList';

export const Settings = () => {
  const { user } = useProfile();
  const { search } = useLocation();
  const [showNotificationModal, setShowNotificationModal] = useState<NotificationType>('none');
  const [searchValue, setSearchValue] = useState('');
  const { parties: normalParties } = useParties();
  const { search: currentSearchQuery } = useLocation();
  const flattenedParties = flattenParties(normalParties);
  const flattenedPartiesCount = flattenedParties?.filter((party) => party.partyType === 'Organization')?.length || 0;

  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('component.settings') });

  const getBreadcrumbs = (person?: AvatarProps, reverseNameOrder?: boolean) => {
    if (!person) return [];
    return [
      {
        label: t('word.frontpage'),
        as: (props) => <Link {...props} to={PageRoutes.inbox + pruneSearchQueryParams(search)} />,
      },
      {
        label: formatDisplayName({
          fullName: person.name,
          type: person.type as 'person' | 'company',
          reverseNameOrder,
        }),
        href: PageRoutes.profile,
      },
      {
        label: t('sidebar.profile.notifications'),
        href: PageRoutes.partiesOverview,
      },
    ] as BreadcrumbsProps['items'];
  };

  const personalNotificationSettings: SettingsItemProps[] = [
    {
      icon: { svgElement: MobileIcon, theme: 'default' },
      title: t('profile.settings.sms_notifications'),
      value: user?.phoneNumber || 'Ingen telefonnummer registrert',
      badge: {
        color: 'company',
        label: t('word.change'),
      },
      onClick: () => setShowNotificationModal('phoneNumber'),
      linkIcon: true,
      as: 'button',
    },
    {
      icon: { svgElement: PaperplaneIcon, theme: 'default' },
      title: t('profile.notifications.email_for_alerts'),
      value: user?.email || '',
      badge: {
        color: 'company',
        label: t('word.change'),
      },
      onClick: () => setShowNotificationModal('email'),
      linkIcon: true,
      as: 'button',
    },
    {
      icon: { svgElement: PaperplaneIcon, theme: 'default' },
      title: t('profile.notifications.email_for_alerts'),
      value: user?.email || '',
      badge: {
        color: 'company',
        label: t('word.change'),
      },
      onClick: () => setShowNotificationModal('email'),
      linkIcon: true,
      as: 'button',
    },
  ];

  const personalNotificationSettingsFiltered = personalNotificationSettings.filter(
    (setting) =>
      String(setting.value || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      String(setting.title || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase()),
  );

  const otherSettings: SettingsItemProps[] = [
    {
      icon: BellIcon,
      title: t('profile.settings.notification_settings'),
      badge: !!flattenedPartiesCount && { label: `${flattenedPartiesCount} aktører`, color: 'company' },
      as: (props) => <Link to={PageRoutes.notifications + pruneSearchQueryParams(currentSearchQuery)} {...props} />,
      linkIcon: true,
    },
  ];

  const otherSettingsFiltered = otherSettings.filter(
    (setting) =>
      String(setting.value || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      String(setting.title || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase()),
  );

  return (
    <PageBase>
      <PageNav
        breadcrumbs={getBreadcrumbs({
          name: user?.party?.name ?? '',
          type: 'person',
        })}
      />
      <Heading size="xl">{t('sidebar.profile.settings')}</Heading>

      <Toolbar
        search={{
          name: 'party-search',
          placeholder: t('parties.search.placeholder'),
          value: searchValue,
          onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
          onClear: () => setSearchValue(''),
        }}
      />
      <Heading size="md">{t('profile.settings.contact_settings')}</Heading>
      {personalNotificationSettingsFiltered.length > 0 ? (
        <>
          <SettingsSection>
            <List>
              {personalNotificationSettingsFiltered.map((setting, index) => (
                <SettingsItem key={index} {...setting} />
              ))}
            </List>
          </SettingsSection>
        </>
      ) : (
        <span>{t('emptyState.noHits.title')}</span>
      )}
      <Heading size="md">{t('profile.settings.more_contact_settings')}</Heading>
      {otherSettingsFiltered.length > 0 ? (
        <>
          <SettingsSection>
            <List>
              {otherSettingsFiltered.map((setting, index) => (
                <SettingsItem key={index} {...setting} />
              ))}
            </List>
          </SettingsSection>
        </>
      ) : (
        <span>{t('emptyState.noHits.title')}</span>
      )}
      <UserNotificationSettingsModal notificationType={showNotificationModal} setShowModal={setShowNotificationModal} />
    </PageBase>
  );
};
