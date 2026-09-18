import { describe, expect, it } from 'vitest';
import { getEnvironmentConfig } from '../src/graphql/serviceResources/config.ts';
import {
  getLocalizedTitle,
  isDeprecatedServiceResource,
  sortServiceResourcesByTitle,
} from '../src/graphql/serviceResources/service.ts';
import { at23TestIds, prodTestIDs, tt02TestIds } from '../src/graphql/serviceResources/testIds.ts';

describe('getLocalizedTitle', () => {
  it('trims the title and collapses repeated whitespace', () => {
    expect(getLocalizedTitle({ nb: '  Fond for lyd  og bilde \t- Film ' }, ['nb'])).toBe(
      'Fond for lyd og bilde - Film',
    );
  });

  it('falls back to the next language when the preferred title is blank', () => {
    expect(getLocalizedTitle({ nb: '   ', nn: ' Søknad ' }, ['nb', 'nn', 'en'])).toBe('Søknad');
    expect(getLocalizedTitle({ nb: ' ', en: ' Application' }, ['nb', 'nn'])).toBe('Application');
  });

  it('sorts titles with leading whitespace by their first visible letter', () => {
    const resources = [' Fond for lyd og bilde', 'Arbeidsgiver', 'Egenmelding'].map((nb) => ({
      title: getLocalizedTitle({ nb }, ['nb']),
    }));
    expect(sortServiceResourcesByTitle(resources, 'nb').map((r) => r.title)).toEqual([
      'Arbeidsgiver',
      'Egenmelding',
      'Fond for lyd og bilde',
    ]);
  });
});

describe('getEnvironmentConfig', () => {
  it.each([
    ['https://platform.altinn.no', prodTestIDs],
    ['https://platform.tt02.altinn.no', tt02TestIds],
    ['https://platform.at23.altinn.cloud', at23TestIds],
    ['https://platform.yt01.altinn.cloud', at23TestIds],
  ])('excludes the test IDs for the environment of %s', (platformUrl, testIds) => {
    expect(getEnvironmentConfig(platformUrl).excludeIds).toBe(testIds);
  });
});

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
