import {
  type AccountListItemProps,
  Button,
  Divider,
  Flex,
  List,
  Section,
  SettingsItem,
} from '@altinn/altinn-components';
import { Buildings2Icon, HandshakeIcon, HeartFillIcon, HeartIcon, InboxIcon } from '@navikt/aksel-icons';
import { useNotificationSettings } from '../useNotificationSettings';
import { NotificationSetting } from './NotificationSettings';

export const CompanyDetails = ({ ...props }: AccountDetailsProps) => {
  const { id: partyUuid, uniqueId, parentId, items } = props;
  const parentAccount = items?.find((item) => item.id === parentId);

  const { notificationSettings, isLoading: isLoadingNotificaitonSettings } = useNotificationSettings(partyUuid);

  return (
    <Section color="company" padding={6} spacing={2}>
      <AccountToolbar {...props} id={partyUuid} />
      <Divider />
      {!isLoadingNotificaitonSettings && notificationSettings ? (
        <NotificationSetting notificationSetting={notificationSettings} />
      ) : (
        <NotificationSetting
          key={partyUuid}
          notificationSetting={{
            partyUuid: partyUuid,
            emailAddress: '',
            phoneNumber: '',
          }}
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
        <SettingsItem
          icon={{ svgElement: HandshakeIcon, theme: 'default' }}
          title="Rolle og rettigheter"
          value="Daglig leder"
          linkIcon
        />
      </List>
    </Section>
  );
};

export const AccountToolbar = ({ id, type, isCurrentEndUser, favourite, onToggleFavourite }: AccountDetailsProps) => {
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
      {type !== 'group' && (
        <Button icon={HandshakeIcon} variant="outline">
          Tilgangsstyring
        </Button>
      )}
    </Flex>
  );
};

export interface AccountDetailsProps extends AccountListItemProps {
  userId?: string;
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  contactEmailAddress?: string;
  contactPhoneNumber?: string;
  address?: string;
  items?: AccountListItemProps[];
}
