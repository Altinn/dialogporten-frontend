import { DialogStatus } from 'bff-types-generated';
import type { TFunction } from 'i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDueAtProps } from './dueAt.ts';

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>;
const formatDate = (date: string) => date;

const daysFromNow = (days: number): string => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('getDueAtProps', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns undefined when dueAt is missing', () => {
    expect(getDueAtProps(undefined, DialogStatus.RequiresAttention, t, formatDate)).toBeUndefined();
    expect(getDueAtProps(null, DialogStatus.RequiresAttention, t, formatDate)).toBeUndefined();
  });

  it('returns undefined for an invalid date', () => {
    expect(getDueAtProps('not-a-date', DialogStatus.RequiresAttention, t, formatDate)).toBeUndefined();
  });

  it('uses warning when the due date is more than 14 days away', () => {
    const result = getDueAtProps(daysFromNow(20), DialogStatus.RequiresAttention, t, formatDate);
    expect(result?.color).toBe('warning');
    expect(result?.variant).toBeUndefined();
    expect(result?.label).toBe('dialog.due_at');
  });

  it('uses danger when the due date is less than 14 days away', () => {
    const result = getDueAtProps(daysFromNow(5), DialogStatus.RequiresAttention, t, formatDate);
    expect(result?.color).toBe('danger');
    expect(result?.label).toBe('dialog.due_at');
  });

  it('uses danger and the expired label when the due date has passed and action is required', () => {
    const result = getDueAtProps(daysFromNow(-5), DialogStatus.RequiresAttention, t, formatDate);
    expect(result?.color).toBe('danger');
    expect(result?.label).toBe('dialog.due_at_expired');
  });

  it.each([DialogStatus.Completed, DialogStatus.Awaiting])('uses neutral outline for status %s', (status) => {
    const result = getDueAtProps(daysFromNow(5), status, t, formatDate);
    expect(result?.color).toBe('neutral');
    expect(result?.variant).toBe('outline');
  });

  it('keeps the expired label but stays neutral for a settled status', () => {
    const result = getDueAtProps(daysFromNow(-5), DialogStatus.Completed, t, formatDate);
    expect(result?.color).toBe('neutral');
    expect(result?.variant).toBe('outline');
    expect(result?.label).toBe('dialog.due_at_expired');
  });
});
