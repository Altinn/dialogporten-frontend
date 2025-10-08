import { type AccountListItemProps, Divider, List, Section, SettingsItem } from '@altinn/altinn-components';
import { HouseHeartIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import type { User } from 'bff-types-generated';
import { useState } from 'react';
import type { UserNotificationType } from '../NotificationsPage/NotificationsPage';
import { AccountToolbar } from './AccountToolbar';
import { UserNotificationSettingsModal } from './UserNotificationSettingsModal';

export interface UserDetailsProps extends AccountListItemProps {
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  address?: string;
  user?: User;
}

export const UserDetails = ({ id, type, name, user }: UserDetailsProps) => {
  const alertEmailAddress = user?.email || '';
  const alertPhoneNumber = user?.phoneNumber || '';
  const address = `${user?.party?.person?.mailingAddress} ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;
  const [showNotificationModal, setShowNotificationModal] = useState<UserNotificationType | undefined>(undefined);

  return (
    <Section color="person" padding={6} spacing={2}>
      <AccountToolbar id={id} isCurrentEndUser={true} type={type} name={name} />
      <Divider />
      <List size="sm">
        <SettingsItem
          id="mobile-phone"
          icon={MobileIcon}
          title="Mobiltelefon"
          value={alertPhoneNumber?.length ? alertPhoneNumber : 'Mobilnummer ikke registrert'}
          badge={{ label: 'Endre mobil', variant: 'text' }}
          linkIcon
          onClick={() =>
            setShowNotificationModal({ icon: MobileIcon, title: 'Mobiltelefon', notificationType: 'phoneNumber' })
          }
          as="button"
        />
        <SettingsItem
          id="email-address"
          icon={PaperplaneIcon}
          title="E-postadresse"
          value={alertEmailAddress?.length ? alertEmailAddress : 'Epostadresse ikke registrert'}
          badge={{ label: 'Endre e-post', variant: 'text' }}
          linkIcon
          onClick={() =>
            setShowNotificationModal({ icon: PaperplaneIcon, title: 'E-postadresse', notificationType: 'email' })
          }
          as="button"
        />
        <Divider as="li" />
        <SettingsItem
          id="address"
          icon={HouseHeartIcon}
          title="Adresse"
          value={address}
          badge={{ label: 'Endre Adresse', variant: 'text' }}
          linkIcon
          onClick={() =>
            setShowNotificationModal({ icon: HouseHeartIcon, title: 'Adresse', notificationType: 'address' })
          }
          as="button"
        />
      </List>
      <UserNotificationSettingsModal
        userNotification={showNotificationModal}
        onClose={() => setShowNotificationModal(undefined)}
      />
    </Section>
  );
};
