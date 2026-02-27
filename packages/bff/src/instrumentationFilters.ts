const appConfigurationHostIdentifier = 'appconfiguration.azconfig.io';
const graphqlSpansExcludedFromExport = new Set([
  'graphql.parse',
  'graphql.validate',
  'graphql.parseSchema',
  'graphql.validateSchema',
]);

export const filterGraphQLSpans = (spanName: string): boolean => {
  return graphqlSpansExcludedFromExport.has(spanName);
};

export const filterAppConfigSpans = (attributes: Record<string, unknown>): boolean => {
  const httpHost = attributes['http.host'];
  if (typeof httpHost !== 'string') {
    return false;
  }

  return httpHost.toLowerCase().includes(appConfigurationHostIdentifier);
};
