import type { TFunction } from 'i18next';
import type { InboxItemInput } from './InboxItemInput.ts';

export const CSV_DELIMITER = ';';
const CSV_LINE_BREAK = '\r\n';
const UTF8_BOM = '\ufeff';
const NEEDS_QUOTING = /["\n\r;]/;
const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];
const ORGANIZATION_URN_PREFIX = 'urn:altinn:organization:identifier-no:';

export const escapeCsvValue = (value: string): string => {
  const guarded = FORMULA_TRIGGERS.includes(value.charAt(0)) ? `'${value}` : value;
  return NEEDS_QUOTING.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

export const serializeCsv = (rows: string[][]): string =>
  UTF8_BOM + rows.map((row) => row.map(escapeCsvValue).join(CSV_DELIMITER)).join(CSV_LINE_BREAK);

interface BuildDialogCsvRowsOptions {
  t: TFunction<'translation', undefined>;
  formatDateTime: (date: string) => string;
  formatDate: (date: string) => string;
}

export const buildDialogCsvRows = (
  items: InboxItemInput[],
  { t, formatDateTime, formatDate }: BuildDialogCsvRowsOptions,
): string[][] => {
  const header = [
    t('inbox.export.column.title'),
    t('inbox.export.column.updated_at'),
    t('inbox.export.column.from'),
    t('inbox.export.column.to'),
    t('inbox.export.column.org_no'),
    t('inbox.export.column.status'),
    t('inbox.export.column.due_at'),
  ];

  const rows = items.map((item) => [
    item.title ?? '',
    safeFormat(item.contentUpdatedAt, formatDateTime),
    item.sender?.name ?? '',
    item.recipient?.name ?? '',
    getOrganizationNumber(item.party),
    item.status ?? '',
    safeFormat(item.dueAt, formatDate),
  ]);

  return [header, ...rows];
};

/* Only organizations get an identifier column: the person variant of this urn carries a
   a masked id and contains no information of interest */
export const getOrganizationNumber = (partyUrn: string | undefined): string =>
  partyUrn?.startsWith(ORGANIZATION_URN_PREFIX) ? partyUrn.slice(ORGANIZATION_URN_PREFIX.length) : '';

const safeFormat = (date: string | null | undefined, formatter: (date: string) => string): string => {
  if (!date || Number.isNaN(new Date(date).getTime())) return '';
  return formatter(date);
};

export const toCsvFileName = (baseName: string, isoDate: string): string => {
  const slug = baseName
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${slug || 'export'}-${isoDate}.csv`;
};

export const downloadCsv = (fileName: string, contents: string): void => {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
