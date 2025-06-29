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
    subParties: [
      {
        name: 'party1',
        party: 'subParty1',
        partyType: 'Person',
        isAccessManager: false,
        isMainAdministrator: false,
        isCurrentEndUser: false,
        isDeleted: false,
      },
    ],
  };

  it('should return undefined if no party is provided', () => {
    expect(getAccountBadge(dialogs as InboxItemInput[])).toBeUndefined();
  });

  it('should return undefined if no dialogs are provided', () => {
    expect(getAccountBadge([], party)).toBeUndefined();
  });

  it('should return a badge with the correct count, including sub party', () => {
    const badge = getAccountBadge(dialogs as InboxItemInput[], party);
    expect(badge).toEqual({ label: '2', size: 'sm' });
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
    };
    expect(getAccountBadge(dialogs as InboxItemInput[], nonMatchingParty)).toBeUndefined();
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
      },
    ];
    const badge = getAccountBadge(dialogs as InboxItemInput[], multipleParties);
    expect(badge).toEqual({ label: '2', size: 'sm' });
  });
});
