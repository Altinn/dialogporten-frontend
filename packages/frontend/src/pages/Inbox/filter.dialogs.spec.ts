import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { isBefore, isWithinInterval, startOfDay, startOfMonth, subMonths, subYears } from 'date-fns';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { InboxItemInput } from './InboxItemInput.ts';
import { filterDialogs } from './filters';

describe('filterDialogs', () => {
  const mockDate = new Date('2024-02-01T12:00:00Z'); // Fixed point in time
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  const dialogs = [
    {
      id: 1,
      sender: { name: 'Ole' },
      status: 'NEW',
      receiver: { name: 'Kari' },
      updatedAt: '2023-01-01T10:00:00Z',
    },
    {
      id: 2,
      sender: { name: 'Nils' },
      receiver: { name: 'Liv' },
      updatedAt: '2023-08-01T10:00:00Z',
    },
    {
      id: 3,
      sender: { name: 'Ole' },
      receiver: { name: 'Eva' },
      updatedAt: '2023-12-15T10:00:00Z',
    },
    {
      id: 4,
      sender: { name: 'Per' },
      receiver: { name: 'Kari' },
      updatedAt: '2024-02-01T08:00:00Z',
    },
  ] as unknown as InboxItemInput[];

  it('filters dialogs of the last six months', () => {
    const activeFilters: FilterState = { updated: ['LAST_SIX_MONTHS'] };
    const sixMonthsAgo = subMonths(mockDate, 6);

    const result = filterDialogs(dialogs, activeFilters);
    expect(result.every((d) => isWithinInterval(new Date(d.updatedAt), { start: sixMonthsAgo, end: mockDate }))).toBe(
      true,
    );
  });

  it('filters dialogs of the last twelve months', () => {
    const activeFilters: FilterState = { updated: ['LAST_TWELVE_MONTHS'] };
    const twelveMonthsAgo = subMonths(mockDate, 12);

    const result = filterDialogs(dialogs, activeFilters);
    expect(
      result.every((d) => isWithinInterval(new Date(d.updatedAt), { start: twelveMonthsAgo, end: mockDate })),
    ).toBe(true);
  });

  it('filters dialogs of this month', () => {
    const activeFilters: FilterState = { updated: ['THIS_MONTH'] };
    const startOfCurrentMonth = startOfMonth(mockDate);

    const result = filterDialogs(dialogs, activeFilters);
    expect(result.every((d) => new Date(d.updatedAt) >= startOfCurrentMonth)).toBe(true);
  });

  it('filters dialogs of today', () => {
    const activeFilters: FilterState = { updated: ['TODAY'] };
    const startOfToday = startOfDay(mockDate);

    const result = filterDialogs(dialogs, activeFilters);
    expect(result.every((d) => new Date(d.updatedAt) >= startOfToday)).toBe(true);
  });

  it('filters dialogs older than a year', () => {
    const activeFilters: FilterState = { updated: ['OLDER_THAN_ONE_YEAR'] };
    const oneYearAgo = subYears(mockDate, 1);

    const result = filterDialogs(dialogs, activeFilters);
    expect(result.every((d) => isBefore(new Date(d.updatedAt), oneYearAgo))).toBe(true);
  });

  it('returns all dialogs when no filters are active', () => {
    const activeFilters: FilterState = {};
    expect(filterDialogs(dialogs, activeFilters)).toEqual(dialogs);
  });

  it('returns all dialogs when no filters are applied, but key is taken', () => {
    const activeFilters: FilterState = {
      sender: [],
    };
    expect(filterDialogs(dialogs, activeFilters)).toEqual(dialogs);
  });

  it('filters dialogs by single sender', () => {
    const activeFilters = { sender: ['Ole'] };
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0], dialogs[2]]);
  });

  it('filters dialogs by multiple senders (OR logic)', () => {
    const activeFilters = { sender: ['Ole', 'Nils'] };
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0], dialogs[1], dialogs[2]]);
  });

  it('filters dialogs by sender and receiver (AND logic)', () => {
    const activeFilters = { sender: ['Ole'], receiver: ['Kari'] };
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0]]);
  });

  it('combines filters with AND and OR logic correctly', () => {
    expect(
      filterDialogs(dialogs, {
        sender: ['Ole'],
        receiver: ['Kari'],
        updated: ['OLDER_THAN_ONE_YEAR'],
      }),
    ).toEqual([dialogs[0]]);
  });

  it('filter dialogs that are new', () => {
    const activeFilters = { status: ['NEW'] };
    expect(filterDialogs(dialogs, activeFilters)).toEqual([dialogs[0]]);
  });
});
