import { extendType, objectType } from 'nexus';

interface Organization {
  name: {
    en: string;
    nb: string;
    nn: string;
  };
  logo?: string;
  orgnr: string;
  homepage: string;
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

const organizationsRedisKey = 'transformedOrganizations';

async function fetchOrganizations() {
  const { default: logger } = await import('@digdir/dialogporten-node-logger');
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
    console.error('There was a problem with the fetch operation:', error);
    throw error;
  }
}
async function storeOrganizationsInRedis() {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const organizations = await fetchOrganizations();
    const transformedOrganizations = organizations!.flatMap((org) => convertOrgsToJson(org));
    await redisClient.set(organizationsRedisKey, JSON.stringify(transformedOrganizations), 'EX', 86400);
  } catch (error) {
    console.error('Error storing organizations in Redis:', error);
  }
}
export async function deleteOrganizationsFromRedis() {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    await redisClient.del(organizationsRedisKey);
  } catch (error) {
    console.error('Error deleting organizations from Redis:', error);
  }
}

deleteOrganizationsFromRedis();

export async function getOrganizationsFromRedis() {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const data = await redisClient.get(organizationsRedisKey);
    if (data) {
      return JSON.parse(data);
    }
    await storeOrganizationsInRedis();
    return await getOrganizationsFromRedis();
  } catch (error) {
    console.error('Error retrieving organizations from Redis:', error);
    return null;
  }
}

function convertOrgsToJson(orgs: Orgs): TransformedOrganization[] {
  const result: TransformedOrganization[] = [];
  for (const [id, details] of Object.entries(orgs)) {
    const { name, logo, orgnr, homepage, environments } = details;
    result.push({
      id,
      name,
      logo,
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
      resolve: (organization, args, ctx, info) => {
        return organization.en;
      },
    });
    t.string('nb', {
      description: 'Localized norwegian name of the organization',
      resolve: (organization, args, ctx, info) => {
        return organization.nb;
      },
    });
    t.string('nn', {
      description: 'Localized new norwegian name of the organization',
      resolve: (organization, args, ctx, info) => {
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
      resolve: (organization, args, ctx, info) => {
        return organization.id;
      },
    });
    t.field('name', {
      type: 'OrganizationNames',
      description: 'Localized name of the organization',
      resolve: (organization, args, ctx, info) => {
        return organization.name;
      },
    });
    t.string('logo', {
      description: 'URL to the organization logo',
      resolve: (organization, args, ctx, info) => {
        return organization.logo;
      },
    });
    t.string('orgnr', {
      description: 'Organization number',
      resolve: (organization, args, ctx, info) => {
        return organization.orgnr;
      },
    });
    t.string('homepage', {
      description: 'Homepage URL of the organization',
      resolve: (organization, args, ctx, info) => {
        return organization.homepage;
      },
    });
    t.list.string('environments', {
      description: 'Environments the organization operates in',
      resolve: (organization, args, ctx, info) => {
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
      resolve: async (_, args, ctx) => {
        return await getOrganizationsFromRedis();
      },
    });
  },
});
