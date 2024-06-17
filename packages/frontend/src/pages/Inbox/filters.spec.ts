import { describe, expect, it } from 'vitest';
import type { Filter } from '../../components';
import type { InboxItemInput } from './Inbox.tsx';
import { filterDialogs } from './filters';

describe('filterDialogs', () => {
  const dialogs = [
    {
      id: 1,
      sender: { label: 'Ole' },
      receiver: { label: 'Kari' },
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      id: 2,
      sender: { label: 'Nils' },
      receiver: { label: 'Liv' },
      createdAt: '2024-02-01T10:00:00Z',
    },
    {
      id: 3,
      sender: { label: 'Ole' },
      receiver: { label: 'Eva' },
      createdAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 4,
      sender: { label: 'Per' },
      receiver: { label: 'Kari' },
      createdAt: '2024-01-15T10:00:00Z',
    },
  ] as unknown as InboxItemInput[];

  it('returns all dialogs when no filters are active', () => {
    const activeFilters: Filter[] = [];
    expect(filterDialogs(dialogs, activeFilters)).toEqual(dialogs);
  });

  it('filters dialogs by single sender', () => {
    const activeFilters = [{ id: 'sender', value: 'Ole' }];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0], dialogs[2]]);
  });

  it('filters dialogs by multiple senders (OR logic)', () => {
    const activeFilters = [
      { id: 'sender', value: 'Ole' },
      { id: 'sender', value: 'Nils' },
    ];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0], dialogs[1], dialogs[2]]);
  });

  it('filters dialogs by sender and receiver (AND logic)', () => {
    const activeFilters = [
      { id: 'sender', value: 'Ole' },
      { id: 'receiver', value: 'Kari' },
    ];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0]]);
  });

  it('filters dialogs by created date range', () => {
    const activeFilters = [{ id: 'created', value: '2024-01-01/2024-01-03' }];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0]]);
  });

  it('filters dialogs by specific creation date', () => {
    const activeFilters = [{ id: 'created', value: '2024-02-01T10:00:00Z' }];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[1]]);
  });

  it('combines filters with AND and OR logic correctly', () => {
    const activeFilters = [
      { id: 'sender', value: 'Ole' },
      { id: 'receiver', value: 'Eva' },
      { id: 'created', value: '2024-03-01T10:00:00Z' },
    ];
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[2]]);
  });
});
