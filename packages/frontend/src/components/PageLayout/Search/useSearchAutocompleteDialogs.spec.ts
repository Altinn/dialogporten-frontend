import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { InboxViewType } from '../../../api/useDialogs.tsx';
import type { InboxItemInput } from '../../../pages/Inbox/InboxItemInput.ts';
import { generateSendersAutocompleteBySearchString } from './useSearchAutocompleteDialogs';

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
      receiver: {
        name: 'Test Testesen',
        type: 'company',
      },
      createdAt: '2023-03-11T07:00:00.000Z',
      updatedAt: '2023-07-15T08:45:00.000Z',
      status: 'COMPLETED' as DialogStatus,
      isSeenByEndUser: false,
      label: 'DEFAULT' as SystemLabel,
      org: 'skd',
      guiAttachmentCount: 1,
      seenByOthersCount: 0,
      seenByLabel: 'Sett av deg',
      viewType: 'INBOX' as InboxViewType,
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
      receiver: {
        name: 'Test Testesen',
        type: 'company',
      },
      createdAt: '2023-05-17T09:30:00.000Z',
      org: 'ssb',
      guiAttachmentCount: 1,
      seenByOthersCount: 1,
      seenByLabel: 'Sett av deg',
      viewType: 'INBOX' as InboxViewType,
      status: 'REQUIRES_ATTENTION' as DialogStatus,
      isSeenByEndUser: true,
      label: 'DEFAULT' as SystemLabel,
      updatedAt: '2023-05-17T09:30:00.000Z',
    },
  ];

  it('should return no hits when sender (searchValue) is empty', () => {
    const result = generateSendersAutocompleteBySearchString('', mockDialogs as InboxItemInput[]);
    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({
      noHits: { title: 'noHits' },
    });
  });

  it('should return matched sender when search value matches sender name', () => {
    const resultSKD = generateSendersAutocompleteBySearchString('skat', mockDialogs as InboxItemInput[]);
    const resultSSB = generateSendersAutocompleteBySearchString('sentralby', mockDialogs as InboxItemInput[]);

    expect(resultSKD.items).toHaveLength(1);
    expect(resultSKD.items[0].title).toBe('Skatteetaten');
    expect(resultSKD.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });

    expect(resultSSB.items).toHaveLength(1);
    expect(resultSSB.items[0].title).toBe('Statistisk sentralbyrå');
    expect(resultSSB.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return matched sender and unmatched search string', () => {
    const resultSKD = generateSendersAutocompleteBySearchString('skat test1', mockDialogs as InboxItemInput[]);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValue = resultSKD.items[0].params.find((item) => item.type === 'search');
    expect(searchUnmatechedValue.type === 'search');
    expect(searchUnmatechedValue.label === 'test1');
    expect(resultSKD.items[0].title).toBe('Skatteetaten');
    expect(resultSKD.items).toHaveLength(1);

    expect(resultSKD.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return all matched senders and unmatched search string if provided', () => {
    const result = generateSendersAutocompleteBySearchString('skat sentralby test1', mockDialogs as InboxItemInput[]);
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSKD = result.items[0].params.find((item) => item.type === 'search');
    //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
    const searchUnmatechedValueSSB = result.items[1].params.find((item) => item.type === 'search');

    expect(searchUnmatechedValueSKD.type === 'search');
    expect(searchUnmatechedValueSKD.label === 'test1');

    expect(searchUnmatechedValueSSB.type === 'search');
    expect(searchUnmatechedValueSSB.label === 'test1');

    expect(result.items[0].title).toBe('Skatteetaten');
    expect(result.items[1].title).toBe('Statistisk sentralbyrå');
    expect(result.items).toHaveLength(2);

    expect(result.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });

  it('should return no hits when search value does not match any sender name', () => {
    const result = generateSendersAutocompleteBySearchString('Nonexistent Sender', mockDialogs as InboxItemInput[]);

    expect(result.items).toEqual([]);
    expect(result.groups).toEqual({
      senders: { title: 'Søkeforslag' },
    });
  });
});
