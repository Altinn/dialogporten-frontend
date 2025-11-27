import type { OrganizationFieldsFragment } from 'bff-types-generated';
import { i18n } from '../../i18n/config.ts';

export interface OrganizationOutput {
  name: string;
  logo: string;
}

export const getOrganizationByLocale = (
  organizations: OrganizationFieldsFragment[],
  org: string,
  locale: string,
): OrganizationOutput | undefined => {
  const currentOrg = organizations?.find((o) => o.id === (org as string));
  const name = currentOrg?.name && (currentOrg.name[locale as keyof typeof currentOrg.name] ?? '');
  const logo = currentOrg?.logo ?? '';
  return {
    name: name || org,
    logo,
  };
};

export const getOrganization = (
  organizations: OrganizationFieldsFragment[],
  org: string,
): OrganizationOutput | undefined => {
  return getOrganizationByLocale(organizations, org, i18n.language);
};
