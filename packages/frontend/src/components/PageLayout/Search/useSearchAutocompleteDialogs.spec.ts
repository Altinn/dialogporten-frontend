import type { DialogStatus } from 'bff-types-generated';
import { SystemLabel } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { InboxViewType } from '../../../api/hooks/useDialogs.tsx';
import { organizations } from '../../../mocks/data/base/organizations.ts';
import type { InboxItemInput } from '../../../pages/Inbox/InboxItemInput.ts';
import { createSendersForAutocomplete } from './useAutocomplete.tsx';

describe('generateSendersAutocompleteBySearchString', () => {
  const mockDialogs: InboxItemInput[] = [
    {
      id: '019241f7-5fa0-7336-934d-716a8e5bbb49',
      party: 'urn:altinn:person:identifier-no:1',
      title: 'Skatten din for 2022',
      summary: 'Skatteoppgjøret for 2022 er klart. Du kan fortsatt gjøre endringer.',
      sender: {
        name: 'Skatteetaten',
        type: 'company',
        imageUrl: 'https://altinncdn.no/orgs/skd/skd.png',
      },
      recipient: {
        name: 'Test Testesen',
        type: 'company',
      },
      createdAt: '2023-03-11T07:00:00.000Z',
      updatedAt: '2023-07-15T08:45:00.000Z',
      status: 'COMPLETED' as DialogStatus,
      isSeenByEndUser: false,
      label: [SystemLabel.Default],
      org: 'skd',
      hasUnopenedContent: false,
      contentUpdatedAt: '2024-11-27T15:36:52.131Z',
      guiAttachmentCount: 1,
      seenByOthersCount: 0,
      seenByLabel: 'Sett av deg',
      viewType: 'INBOX' as InboxViewType,
      seenSinceLastContentUpdate: [],
      seenByLog: {
        collapsible: true,
        title: 'Sett av deg',
        items: [
          {
            id: '1',
            type: 'person',
            name: 'Test Testesen',
            isEndUser: true,
            seenAt: '2023-07-15 08:45',
            seenAtLabel: '15. juli kl 08.45',
          },
        ],
      },
    },
    {
      id: '019241f7-812c-71c8-8e68-94a0b771fa10',
      party: 'urn:altinn:person:identifier-no:1',
      title: 'Undersøkelse om levekår',
      summary:
        'Du er en av 6.000 personer som er trukket ut fra folkeregisteret til å delta i SSBs undersøkelse om levekår.\n\n',
      sender: {
        name: 'Statistisk sentralbyrå',
        type: 'company',
        imageUrl: 'https://altinncdn.no/orgs/ssb/ssb_dark.png',
      },
      recipient: {
        name: 'Test Testesen',
        type: 'company',
      },
      createdAt: '2023-05-17T09:30:00.000Z',
      org: 'ssb',
      hasUnopenedContent: false,
      contentUpdatedAt: '2024-11-27T15:36:52.131Z',
      guiAttachmentCount: 1,
      seenByOthersCount: 1,
      seenByLabel: 'Sett av deg',
      viewType: 'INBOX' as InboxViewType,
      status: 'REQUIRES_ATTENTION' as DialogStatus,
      isSeenByEndUser: true,
      label: [SystemLabel.Default],
      updatedAt: '2023-05-17T09:30:00.000Z',
      seenSinceLastContentUpdate: [],
      seenByLog: {
        collapsible: true,
        title: 'Sett av deg',
        items: [
          {
            id: '1',
            type: 'person',
            name: 'Test Testesen',
            isEndUser: true,
            seenAt: '2023-05-17 09:30',
            seenAtLabel: '17. mai kl 09.30',
          },
          {
            id: '2',
            type: 'person',
            name: 'Test Bruker',
            seenAt: '2023-05-18 10:00',
            seenAtLabel: '18. mai kl 10.00',
          },
        ],
      },
    },
  ];

  it('should return no hits when sender (searchValue) is empty', () => {
    const result = createSendersForAutocomplete('', mockDialogs as InboxItemInput[]);
    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({
      noHits: { title: 'noHits' },
    });
  });

  it('should return matched sender when search value matches sender name', () => {
    const resultSKD = createSendersForAutocomplete('skat', mockDialogs as InboxItemInput[], organizations);
    const resultSSB = createSendersForAutocomplete('sentralby', mockDialogs as InboxItemInput[], organizations);

    expect(resultSKD.items).toHaveLength(1);
    expect(resultSKD.items[0].title).toBe('Søk etter avsender Skatteetaten');
    expect(resultSKD.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });

    expect(resultSSB.items).toHaveLength(1);
    expect(resultSSB.items[0].title).toBe('Søk etter avsender Statistisk sentralbyrå');
    expect(resultSSB.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return matched sender and unmatched search string', () => {
    const resultSKD = createSendersForAutocomplete('skat test1', mockDialogs as InboxItemInput[], organizations);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValue = resultSKD.items[0].params.find((item) => item.type === 'search');
    expect(searchUnmatechedValue.type === 'search');
    expect(searchUnmatechedValue.label === 'test1');
    expect(resultSKD.items[0].title).toBe('Søk etter avsender Skatteetaten med fritekst test1');
    expect(resultSKD.items).toHaveLength(1);

    expect(resultSKD.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return all matched senders and unmatched search string if provided', () => {
    const result = createSendersForAutocomplete('skat sentralby test1', mockDialogs as InboxItemInput[], organizations);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSKD = result.items[0]?.params?.find((item) => item.type === 'search');
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSSB = result.items[1]?.params?.find((item) => item.type === 'search');

    expect(searchUnmatechedValueSKD.type === 'search');
    expect(searchUnmatechedValueSKD.label === 'test1');

    expect(searchUnmatechedValueSSB.type === 'search');
    expect(searchUnmatechedValueSSB.label === 'test1');

    expect(result.items[0].title).toBe('Søk etter avsender Skatteetaten med fritekst sentralby test1');
    expect(result.items[1].title).toBe('Søk etter avsender Statistisk sentralbyrå med fritekst skat test1');
    expect(result.items).toHaveLength(2);

    expect(result.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return no hits when search value does not match any sender name', () => {
    const result = createSendersForAutocomplete('Nonexistent Sender', mockDialogs as InboxItemInput[]);

    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });
});
