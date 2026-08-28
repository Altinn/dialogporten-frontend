import { DialogStatus } from 'bff-types-generated';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import {
  buildDialogCsvRows,
  escapeCsvValue,
  getOrganizationNumber,
  getReadStatus,
  serializeCsv,
  toCsvFileName,
} from './exportDialogsCsv.ts';
import type { InboxItemInput } from './InboxItemInput.ts';

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>;
const formatDateTime = (date: string) => `dt:${date}`;
const formatDate = (date: string) => `d:${date}`;

const createItem = (overrides: Partial<InboxItemInput> = {}): InboxItemInput =>
  ({
    id: 'dialog-1',
    party: 'urn:altinn:organization:identifier-no:999888777',
    title: 'Søknad om tilskudd',
    contentUpdatedAt: '2026-08-06T10:00:00Z',
    sender: { name: 'NAV Arbeid', type: 'company' },
    serviceOwnerName: 'Skatteetaten',
    senderName: 'NAV Arbeid',
    recipient: { name: 'Ola Nordmann', type: 'person' },
    status: DialogStatus.RequiresAttention,
    dueAt: '2026-09-01T00:00:00Z',
    unread: false,
    unreadItems: false,
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
      'inbox.export.column.updated_at',
      'inbox.export.column.service_owner',
      'inbox.export.column.sender_name',
      'inbox.export.column.actor',
      'inbox.export.column.org_no',
      'inbox.export.column.status',
      'inbox.export.column.read_status',
      'inbox.export.column.due_at',
    ]);
    expect(rows[1]).toEqual([
      'Søknad om tilskudd',
      'dt:2026-08-06T10:00:00Z',
      'Skatteetaten',
      'NAV Arbeid',
      'Ola Nordmann',
      '999888777',
      'REQUIRES_ATTENTION',
      'word.read',
      'd:2026-09-01T00:00:00Z',
    ]);
  });

  it('leaves the stated sender name empty when the dialog has none', () => {
    const rows = buildDialogCsvRows([createItem({ senderName: undefined })], { t, formatDateTime, formatDate });
    expect(rows[1]?.[3]).toBe('');
    expect(rows[1]?.[2]).toBe('Skatteetaten');
  });

  it('leaves the due at column empty when there is no deadline', () => {
    const rows = buildDialogCsvRows([createItem({ dueAt: null })], { t, formatDateTime, formatDate });
    expect(rows[1]?.[8]).toBe('');
  });

  it('reports the read status of each dialog', () => {
    const rows = buildDialogCsvRows(
      [createItem({ unread: true }), createItem({ unread: false, unreadItems: true }), createItem()],
      { t, formatDateTime, formatDate },
    );

    expect(rows[1]?.[7]).toBe('word.unread');
    expect(rows[2]?.[7]).toBe('word.unread_content');
    expect(rows[3]?.[7]).toBe('word.read');
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

describe('getReadStatus', () => {
  it('reports an unread dialog as unread even when it also has unopened items', () => {
    expect(getReadStatus(createItem({ unread: true, unreadItems: true }), t)).toBe('word.unread');
  });

  it('reports unread content for a read dialog with unopened items', () => {
    expect(getReadStatus(createItem({ unread: false, unreadItems: true }), t)).toBe('word.unread_content');
  });

  it('reports a dialog without unopened items as read', () => {
    expect(getReadStatus(createItem({ unread: false, unreadItems: undefined }), t)).toBe('word.read');
  });
});

describe('getOrganizationNumber', () => {
  it('extracts the organization number from an organization urn', () => {
    expect(getOrganizationNumber('urn:altinn:organization:identifier-no:999888777')).toBe('999888777');
  });

  it('never exposes the identifier of a person urn', () => {
    expect(getOrganizationNumber('urn:altinn:person:identifier-no:11111111111')).toBe('');
  });

  it('returns an empty value for an unknown or missing urn', () => {
    expect(getOrganizationNumber('urn:altinn:systemuser:uuid:abc')).toBe('');
    expect(getOrganizationNumber(undefined)).toBe('');
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
