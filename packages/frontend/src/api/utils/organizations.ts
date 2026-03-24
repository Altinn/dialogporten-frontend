import type { OrganizationFieldsFragment } from 'bff-types-generated';
import { i18n } from '../../i18n/config.ts';

export interface OrganizationOutput {
  name: string;
  logo: string;
}

type OrgLookup = OrganizationFieldsFragment[] | Map<string, OrganizationFieldsFragment>;

const findOrg = (organizations: OrgLookup, id: string): OrganizationFieldsFragment | undefined => {
  if (organizations instanceof Map) return organizations.get(id);
  return organizations.find((o) => o.id === id);
};

export const getOrganizationByLocale = (
  organizations: OrgLookup,
  org: string,
  locale: string,
): OrganizationOutput | undefined => {
  const currentOrg = findOrg(organizations, org);
  const name = currentOrg?.name && (currentOrg.name[locale as keyof typeof currentOrg.name] ?? '');
  const logo = currentOrg?.logo ?? '';
  return {
    name: name || org,
    logo,
  };
};

export const getOrganization = (organizations: OrgLookup, org: string): OrganizationOutput | undefined => {
  return getOrganizationByLocale(organizations, org, i18n.language);
};
