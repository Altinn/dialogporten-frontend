import {
  type AccountListItemType,
  AccountOrganization,
  type AccountOrganizationItemProps,
  Button,
  ButtonGroup,
  Section,
  type SettingsItemProps,
  SettingsList,
  type SettingsListProps,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { useMemo } from 'react';
import { SettingsType } from '../useSettings.tsx';

export interface PartyDetailsProps {
  type: AccountListItemType;
  currentParty: PartyFieldsFragment;
  settings: SettingsItemProps[];
  getGoToInboxButton: (party: { party: string; isCurrentEndUser: boolean }) => {
    label: string;
    [key: string]: unknown;
  };
  getCompanySettings: (id: string) => SettingsListProps['items'];
  getPersonSettings: (party: PartyFieldsFragment) => SettingsItemProps[];
  getOrganizationAccounts: (
    currentParty: { party: string } | undefined,
    parentParty: PartyFieldsFragment | undefined,
  ) => AccountOrganizationItemProps[];
  parentParty: PartyFieldsFragment | undefined;
}

export const PartyDetails = ({
  type,
  currentParty,
  settings,
  getGoToInboxButton,
  getCompanySettings,
  getPersonSettings,
  getOrganizationAccounts,
  parentParty,
}: PartyDetailsProps) => {
  const organizationAccounts = useMemo((): AccountOrganizationItemProps[] => {
    if (type !== 'company') return [];
    return getOrganizationAccounts(currentParty, parentParty);
  }, [type, currentParty, parentParty, getOrganizationAccounts]);
  const buttons = [getGoToInboxButton(currentParty)];

  if (currentParty.isCurrentEndUser) {
    const contactSettings = settings.filter((s) => s.groupId === SettingsType.contact);
    return (
      <Section spacing={3} color="person">
        {buttons && (
          <ButtonGroup size="sm">
            {buttons.map((button) => {
              const { variant, label, ...buttonProps } = button;
              return (
                <Button {...buttonProps} variant="outline" key={button.label}>
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        )}
        {contactSettings?.length > 0 && <SettingsList items={contactSettings} variant="menu" />}
      </Section>
    );
  }

  if (type === 'company') {
    const companySettings = getCompanySettings(currentParty.party);
    return (
      <Section spacing={3} color="company">
        {buttons && (
          <ButtonGroup size="sm">
            {buttons.map((button) => {
              const { variant, label, ...buttonProps } = button;
              return (
                <Button {...buttonProps} variant="outline" key={button.label}>
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        )}
        {companySettings && (
          <SettingsList
            items={companySettings}
            groups={{
              orgNr: {
                title: t('profile.settings.organization_information'),
              },
            }}
            variant="menu"
          />
        )}
        {(organizationAccounts?.length ?? 0) > 0 && <AccountOrganization items={organizationAccounts} />}
      </Section>
    );
  }

  if (type === 'person') {
    const settings = getPersonSettings(currentParty);
    return (
      <Section spacing={3} color="person">
        {buttons && (
          <ButtonGroup size="sm">
            {buttons.map((button) => {
              const { variant, label, ...buttonProps } = button;
              return (
                <Button {...buttonProps} variant="outline" key={button.label}>
                  {label}
                </Button>
              );
            })}
          </ButtonGroup>
        )}
        {settings?.length > 0 && <SettingsList items={settings} variant="menu" />}
      </Section>
    );
  }

  return null;
};
