import { logger } from '@altinn/dialogporten-node-logger';
import config from '../../config.js';

interface Organization {
  name: {
    en: string;
    nb: string;
    nn: string;
  };
  emblem?: string; // preferred this logo, if available
  logo?: string;
  orgnr: string;
  homepage: string;
  contact?: {
    email?: string;
    phone?: string;
    url?: string;
  };
  environments: string[];
}

interface Orgs {
  [key: string]: Organization;
}

interface OrganizationNames {
  en: string;
  nb: string;
  nn: string;
}

interface OrganizationContact {
  email?: string;
  phone?: string;
  url?: string;
}

interface TransformedOrganization {
  id: string;
  name: OrganizationNames;
  logo: string | undefined;
  orgnr: string;
  homepage: string;
  environments: string[];
  contact?: OrganizationContact;
}

const organizationsRedisKey = 'arbeidsflate-organizations:v2';
const excludeOrgsInProd = ['bits', 'bft', 'acn', 'ttd'];

const filterProdOrgs = (orgs: TransformedOrganization[]) => {
  if (config.environment === 'prod') {
    return orgs.filter((org) => !excludeOrgsInProd.includes(org.id));
  }
  return orgs;
};

async function fetchOrganizations() {
  try {
    const response = await fetch('https://altinncdn.no/orgs/altinn-orgs.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    if (typeof data === 'object' && data !== null) {
      return Object.values(data) as Orgs[];
    }
    throw new Error('Data is not an object');
  } catch (error) {
    logger.error(error, 'There was a problem with the fetch operation:');
    throw error;
  }
}

async function storeOrganizationsInRedis(): Promise<TransformedOrganization[]> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const organizations = await fetchOrganizations();
    if (organizations && Array.isArray(organizations)) {
      const transformedOrganizations = filterProdOrgs(organizations.flatMap((org) => convertOrgsToJson(org)));
      await redisClient.set(organizationsRedisKey, JSON.stringify(transformedOrganizations), 'EX', 60 * 60 * 24); // Store for 24 hours
      return transformedOrganizations;
    }
    return [];
  } catch (error) {
    logger.error(error, 'Error storing organizations in Redis:');
    return [];
  }
}

export async function getOrganizationsFromRedis(): Promise<TransformedOrganization[]> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const data = await redisClient.get(organizationsRedisKey);
    if (data) {
      return JSON.parse(data);
    }
    return await storeOrganizationsInRedis();
  } catch (error) {
    logger.error(error, 'Error retrieving organizations from Redis:');
    return [];
  }
}

function convertOrgsToJson(orgs: Orgs): TransformedOrganization[] {
  const result: TransformedOrganization[] = [];
  for (const [id, details] of Object.entries(orgs)) {
    const { name, logo, orgnr, homepage, environments, emblem, contact } = details;
    result.push({
      id,
      name,
      logo: emblem || logo,
      orgnr,
      homepage,
      environments,
      contact,
    });
  }
  return result;
}
