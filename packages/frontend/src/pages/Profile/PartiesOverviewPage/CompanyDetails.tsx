import {
  type AccountListItemProps,
  Button,
  Divider,
  Flex,
  List,
  Section,
  SettingsItem,
} from '@altinn/altinn-components';
import { Buildings2Icon, HeartFillIcon, HeartIcon, InboxIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import type { NotificationAccountsType } from '../NotificationsPage/AccountSettings';
import { CompanyNotificationSettingsModal } from '../NotificationsPage/CompanyNotificationSettingsModal';
import { useNotificationSettingsForParty } from '../useNotificationSettingsForParty';
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
  const { notificationSettingsForParty, isLoading: isLoadingNotificaitonSettings } =
    useNotificationSettingsForParty(id);

  const onSave = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGSFORPARTY] });
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
      {!isLoadingNotificaitonSettings && (
        <PartyDetailsSetting
          notificationSetting={notificationSettingsForParty}
          setNotificationParty={() => setNotificationParty(party as NotificationAccountsType)}
        />
      )}
      {notificationParty && (
        <CompanyNotificationSettingsModal
          notificationParty={
            { ...notificationParty, notificationSettings: notificationSettingsForParty } as NotificationAccountsType
          }
          setNotificationParty={(updatedParty: NotificationAccountsType | null) => setNotificationParty(updatedParty)}
          onSave={onSave}
        />
      )}
      <List size="sm">
        <Divider as="li" />
        <SettingsItem
          icon={{ svgElement: Buildings2Icon, theme: 'default' }}
          title="Organisasjonsnummer"
          value={uniqueId}
          linkIcon
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

export interface AccountToolbarProps extends AccountListItemProps {
  id: string;
  isCurrentEndUser: boolean;
  favourite?: boolean;
  onToggleFavourite?: (id: string) => void;
}

export const AccountToolbar = ({ id, isCurrentEndUser, favourite, onToggleFavourite }: AccountToolbarProps) => {
  return (
    <Flex spacing={2} size="xs">
      {!isCurrentEndUser && (
        <Button
          variant={favourite ? 'tinted' : 'outline'}
          icon={favourite ? HeartFillIcon : HeartIcon}
          onClick={() => onToggleFavourite?.(id)}
        >
          {favourite ? 'Fjern favoritt' : 'Legg til favoritt'}
        </Button>
      )}
      <Button icon={InboxIcon} variant="outline">
        Gå til Innboks
      </Button>
    </Flex>
  );
};
