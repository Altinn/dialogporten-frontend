import { type AccountListItemProps, Divider, List, Section, SettingsItem } from '@altinn/altinn-components';
import { HouseIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { AccountToolbar } from './CompanyDetails';

export interface UserDetailsProps extends AccountListItemProps {
  userId?: string;
  alertEmailAddress?: string;
  alertPhoneNumber?: string;
  contactEmailAddress?: string;
  contactPhoneNumber?: string;
  address?: string;
}

export const UserDetails = ({ alertEmailAddress, address, id, alertPhoneNumber, type, name }: UserDetailsProps) => {
  return (
    <Section color="person" padding={6} spacing={2}>
      <AccountToolbar id={id} isCurrentEndUser={true} type={type} name={name} />
      <Divider />
      <List size="sm">
        <SettingsItem
          icon={MobileIcon}
          title="Varslinger på SMS"
          value={alertPhoneNumber?.length ? alertPhoneNumber : 'Mobilnummer ikke registrert'}
          badge={{ label: 'Endre mobil', variant: 'text' }}
          linkIcon
        />
        <SettingsItem
          icon={PaperplaneIcon}
          title="Varslinger på e-post"
          value={alertEmailAddress?.length ? alertEmailAddress : 'Epostadresse ikke registrert'}
          badge={{ label: 'Endre e-post', variant: 'text' }}
          linkIcon
        />
        <Divider as="li" />
        <SettingsItem
          icon={HouseIcon}
          title="Adresse"
          value={address}
          badge={{ label: 'Endre Adresse', variant: 'text' }}
          linkIcon
        />
      </List>
    </Section>
  );
};
