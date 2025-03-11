import type { OrganizationFieldsFragment } from 'bff-types-generated';

export interface OrganizationOutput {
  name: string;
  logo: string;
}

export const getOrganization = (
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
