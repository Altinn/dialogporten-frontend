import resourcesProd from './resourcelist.json';
import resourcesAT23 from './resourcelistProd.json';
import type { Resource } from './services.ts';

const useProd = false;

const resourceTypes = [
  'Altinn2Service',
  'AltinnApp',
  'CorrespondenceService',
  'MaskinportenSchema',
  'GenericAccessResource',
  'Systemresource',
  'BrokerService',
];

const source = useProd ? resourcesProd : resourcesAT23;
export const resourceList = source.filter((r: Resource) => resourceTypes.includes(r.resourceType));
