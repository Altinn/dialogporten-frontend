import type { OrganizationFieldsFragment } from 'bff-types-generated';
import { i18n } from '../../i18n/config.ts';

export interface OrganizationOutput {
  name: string;
  logo: string;
}

export type OrganizationLookup = OrganizationFieldsFragment[] | Map<string, OrganizationFieldsFragment>;

const resolveOrg = (organizations: OrganizationLookup, orgId: string): OrganizationFieldsFragment | undefined => {
  if (organizations instanceof Map) {
    return organizations.get(orgId);
  }
  return organizations?.find((o) => o.id === orgId);
};

export const getOrganizationByLocale = (
  organizations: OrganizationLookup,
  org: string,
  locale: string,
): OrganizationOutput | undefined => {
  const currentOrg = resolveOrg(organizations, org);
  const name = currentOrg?.name && (currentOrg.name[locale as keyof typeof currentOrg.name] ?? '');
  const logo = currentOrg?.logo ?? '';
  return {
    name: name || org,
    logo,
  };
};

export const getOrganization = (organizations: OrganizationLookup, org: string): OrganizationOutput | undefined => {
  return getOrganizationByLocale(organizations, org, i18n.language);
};

export const buildOrganizationMap = (
  organizations: OrganizationFieldsFragment[] | undefined | null,
): Map<string, OrganizationFieldsFragment> => {
  const map = new Map<string, OrganizationFieldsFragment>();
  if (!organizations) return map;
  for (const org of organizations) {
    if (org.id) {
      map.set(org.id, org);
    }
  }
  return map;
};
