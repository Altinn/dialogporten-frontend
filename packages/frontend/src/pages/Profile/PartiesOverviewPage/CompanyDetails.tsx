import { type AccountListItemProps, Divider, List, Section, SettingsItem } from '@altinn/altinn-components';
import { Buildings2Icon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { CompanyNotificationSettingsModal } from '../NotificationsPage/CompanyNotificationSettingsModal';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage';
import { useNotificationSettingsForCurrentUser } from '../useNotificationSettings';
import { AccountToolbar } from './AccountToolbar';
import { PartyDetailsSetting } from './PartyDetailsSetting';

export interface CompanyDetailsProps extends AccountListItemProps {
  party?: PartyFieldsFragment;
  parentAccount?: NotificationAccountsType;
  userId?: string;
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  contactEmailAddress?: string;
  contactPhoneNumber?: string;
  address?: string;
}

export const CompanyDetails = ({
  uniqueId,
  party,
  parentAccount,
  favourite,
  onToggleFavourite,
  icon,
  isCurrentEndUser,
  type,
  name,
  id,
}: CompanyDetailsProps) => {
  const [notificationParty, setNotificationParty] = useState<NotificationAccountsType | null>(null);
  const queryClient = useQueryClient();
  const { notificationSettingsForCurrentUser, isLoading: isLoadingNotificaitonSettingsForCurrentUser } =
    useNotificationSettingsForCurrentUser();
  const notificationSettingsForParty = notificationSettingsForCurrentUser?.find(
    (setting) => setting?.partyUuid === party?.partyUuid,
  );

  const onSave = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
  };

  if (!party) {
    return null;
  }
  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar
        type={type}
        name={name}
        id={id}
        favourite={favourite || false}
        onToggleFavourite={onToggleFavourite}
        icon={icon}
        isCurrentEndUser={isCurrentEndUser || false}
      />
      <Divider />
      {!isLoadingNotificaitonSettingsForCurrentUser && (
        <PartyDetailsSetting
          notificationSetting={notificationSettingsForParty || undefined}
          setNotificationParty={() => setNotificationParty(party as NotificationAccountsType)}
        />
      )}
      {notificationParty && (
        <CompanyNotificationSettingsModal
          notificationParty={
            { ...notificationParty, notificationSettings: notificationSettingsForParty } as NotificationAccountsType
          }
          onClose={() => setNotificationParty(null)}
          onSave={onSave}
        />
      )}
      <List size="sm">
        <Divider as="li" />
        <SettingsItem
          icon={{ svgElement: Buildings2Icon, theme: 'default' }}
          title="Organisasjonsnummer"
          value={uniqueId}
        />
        {parentAccount && (
          <>
            <Divider as="li" />
            <SettingsItem
              icon={{ svgElement: Buildings2Icon, theme: 'default' }}
              title="Overordnet organisasjon"
              value={parentAccount.name}
              linkIcon
            />
          </>
        )}
      </List>
    </Section>
  );
};
