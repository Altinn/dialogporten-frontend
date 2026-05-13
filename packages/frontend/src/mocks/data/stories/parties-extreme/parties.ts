import type { PartyFieldsFragment } from 'bff-types-generated';

const TOTAL_PARTIES = 15_000;
const PERSON_COUNT = 10;

const firstNames = [
  'OLA',
  'KARI',
  'PER',
  'INGRID',
  'BJØRN',
  'ASTRID',
  'LARS',
  'SIGRID',
  'ERIK',
  'HILDE',
  'MAGNUS',
  'SOLVEIG',
  'TORBJØRN',
  'MARIT',
  'HALVOR',
];

const lastNames = [
  'HANSEN',
  'JOHANSEN',
  'OLSEN',
  'LARSEN',
  'ANDERSEN',
  'PEDERSEN',
  'NILSEN',
  'KRISTIANSEN',
  'JENSEN',
  'KARLSEN',
  'JOHNSEN',
  'ERIKSEN',
  'BERG',
  'HAUGEN',
  'BAKKEN',
];

const companyPrefixes = [
  'NORDLAND',
  'BERGEN',
  'OSLO',
  'TRONDHEIM',
  'STAVANGER',
  'TROMSØ',
  'BODØ',
  'KRISTIANSAND',
  'DRAMMEN',
  'FREDRIKSTAD',
  'HAUGESUND',
  'ÅLESUND',
  'SANDNES',
  'SARPSBORG',
  'SKIEN',
  'MOLDE',
  'HARSTAD',
  'NARVIK',
  'HALDEN',
  'KONGSBERG',
];

const companyTypes = [
  'TRANSPORT',
  'REGNSKAP',
  'TEKNOLOGI',
  'BYGG',
  'HANDEL',
  'EIENDOM',
  'KONSULT',
  'HELSE',
  'ELEKTRO',
  'MEKANISK',
  'FISK',
  'SHIPPING',
  'MEDIA',
  'ENERGI',
  'JURIDISK',
  'LOGISTIKK',
  'ARKITEKT',
  'MILJØ',
  'FINANS',
  'SIKKERHET',
];

const companySuffixes = ['AS', 'ASA', 'ANS', 'DA', 'SA'];

function generatePerson(index: number): PartyFieldsFragment {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  return {
    party: `urn:altinn:person:identifier-no:${index + 1}`,
    partyType: 'Person',
    name: `${firstName} ${lastName}`,
    isCurrentEndUser: index === 0,
    isDeleted: false,
    partyUuid: `urn:altinn:person:uuid:${(index + 1).toString().padStart(6, '0')}`,
    partyId: index + 1,
    hasOnlyAccessToSubParties: false,
    subParties: [],
  };
}

function generateOrganization(index: number, partyId: number): PartyFieldsFragment {
  const prefix = companyPrefixes[index % companyPrefixes.length];
  const type = companyTypes[Math.floor(index / companyPrefixes.length) % companyTypes.length];
  const suffix = companySuffixes[index % companySuffixes.length];
  const number = Math.floor(index / (companyPrefixes.length * companyTypes.length)) + 1;
  const nameSuffix = number > 1 ? ` ${number}` : '';

  return {
    party: `urn:altinn:organization:identifier-no:${index + 1}`,
    partyType: 'Organization',
    name: `${prefix} ${type}${nameSuffix} ${suffix}`,
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: `urn:altinn:organization:uuid:${(index + 1).toString().padStart(6, '0')}`,
    partyId,
    hasOnlyAccessToSubParties: false,
    subParties: [],
  };
}

function generateParties(total: number = TOTAL_PARTIES, personCount: number = PERSON_COUNT): PartyFieldsFragment[] {
  const result: PartyFieldsFragment[] = [];

  for (let i = 0; i < personCount && i < total; i++) {
    result.push(generatePerson(i));
  }

  for (let i = 0; i < total - personCount; i++) {
    result.push(generateOrganization(i, personCount + i + 1));
  }

  return result;
}

export const parties: PartyFieldsFragment[] = generateParties();
