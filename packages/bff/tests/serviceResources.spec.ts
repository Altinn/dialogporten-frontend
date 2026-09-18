import { describe, expect, it } from 'vitest';
import { isDeprecatedServiceResource, sortServiceResourcesByTitle } from '../src/graphql/serviceResources/service.ts';

describe('isDeprecatedServiceResource', () => {
  it('treats migrated apps as deprecated regardless of status', () => {
    expect(isDeprecatedServiceResource({ resourceType: 'MigratedApp' })).toBe(true);
    expect(isDeprecatedServiceResource({ resourceType: 'MigratedApp', status: 'Completed' })).toBe(true);
  });

  it('treats Deprecated and Withdrawn resources as deprecated', () => {
    expect(isDeprecatedServiceResource({ resourceType: 'AltinnApp', status: 'Deprecated' })).toBe(true);
    expect(isDeprecatedServiceResource({ resourceType: 'GenericAccessResource', status: 'Withdrawn' })).toBe(true);
  });

  it('does not treat other resources as deprecated', () => {
    expect(isDeprecatedServiceResource({ resourceType: 'AltinnApp' })).toBe(false);
    expect(isDeprecatedServiceResource({ resourceType: 'AltinnApp', status: 'Active' })).toBe(false);
    expect(isDeprecatedServiceResource({ resourceType: 'CorrespondenceService', status: 'Completed' })).toBe(false);
    expect(isDeprecatedServiceResource({ resourceType: 'GenericAccessResource', status: 'UnderDevelopment' })).toBe(
      false,
    );
  });
});

describe('sortServiceResourcesByTitle', () => {
  const titles = (resources: { title: string }[]) => resources.map((r) => r.title);
  const resources = [
    { title: 'Østfold' },
    { title: 'aksjer' },
    { title: 'Åsen' },
    { title: 'Bank' },
    { title: 'Ærlig' },
  ];

  it('sorts case-insensitively with æ, ø and å last in Norwegian', () => {
    expect(titles(sortServiceResourcesByTitle(resources, 'nb'))).toEqual([
      'aksjer',
      'Bank',
      'Ærlig',
      'Østfold',
      'Åsen',
    ]);
    expect(titles(sortServiceResourcesByTitle(resources, 'nn'))).toEqual([
      'aksjer',
      'Bank',
      'Ærlig',
      'Østfold',
      'Åsen',
    ]);
  });

  it('sorts with English collation for English', () => {
    expect(titles(sortServiceResourcesByTitle(resources, 'en'))).toEqual([
      'Ærlig',
      'aksjer',
      'Åsen',
      'Bank',
      'Østfold',
    ]);
  });

  it('does not mutate the input', () => {
    sortServiceResourcesByTitle(resources, 'nb');
    expect(titles(resources)).toEqual(['Østfold', 'aksjer', 'Åsen', 'Bank', 'Ærlig']);
  });
});
