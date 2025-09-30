import {
  DsButton,
  DsLink,
  ModalBase,
  ModalBody,
  ModalHeader,
  SettingsItem,
  TextField,
  Textarea,
  Typography,
} from '@altinn/altinn-components';
import { BellIcon, ExternalLinkIcon, PadlockLockedFillIcon } from '@navikt/aksel-icons';
import i18n from 'i18next';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings';
import { useProfile } from '../useProfile';
import { NotificationUsedByList } from './NotificationUsedByList';
import styles from './UserNotificationSettingsModal.module.css';
export type NotificationType = 'email' | 'phoneNumber' | 'address' | 'none';

interface UserNotificationSettingsModalProps {
  notificationType: NotificationType;
  setShowModal: (notificationType: NotificationType) => void;
}

export const UserNotificationSettingsModal = ({
  notificationType,
  setShowModal,
}: UserNotificationSettingsModalProps) => {
  const { user, isLoading } = useProfile();
  const showModal = notificationType !== 'none';
  const { uniqueEmailAddresses, uniquePhoneNumbers } = usePartiesWithNotificationSettings();
  const isProdEnvironment = location.hostname.includes('af.altinn.no');
  const krrBaseUrl = isProdEnvironment
    ? 'https://minprofil.kontaktregisteret.no'
    : 'https://minprofil.test.kontaktregisteret.no';
  const krrUrl = `${krrBaseUrl}/?locale=${i18n.language}`;
  const krrInfoUrl = 'https://eid.difi.no/nb/kontakt-og-reservasjonsregisteret';
  const folkeRegisteretUrl = isProdEnvironment
    ? 'https://www.skatteetaten.no/person/folkeregister/flytte/'
    : 'https://testdata.skatteetaten.no/web/testnorge/soek/freg';

  const userEmailGroup = uniqueEmailAddresses.find((group) => group.email === user.email);
  const emailUsedByPartyNames = userEmailGroup?.parties.map((party) => ({ name: party.name, type: party.type })) || [];

  const userPhoneGroup = uniquePhoneNumbers.find((group) => group.phoneNumber === user.phoneNumber);
  const phoneNumberUsedByPartyNames =
    userPhoneGroup?.parties.map((party) => ({ name: party.name, type: party.type })) || [];
  const address = `${user?.party?.person?.mailingAddress} ${user?.party?.person?.mailingPostalCode} ${user?.party?.person?.mailingPostalCity}`;

  if (!notificationType || isLoading) {
    return null;
  }

  const renderNotificationType = () => {
    if (notificationType === 'phoneNumber') {
      return (
        <>
          <ModalHeader onClose={() => setShowModal('none')}>
            <SettingsItem icon={BellIcon} color="person" title={'Varslinger på SMS'} interactive={false} />
          </ModalHeader>
          <ModalBody>
            <div className={styles.flexContainer}>
              <PadlockLockedFillIcon fontSize="1.5rem" />
              <p>Primær mobiltelefon</p>
            </div>
            <TextField
              className={styles.textField}
              name="phone"
              type="tel"
              placeholder="Mobiltelefon"
              value={user.phoneNumber || ''}
              disabled
            />
            <NotificationUsedByList
              currentEnduserName={user?.party?.name || ''}
              avatarItems={phoneNumberUsedByPartyNames}
            />
            <Typography>
              Primære varslingsadresser hentes fra et felles kontaktregister for stat og kommune. Endre i{' '}
              <DsLink href={krrInfoUrl}>Kontakt og reservasjonsregisteret</DsLink>.
            </Typography>
            <LinkButton href={krrUrl}>Endre mobiltelefon</LinkButton>
          </ModalBody>
        </>
      );
    }
    if (notificationType === 'email') {
      return (
        <>
          <ModalHeader onClose={() => setShowModal('none')}>
            <SettingsItem icon={BellIcon} color="person" title={'Varslinger på e-post'} interactive={false} />
          </ModalHeader>
          <ModalBody>
            <div className={styles.flexContainer}>
              <PadlockLockedFillIcon fontSize="1.5rem" />
              <p>Primær e-postadresse</p>
            </div>
            <TextField
              className={styles.textField}
              name="email"
              type="email"
              placeholder="E-postadresse"
              value={user.email || ''}
              disabled
            />
            <NotificationUsedByList currentEnduserName={user?.party?.name || ''} avatarItems={emailUsedByPartyNames} />
            <Typography>
              Primære varslingsadresser hentes fra et felles kontaktregister for stat og kommune. Endre i{' '}
              <DsLink href={krrInfoUrl}>Kontakt og reservasjonsregisteret</DsLink>.
            </Typography>
            <LinkButton href={krrUrl}>Endre e-postadresse</LinkButton>
          </ModalBody>
        </>
      );
    }
    if (notificationType === 'address') {
      return (
        <>
          <ModalHeader onClose={() => setShowModal('none')}>
            <SettingsItem
              icon={{ iconUrl: 'https://altinncdn.no/orgs/skd/skd.svg' }}
              color="person"
              title={'Endre adresse'}
              interactive={false}
            />
          </ModalHeader>
          <ModalBody>
            <div className={styles.flexContainer}>
              <PadlockLockedFillIcon fontSize="1.5rem" />
              <p>Adresse</p>
            </div>
            <Textarea className={styles.textField} name="address" placeholder="Adresse" value={address} disabled />
            <Typography>
              Altinn bruker adressen din fra <DsLink href={krrInfoUrl}>Folkeregisteret</DsLink>.
            </Typography>
            <LinkButton href={folkeRegisteretUrl}>Meld adresseendring</LinkButton>
          </ModalBody>
        </>
      );
    }
    return null;
  };

  return (
    <ModalBase open={showModal} onClose={() => setShowModal('none')}>
      {renderNotificationType()}
    </ModalBase>
  );
};

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
};

const LinkButton = ({ href, children }: LinkButtonProps) => {
  return (
    <DsButton asChild variant="secondary" className={styles.linkButton}>
      <a target="_blank" rel="noreferrer" href={href}>
        {children} <ExternalLinkIcon />
      </a>
    </DsButton>
  );
};
