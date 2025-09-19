import { type AvatarProps, ModalBase, ModalBody, ModalHeader, SettingsItem } from '@altinn/altinn-components';
import { CompanyNotificationSettings } from '../PartiesOverviewPage/CompanyNotificationSettings';
import { urnToOrgNr } from '../PartiesOverviewPage/partyFieldToAccountList';
import type { NotificationAccountsType } from './AccountSettings';

interface CompanyNotificationSettingsModalProps {
  notificationParty: NotificationAccountsType | null;
  setNotificationParty: (notificationParty: NotificationAccountsType | null) => void;
  onSave?: () => void;
}

export const CompanyNotificationSettingsModal = ({
  notificationParty,
  setNotificationParty,
  onSave,
}: CompanyNotificationSettingsModalProps) => {
  const partyType = notificationParty?.partyType === 'Organization' ? 'company' : 'person';
  const computedIcon = {
    type: partyType,
    name: notificationParty?.name || '',
  };

  if (!notificationParty) {
    return null;
  }

  return (
    <ModalBase open={true} onClose={() => setNotificationParty(null)}>
      <ModalHeader onClose={() => setNotificationParty(null)}>
        <SettingsItem
          icon={computedIcon as AvatarProps}
          color={partyType}
          title={notificationParty?.name}
          description={
            (notificationParty?.partyType === 'Organization' ? 'Org.nr. ' : 'Fødselsnummer: ') +
            urnToOrgNr(notificationParty.party) +
            (notificationParty.parentId ? ', del av ' + notificationParty.name : '')
          }
          interactive={false}
        />
      </ModalHeader>
      <ModalBody>
        <CompanyNotificationSettings
          notificationParty={notificationParty}
          onClose={() => setNotificationParty(null)}
          onSave={onSave}
        />
      </ModalBody>
    </ModalBase>
  );
};
