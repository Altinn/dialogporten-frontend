const RESOURCE_URN_PREFIX = 'urn:altinn:resource:';

const resourceUrnPattern = /^urn:altinn:resource:[a-z0-9_-]{4,}$/;

export const isValidResourceUrn = (value: string): boolean => resourceUrnPattern.test(value);

export const isNotifiableResourceIdentifier = (identifier: string): boolean =>
  isValidResourceUrn(RESOURCE_URN_PREFIX + identifier);
