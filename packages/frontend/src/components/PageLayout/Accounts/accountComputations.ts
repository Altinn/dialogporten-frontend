import { type AccountMenuItemProps, type AvatarType, type BadgeProps, formatDate } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import i18n from 'i18next';
import type { PartyGraph } from '../../../utils/partyGraph.ts';

export interface PartyItemProp extends AccountMenuItemProps {
  uuid: string;
  altinnId: number;
  isPreselectedParty?: boolean;
  isDeleted?: boolean;
  parentId?: string | undefined;
  parentName?: string | undefined;
  isFavorite?: boolean;
  isCurrentEndUser?: boolean;
  badge?: BadgeProps;
  isParent?: boolean;
  ssnOrOrgNo?: string;
}

export type OrgSkeletonItem = { party: PartyFieldsFragment; isParent: boolean; parent?: PartyFieldsFragment };

export interface MapAccountOptions {
  showDescription?: boolean;
  t: (key: string) => string;
}

export const getOrgNo = (partyId: string): string => {
  if (!partyId.includes('urn:altinn:organization:')) return '';
  const parts = partyId.split('identifier-no:');
  return parts[1] ?? '';
};

export const formatOrgNo = (orgNo: string, includeThinSpace?: boolean): string => {
  if (!orgNo) return '';
  if (includeThinSpace ?? true) {
    return [orgNo.slice(0, 3), orgNo.slice(3, 6), orgNo.slice(6, 9)].join('\u2009');
  }
  return orgNo.slice(0, 9);
};

export const formatNorwegianId = (partyId: string, includeThinSpace?: boolean): string =>
  formatOrgNo(getOrgNo(partyId), includeThinSpace);

/** Reuse a single Intl.Collator per language – much faster than localeCompare per call */
let collatorLang = '';
let collator: Intl.Collator;
const getCollator = (): Intl.Collator => {
  if (collatorLang !== i18n.language) {
    collatorLang = i18n.language;
    collator = new Intl.Collator(i18n.language, { sensitivity: 'base' });
  }
  return collator;
};
const compareName = (a: string, b: string) => getCollator().compare(a, b);

/** Cheap skeleton: sorted PartyFieldsFragment refs. No PartyItemProp allocation here. */
export const buildPersonSkeleton = (otherPeople: PartyFieldsFragment[]): PartyFieldsFragment[] => {
  return [...otherPeople].sort((a, b) => compareName(a.name, b.name));
};

/** Cheap skeleton: sorted+grouped org refs. */
export const buildOrgSkeleton = (organizations: PartyFieldsFragment[], partyGraph: PartyGraph): OrgSkeletonItem[] => {
  const items: OrgSkeletonItem[] = organizations.map((party) => {
    const matchInAvailable = partyGraph.partyByUrn.get(party.party);
    const isParent = Array.isArray(matchInAvailable?.subParties);
    const parent = isParent ? undefined : partyGraph.parentByChildUrn.get(party.party);
    return { party, isParent, parent };
  });

  const parents = items.filter((i) => i.isParent).sort((a, b) => compareName(a.party.name, b.party.name));
  const childrenByParentParty = new Map<string, OrgSkeletonItem[]>();
  const orphans: OrgSkeletonItem[] = [];

  for (const item of items) {
    if (item.isParent) continue;
    if (item.parent) {
      const arr = childrenByParentParty.get(item.parent.party) ?? [];
      arr.push(item);
      childrenByParentParty.set(item.parent.party, arr);
    } else {
      orphans.push(item);
    }
  }
  for (const arr of childrenByParentParty.values()) arr.sort((a, b) => compareName(a.party.name, b.party.name));
  orphans.sort((a, b) => compareName(a.party.name, b.party.name));

  const grouped = parents.flatMap((p) => [p, ...(childrenByParentParty.get(p.party.party) ?? [])]);
  return [...grouped, ...orphans];
};

export const mapPersonToAccount = (
  person: PartyFieldsFragment,
  { showDescription, t }: MapAccountOptions,
): PartyItemProp => {
  const birthDate = formatDate(person.dateOfBirth ?? undefined);
  return {
    id: person.party,
    searchWords: [person.name],
    name: person.name,
    title: person.name,
    type: 'person' as AccountMenuItemProps['type'],
    icon: { name: person.name, type: 'person' as AvatarType },
    isDeleted: person.isDeleted,
    isCurrentEndUser: false,
    uuid: person.partyUuid,
    altinnId: person.partyId,
    description: showDescription && birthDate ? t('word.born') + birthDate : undefined,
    badge: person.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
    groupId: 'persons',
  } as PartyItemProp;
};

export const mapOrgItemToAccount = (
  item: OrgSkeletonItem,
  { showDescription, t }: MapAccountOptions,
): PartyItemProp => {
  const { party, isParent, parent } = item;
  const orgNo = getOrgNo(party.party);
  const formattedId = formatOrgNo(orgNo);
  const description = showDescription
    ? parent?.name && party?.party
      ? `↳ ${t('word.orgNo')} ${formattedId}, ${t('profile.account.partOf')} ${parent.name}`
      : `${t('word.orgNo')} ${formattedId}`
    : undefined;
  return {
    id: party.party,
    searchWords: [orgNo, party.name],
    ssnOrOrgNo: orgNo,
    name: party.name,
    title: party.name,
    type: 'company' as AccountMenuItemProps['type'],
    icon: { name: party.name, type: 'company' as AvatarType, isParent, isDeleted: party.isDeleted },
    isDeleted: party.isDeleted,
    isCurrentEndUser: false,
    uuid: party.partyUuid,
    disabled: party.hasOnlyAccessToSubParties,
    isParent,
    parentId: parent?.party,
    parentName: parent?.name,
    description,
    badge: party.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
    groupId: parent?.party ?? party.party,
  } as PartyItemProp;
};
