import { objectType } from 'nexus';

export const ServiceResource = objectType({
  name: 'ServiceResource',
  definition(t) {
    t.string('id', {
      description: 'Service resource identifier',
      resolve: (resource) => {
        return resource.id;
      },
    });
    t.string('title', {
      description: 'Localized title of the service resource',
      resolve: (resource) => {
        return resource.title;
      },
    });
    t.string('org', {
      description: 'Organization (=service owner) code for the service resource',
      resolve: (resource) => {
        return resource.org;
      },
    });
    t.string('resourceType', {
      description: 'Type of the service resource',
      resolve: (resource) => {
        return resource.resourceType;
      },
    });
  },
});
