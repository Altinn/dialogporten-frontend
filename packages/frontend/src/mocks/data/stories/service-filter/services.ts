import type { ServiceResource } from 'bff-types-generated';
import { services as baseServices } from '../../base/services.ts';

export const MOCK_SERVICE_JOURNEY_ID = 'urn:altinn:resource:mock-service-journey';

const mockServiceJourney: ServiceResource = {
  id: 'mock-service-journey',
  title: 'Mock service journey',
  org: 'digdir',
};

export const services: ServiceResource[] = [mockServiceJourney, ...baseServices];
