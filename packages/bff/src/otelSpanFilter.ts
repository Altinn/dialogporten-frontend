export const spansExcludedFromExport = new Set([
  'graphql.parse',
  'graphql.validate',
  'graphql.parseSchema',
  'graphql.validateSchema',
]);

export const shouldDropSpanByName = (spanName: string): boolean => {
  return spansExcludedFromExport.has(spanName);
};
