import type { DialogMetadataDueAtProps } from '@altinn/altinn-components';
import { DialogStatus } from 'bff-types-generated';
import type { TFunction } from 'i18next';

const DUE_AT_SOON_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const isDueAtExpired = (dueAt?: string): boolean => {
  if (!dueAt) return false;
  const time = new Date(dueAt).getTime();
  if (Number.isNaN(time)) return false;
  return time < Date.now();
};

const isDueAtSoon = (dueAt: string): boolean => {
  const time = new Date(dueAt).getTime();
  if (Number.isNaN(time)) return false;
  return time - Date.now() < DUE_AT_SOON_THRESHOLD_DAYS * MS_PER_DAY;
};

const isSettledStatus = (status: DialogStatus): boolean =>
  status === DialogStatus.Completed || status === DialogStatus.Awaiting;

export const getDueAtProps = (
  dueAt: string | undefined | null,
  status: DialogStatus,
  t: TFunction<'translation', undefined>,
  formatDate: (date: string) => string,
): DialogMetadataDueAtProps | undefined => {
  if (!dueAt) return undefined;
  if (Number.isNaN(new Date(dueAt).getTime())) return undefined;

  const expired = isDueAtExpired(dueAt);
  const label = t(expired ? 'dialog.due_at_expired' : 'dialog.due_at', { date: formatDate(dueAt) });

  if (isSettledStatus(status)) {
    return { datetime: dueAt, label, color: 'neutral', variant: 'outline' };
  }

  return { datetime: dueAt, label, color: expired || isDueAtSoon(dueAt) ? 'danger' : 'warning' };
};
