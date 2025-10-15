import { logger } from '@digdir/dialogporten-node-logger';
import { extendType, objectType } from 'nexus';

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

interface TransformedOrganization {
  id: string;
  name: OrganizationNames;
  logo: string | undefined;
  orgnr: string;
  homepage: string;
  environments: string[];
}

const organizationsRedisKey = 'arbeidsflate-organizations:v1';

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
      const transformedOrganizations = organizations!.flatMap((org) => convertOrgsToJson(org));
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
    const { name, logo, orgnr, homepage, environments, emblem } = details;
    result.push({
      id,
      name,
      logo: emblem || logo,
      orgnr,
      homepage,
      environments,
    });
  }
  return result;
}

export const OrganizationNames = objectType({
  name: 'OrganizationNames',
  definition(t) {
    t.string('en', {
      description: 'Localized english name of the organization',
      resolve: (organization) => {
        return organization.en;
      },
    });
    t.string('nb', {
      description: 'Localized norwegian name of the organization',
      resolve: (organization) => {
        return organization.nb;
      },
    });
    t.string('nn', {
      description: 'Localized new norwegian name of the organization',
      resolve: (organization) => {
        return organization.nn;
      },
    });
  },
});

export const Organization = objectType({
  name: 'Organization',
  definition(t) {
    t.string('id', {
      description: 'Organization id',
      resolve: (organization) => {
        return organization.id;
      },
    });
    t.field('name', {
      type: 'OrganizationNames',
      description: 'Localized name of the organization',
      resolve: (organization) => {
        return organization.name;
      },
    });
    t.string('logo', {
      description: 'URL to the organization logo, preferably an emblem over the logo',
      resolve: (organization) => {
        return organization.logo;
      },
    });
    t.string('orgnr', {
      description: 'Organization number',
      resolve: (organization) => {
        return organization.orgnr;
      },
    });
    t.string('homepage', {
      description: 'Homepage URL of the organization',
      resolve: (organization) => {
        return organization.homepage;
      },
    });
    t.list.string('environments', {
      description: 'Environments the organization operates in',
      resolve: (organization) => {
        return organization.environments;
      },
    });
  },
});

export const OrganizationQuery = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('organizations', {
      type: 'Organization',
      description: 'List of organizations',
      resolve: async () => {
        return await getOrganizationsFromRedis();
      },
    });
  },
});
