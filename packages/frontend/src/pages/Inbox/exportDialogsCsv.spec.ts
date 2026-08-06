import { DialogStatus } from 'bff-types-generated';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { buildDialogCsvRows, escapeCsvValue, serializeCsv, toCsvFileName } from './exportDialogsCsv.ts';
import type { InboxItemInput } from './InboxItemInput.ts';

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>;
const formatDateTime = (date: string) => `dt:${date}`;
const formatDate = (date: string) => `d:${date}`;

const createItem = (overrides: Partial<InboxItemInput> = {}): InboxItemInput =>
  ({
    id: 'dialog-1',
    title: 'Søknad om tilskudd',
    contentUpdatedAt: '2026-08-06T10:00:00Z',
    sender: { name: 'Skatteetaten', type: 'company' },
    recipient: { name: 'Ola Nordmann', type: 'person' },
    status: DialogStatus.RequiresAttention,
    dueAt: '2026-09-01T00:00:00Z',
    ...overrides,
  }) as InboxItemInput;

describe('escapeCsvValue', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvValue('Skatteetaten')).toBe('Skatteetaten');
  });

  it('quotes and doubles embedded quotes', () => {
    expect(escapeCsvValue('Sagt "nei"')).toBe('"Sagt ""nei"""');
  });

  it('quotes values containing the delimiter or a line break', () => {
    expect(escapeCsvValue('a;b')).toBe('"a;b"');
    expect(escapeCsvValue('a\nb')).toBe('"a\nb"');
  });

  it('neutralizes values that a spreadsheet would read as a formula', () => {
    expect(escapeCsvValue('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(escapeCsvValue('@cmd')).toBe("'@cmd");
    expect(escapeCsvValue('-1+1')).toBe("'-1+1");
  });
});

describe('serializeCsv', () => {
  it('prefixes a BOM and joins rows with CRLF', () => {
    expect(serializeCsv([['a', 'b'], ['c']])).toBe('﻿a;b\r\nc');
  });
});

describe('buildDialogCsvRows', () => {
  it('emits a localized header followed by one row per dialog', () => {
    const rows = buildDialogCsvRows([createItem()], { t, formatDateTime, formatDate });

    expect(rows[0]).toEqual([
      'inbox.export.column.title',
      'inbox.export.column.date',
      'inbox.export.column.from',
      'inbox.export.column.to',
      'inbox.export.column.status',
      'inbox.export.column.due_at',
    ]);
    expect(rows[1]).toEqual([
      'Søknad om tilskudd',
      'dt:2026-08-06T10:00:00Z',
      'Skatteetaten',
      'Ola Nordmann',
      'REQUIRES_ATTENTION',
      'd:2026-09-01T00:00:00Z',
    ]);
  });

  it('leaves the due at column empty when there is no deadline', () => {
    const rows = buildDialogCsvRows([createItem({ dueAt: null })], { t, formatDateTime, formatDate });
    expect(rows[1]?.[5]).toBe('');
  });

  it('leaves date columns empty for unparseable timestamps', () => {
    const rows = buildDialogCsvRows([createItem({ contentUpdatedAt: 'not-a-date' })], {
      t,
      formatDateTime,
      formatDate,
    });
    expect(rows[1]?.[1]).toBe('');
  });

  it('returns only the header when there are no dialogs', () => {
    expect(buildDialogCsvRows([], { t, formatDateTime, formatDate })).toHaveLength(1);
  });
});

describe('toCsvFileName', () => {
  it('slugifies Norwegian characters', () => {
    expect(toCsvFileName('Innboks', '2026-08-06')).toBe('innboks-2026-08-06.csv');
    expect(toCsvFileName('Lagrede søk', '2026-08-06')).toBe('lagrede-soek-2026-08-06.csv');
    expect(toCsvFileName('Påbegynt', '2026-08-06')).toBe('paabegynt-2026-08-06.csv');
  });

  it('falls back when the base name has no usable characters', () => {
    expect(toCsvFileName('!!!', '2026-08-06')).toBe('export-2026-08-06.csv');
  });
});
