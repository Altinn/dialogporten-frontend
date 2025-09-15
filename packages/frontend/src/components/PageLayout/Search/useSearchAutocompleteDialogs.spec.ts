import type { CountableDialogFieldsFragment, DialogStatus } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { organizations } from '../../../mocks/data/base/organizations.ts';
import { createSendersForAutocomplete } from './senderSuggestions.tsx';

describe('generateSendersAutocompleteBySearchString', () => {
  const mockDialogs: CountableDialogFieldsFragment[] = [
    {
      id: '019241f7-5fa0-7336-934d-716a8e5bbb41',
      party: 'urn:altinn:person:identifier-no:1',
      status: 'COMPLETED' as DialogStatus,
      org: 'digdir',
      contentUpdatedAt: '2024-11-27T15:36:52.131Z',
      seenSinceLastContentUpdate: [],
      endUserContext: {
        __typename: undefined,
        systemLabels: [],
      },
    },
    {
      id: '019241f7-5fa0-7336-934d-716a8e5bbb49',
      party: 'urn:altinn:person:identifier-no:1',
      status: 'COMPLETED' as DialogStatus,
      org: 'skd',
      contentUpdatedAt: '2024-11-27T15:36:52.131Z',
      seenSinceLastContentUpdate: [],
      endUserContext: {
        __typename: undefined,
        systemLabels: [],
      },
    },
    {
      id: '019241f7-812c-71c8-8e68-94a0b771fa10',
      party: 'urn:altinn:person:identifier-no:1',
      org: 'ssb',
      contentUpdatedAt: '2024-11-27T15:36:52.131Z',
      status: 'REQUIRES_ATTENTION' as DialogStatus,
      seenSinceLastContentUpdate: [],
      endUserContext: {
        __typename: undefined,
        systemLabels: [],
      },
    },
  ];

  it('should return no hits when sender (searchValue) is empty', () => {
    const result = createSendersForAutocomplete('', mockDialogs);
    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({
      noHits: { title: 'noHits' },
    });
  });

  it('should return matched sender when search value matches sender name', () => {
    const resultSKD = createSendersForAutocomplete('skat', mockDialogs, organizations);
    const resultSSB = createSendersForAutocomplete('sentralby', mockDialogs, organizations);

    expect(resultSKD.items).toHaveLength(1);
    expect(resultSKD.items[0].title).toBe('Søk etter avsender Skatteetaten');
    expect(resultSKD.groups).toEqual({});

    expect(resultSSB.items).toHaveLength(1);
    expect(resultSSB.items[0].title).toBe('Søk etter avsender Statistisk sentralbyrå');
    expect(resultSSB.groups).toEqual({});
  });

  it('should return matched sender and unmatched search string', () => {
    const resultSKD = createSendersForAutocomplete('skat test1', mockDialogs, organizations);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValue = resultSKD.items[0].params.find((item) => item.type === 'search');
    expect(searchUnmatechedValue?.type === 'search');
    expect(searchUnmatechedValue?.label === 'test1');
    expect(resultSKD.items[0].title).toBe('Søk etter avsender Skatteetaten med fritekst test1');
    expect(resultSKD.items).toHaveLength(1);

    expect(resultSKD.groups).toEqual({});
  });

  it('should return matched sender and unmatched for digdir', () => {
    const results = createSendersForAutocomplete('digdir', mockDialogs, organizations);
    expect(results.items[0].title).toEqual('Søk etter avsender Digitaliseringsdirektoratet');
    expect(results.items[0].params).toEqual([{ type: 'filter', label: 'Digitaliseringsdirektoratet' }]);
    expect(results.groups).toEqual({});
  });

  it('should return all matched senders and unmatched search string if provided', () => {
    const result = createSendersForAutocomplete('skat sentralby test1', mockDialogs, organizations);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSKD = result.items[0]?.params?.find((item) => item.type === 'search');
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSSB = result.items[1]?.params?.find((item) => item.type === 'search');

    expect(searchUnmatechedValueSKD?.type === 'search');
    expect(searchUnmatechedValueSKD?.label === 'test1');

    expect(searchUnmatechedValueSSB?.type === 'search');
    expect(searchUnmatechedValueSSB?.label === 'test1');

    expect(result.items[0].title).toBe('Søk etter avsender Skatteetaten med fritekst sentralby test1');
    expect(result.items[1].title).toBe('Søk etter avsender Statistisk sentralbyrå med fritekst skat test1');
    expect(result.items).toHaveLength(2);

    expect(result.groups).toEqual({});
  });

  it('should return no hits when search value does not match any sender name', () => {
    const result = createSendersForAutocomplete('Nonexistent Sender', mockDialogs);

    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({});
  });
});
