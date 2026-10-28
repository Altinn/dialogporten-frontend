import { FileIcon, FileXMarkIcon, PadlockLockedIcon } from '@navikt/aksel-icons';
import { nb } from 'date-fns/locale';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import {
  AttachmentState,
  getAttachmentBadge,
  getAttachmentIcon,
  getAttachmentState,
  UNAUTHORIZED_ATTACHMENT_URL,
} from './attachments.ts';

const t = ((key: string) => key) as unknown as TFunction<'translation', undefined>;

const now = new Date('2026-10-27T12:00:00.000Z');
const url = 'https://example.com/document.pdf';

describe('getAttachmentState', () => {
  it('is available when the attachment has no expiry', () => {
    expect(getAttachmentState(url, null, now)).toBe(AttachmentState.Available);
  });

  it('is available when the expiry is in the future', () => {
    expect(getAttachmentState(url, '2026-10-28T12:00:00.000Z', now)).toBe(AttachmentState.Available);
  });

  it('is expired when the expiry is in the past', () => {
    expect(getAttachmentState(url, '2026-10-26T12:00:00.000Z', now)).toBe(AttachmentState.Expired);
  });

  it('is expired when the expiry is exactly now', () => {
    expect(getAttachmentState(url, now.toISOString(), now)).toBe(AttachmentState.Expired);
  });

  it('is unauthorized when the url is the unauthorized sentinel', () => {
    expect(getAttachmentState(UNAUTHORIZED_ATTACHMENT_URL, null, now)).toBe(AttachmentState.Unauthorized);
  });

  it('is unauthorized when the attachment is both unauthorized and expired', () => {
    expect(getAttachmentState(UNAUTHORIZED_ATTACHMENT_URL, '2026-10-26T12:00:00.000Z', now)).toBe(
      AttachmentState.Unauthorized,
    );
  });

  it('is available when the expiry is not a valid date', () => {
    expect(getAttachmentState(url, 'not-a-date', now)).toBe(AttachmentState.Available);
  });
});

describe('getAttachmentIcon', () => {
  it('shows a padlock when unauthorized', () => {
    expect(getAttachmentIcon('application/pdf', AttachmentState.Unauthorized)).toBe(PadlockLockedIcon);
  });

  it('shows a crossed-out file when expired', () => {
    expect(getAttachmentIcon('application/pdf', AttachmentState.Expired)).toBe(FileXMarkIcon);
  });

  it('falls back to the media type icon when available', () => {
    expect(getAttachmentIcon('application/pdf', AttachmentState.Available)).toBe(FileIcon);
  });
});

describe('getAttachmentBadge', () => {
  it('shows a neutral no access badge when unauthorized', () => {
    expect(getAttachmentBadge(AttachmentState.Unauthorized, null, nb, t)).toEqual({
      variant: 'outline',
      label: 'attachment.unauthorized',
      color: 'neutral',
    });
  });

  it('shows a neutral expired badge when expired', () => {
    expect(getAttachmentBadge(AttachmentState.Expired, '2026-10-26T12:00:00.000Z', nb, t)).toEqual({
      variant: 'outline',
      label: 'attachment.expired',
      color: 'neutral',
    });
  });

  it('shows a warning badge when available with a future expiry', () => {
    const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(getAttachmentBadge(AttachmentState.Available, inThirtyDays, nb, t)).toEqual({
      variant: 'subtle',
      label: 'attachment.expires_in',
      color: 'warning',
    });
  });

  it('shows no badge when available without expiry', () => {
    expect(getAttachmentBadge(AttachmentState.Available, null, nb, t)).toBeUndefined();
  });
});
