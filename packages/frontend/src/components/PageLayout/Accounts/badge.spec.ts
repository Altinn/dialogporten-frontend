import { DialogStatus, type PartyFieldsFragment, SystemLabel } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { InboxItemInput } from '../../../pages/Inbox/InboxItemInput.ts';
import { getAccountBadge } from './useAccounts';

describe('getCountBadge', () => {
  const dialogs: Partial<InboxItemInput>[] = [
    {
      party: 'party1',
      org: 'org1',
      id: 'dialog-1',
      title: '',
      summary: '',
      sender: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      recipient: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      createdAt: '',
      updatedAt: '',
      status: DialogStatus.Completed,
      isSeenByEndUser: false,
      label: [SystemLabel.Default],
      guiAttachmentCount: 0,
      seenByOthersCount: 0,
      seenByLabel: '',
      viewType: 'inbox',
    },
    {
      party: 'subParty1',
      id: 'dialog-2',
      org: 'org1',

      title: '',
      summary: '',
      sender: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      recipient: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      createdAt: '',
      updatedAt: '',
      status: DialogStatus.Completed,
      isSeenByEndUser: false,
      label: [SystemLabel.Default],
      guiAttachmentCount: 0,
      seenByOthersCount: 0,
      seenByLabel: '',
      viewType: 'inbox',
    },
    {
      party: 'party2',
      id: 'dialog-3',
      org: 'org1',
      title: '',
      summary: '',
      sender: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      recipient: {
        name: '',
        type: 'company',
        imageUrl: '',
      },
      createdAt: '',
      updatedAt: '',
      status: DialogStatus.Completed,
      isSeenByEndUser: false,
      label: [SystemLabel.Default],
      guiAttachmentCount: 0,
      seenByOthersCount: 0,
      seenByLabel: '',
      viewType: 'inbox',
    },
  ];

  const party: PartyFieldsFragment = {
    isAccessManager: false,
    isCurrentEndUser: false,
    isDeleted: false,
    isMainAdministrator: false,
    hasOnlyAccessToSubParties: false,
    name: 'party1',
    partyType: 'Person',
    party: 'party1',
    partyUuid: 'party:uuid:here',
    subParties: [
      {
        name: 'party1',
        party: 'subParty1',
        partyType: 'Person',
        isAccessManager: false,
        isMainAdministrator: false,
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:person:identifier-no:1337',
        isDeleted: false,
      },
    ],
  };

  it('should return undefined if no party is provided', () => {
    expect(getAccountBadge(dialogs as InboxItemInput[], undefined, false, 'person')).toBeUndefined();
  });

  it('should return undefined if no dialogs are provided', () => {
    expect(getAccountBadge([], party, false, 'person')).toBeUndefined();
  });

  it('should return a badge with the correct count, including sub party', () => {
    const badge = getAccountBadge(dialogs as InboxItemInput[], party, false, 'person');
    expect(badge).toEqual({ label: '2', size: 'sm', color: 'person' });
  });

  it('should return undefined if no matching dialogs are found', () => {
    const nonMatchingParty: PartyFieldsFragment = {
      isAccessManager: false,
      isCurrentEndUser: false,
      isDeleted: false,
      isMainAdministrator: false,
      hasOnlyAccessToSubParties: false,
      name: '',
      partyType: '',
      party: 'party3',
      subParties: [],
      partyUuid: 'party:uuid:here',
    };
    expect(getAccountBadge(dialogs as InboxItemInput[], nonMatchingParty, false, 'person')).toBeUndefined();
  });

  it('should return a badge with the correct count for multiple parties', () => {
    const multipleParties: PartyFieldsFragment[] = [
      {
        party: 'party1',
        subParties: [],
        partyType: '',
        isAccessManager: false,
        isMainAdministrator: false,
        name: 'party1',
        isCurrentEndUser: false,
        hasOnlyAccessToSubParties: false,
        isDeleted: false,
        partyUuid: 'party:uuid:here',
      },
      {
        party: 'party2',
        subParties: [],
        partyType: '',
        isAccessManager: false,
        isMainAdministrator: false,
        name: 'party2',
        isCurrentEndUser: false,
        hasOnlyAccessToSubParties: false,
        isDeleted: false,
        partyUuid: 'party:uuid:here',
      },
    ];
    const badge = getAccountBadge(dialogs as InboxItemInput[], multipleParties, false, 'company');
    expect(badge).toEqual({ label: '2', size: 'sm', color: 'company' });
  });
});
