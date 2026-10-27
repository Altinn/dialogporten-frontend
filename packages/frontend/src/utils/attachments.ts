import type { BadgeProps } from '@altinn/altinn-components';
import { ExternalLinkIcon, FileIcon, FilesIcon, FileXMarkIcon, PadlockLockedIcon } from '@navikt/aksel-icons';
import { formatDistance } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import { type TFunction, t } from 'i18next';
import { logError } from '../analytics/errorLogger.ts';

const MEDIA_TYPE_TO_EXT: Record<string, string> = {
  'application/octet-stream': '',
  'application/pdf': 'PDF',
  'text/xml': 'XML',
  'application/xml': 'XML',
  'application/json': 'JSON',
  'image/jpeg': 'JPG',
  'application/jpeg': 'JPG',
  'application/jpg': 'JPG',
  'image/png': 'PNG',
  'application/png': 'PNG',
  'text/csv': 'CSV',
  'text/plain': 'TXT',
  'application/zip': 'ZIP',
  'audio/wav': 'WAV',
  'application/msword': 'DOC',
  'application/rtf': 'RTF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.oasis.opendocument.text': 'ODT',
  'application/odt': 'ODT',
  'application/ods': 'ODS',
  'application/vnd.ms-excel': 'XLS',
};

export const UNAUTHORIZED_ATTACHMENT_URL = 'urn:dialogporten:unauthorized';

export enum AttachmentState {
  Available = 'available',
  Expired = 'expired',
  Unauthorized = 'unauthorized',
}

/**
 * Resolves the state of an attachment URL. Unauthorized wins over expired,
 * since the user could not open the attachment even if it had not expired.
 * @param url - The attachment URL; Dialogporten replaces it with a sentinel URN when the user lacks access
 * @param expiresAt - Optional ISO date string for when the attachment expires
 * @param now - Reference time, defaults to the current time
 */
export function getAttachmentState(
  url: string,
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): AttachmentState {
  if (url === UNAUTHORIZED_ATTACHMENT_URL) return AttachmentState.Unauthorized;
  if (expiresAt && new Date(expiresAt) <= now) return AttachmentState.Expired;
  return AttachmentState.Available;
}

export function getAttachmentIcon(
  mediaType: string | null | undefined,
  state: AttachmentState,
): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  if (state === AttachmentState.Unauthorized) return PadlockLockedIcon;
  if (state === AttachmentState.Expired) return FileXMarkIcon;
  return mediaTypeToIcon(mediaType);
}

export function mediaTypeToIcon(value: string | null | undefined): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  switch (value) {
    case 'application/zip':
      return FilesIcon;
    case 'text/html':
      return ExternalLinkIcon;
    default:
      return FileIcon;
  }
}

export function mediaTypeToExt(value: string | null | undefined): string {
  try {
    if (!value) return '';

    const key = value.trim().toLowerCase();
    if (key === 'text/html') return t('word.link');
    return MEDIA_TYPE_TO_EXT[key] ?? value.trim().toUpperCase();
  } catch (error) {
    logError(
      error as Error,
      {
        context: 'mediaType.mediaTypeToExt',
        value,
      },
      'Error converting media type to extension',
    );
    return '';
  }
}

/**
 * Creates a badge object for the attachment state
 * @param state - The attachment state from getAttachmentState
 * @param expiryDate - Optional ISO date string for when the attachment expires
 * @param locale - date-fns locale for formatting relative time
 * @param t - Translation function for i18n
 * @returns Badge for unauthorized, expired or expiring attachments, or undefined if there is nothing to show
 */
export function getAttachmentBadge(
  state: AttachmentState,
  expiryDate: string | null | undefined,
  locale: Locale,
  t: TFunction<'translation', undefined>,
): BadgeProps | undefined {
  if (state === AttachmentState.Unauthorized || state === AttachmentState.Expired) {
    return {
      variant: 'outline',
      label: t(state === AttachmentState.Unauthorized ? 'attachment.unauthorized' : 'attachment.expired'),
      color: 'neutral',
    };
  }

  try {
    if (!expiryDate) return undefined;

    const now = new Date();
    const expiry = new Date(expiryDate);

    if (Number.isNaN(expiry.getTime())) {
      return undefined;
    }

    const relativeTime = formatDistance(expiry, now, {
      addSuffix: true,
      locale,
    });

    return {
      variant: 'subtle',
      label: t('attachment.expires_in', { relativeTime }),
      color: 'warning',
    };
  } catch (error) {
    logError(
      error as Error,
      {
        context: 'attachments.getAttachmentBadge',
        expiryDate,
      },
      'Error creating expiry badge',
    );
    return undefined;
  }
}
