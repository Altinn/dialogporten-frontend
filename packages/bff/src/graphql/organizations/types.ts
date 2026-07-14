import { objectType } from 'nexus';

export const OrganizationContactType = objectType({
  name: 'OrganizationContact',
  definition(t) {
    t.nullable.string('email', {
      description: 'Contact email address of the organization',
      resolve: (contact) => contact.email ?? null,
    });
    t.nullable.string('phone', {
      description: 'Contact phone number of the organization',
      resolve: (contact) => contact.phone ?? null,
    });
    t.nullable.string('url', {
      description: 'Contact URL of the organization',
      resolve: (contact) => contact.url ?? null,
    });
  },
});

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
    t.nullable.field('contact', {
      type: 'OrganizationContact',
      description: 'Contact information for the organization',
      resolve: (organization) => organization.contact ?? null,
    });
  },
});
