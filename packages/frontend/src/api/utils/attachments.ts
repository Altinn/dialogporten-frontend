import type { BadgeProps } from '@altinn/altinn-components';
import { formatDistance } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import type { TFunction } from 'i18next';
import { logError } from '../../utils/errorLogger.ts';

const MEDIA_TYPE_TO_EXT: Record<string, string> = {
  'application/octet-stream': '',
  'application/pdf': 'PDF',
  'text/xml': 'XML',
  'application/xml': 'XML',
  'text/html': 'HTML',
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

export function mediaTypeToExt(value: string | null | undefined): string {
  try {
    if (!value) return '';

    const key = value.trim().toLowerCase();
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
 * Creates a badge object for attachment expiry status
 * @param expiryDate - Optional ISO date string for when the attachment expires
 * @param locale - date-fns locale for formatting relative time
 * @param t - Translation function for i18n
 * @returns Badge object with expiry information, or undefined if no expiry date
 */
export function createExpiryBadge(
  expiryDate: string | null | undefined,
  locale: Locale,
  t: TFunction<'translation', undefined>,
): BadgeProps | undefined {
  try {
    if (!expiryDate) return undefined;

    const now = new Date();
    const expiry = new Date(expiryDate);

    if (Number.isNaN(expiry.getTime())) {
      return undefined;
    }

    if (expiry <= now) {
      return {
        variant: 'tinted',
        label: t('attachment.expired'),
        color: 'neutral',
      };
    }

    const relativeTime = formatDistance(expiry, now, {
      addSuffix: true,
      locale,
    });

    return {
      variant: 'outline',
      label: t('attachment.expires_in', { relativeTime }),
      color: 'neutral',
    };
  } catch (error) {
    logError(
      error as Error,
      {
        context: 'attachments.createExpiryBadge',
        expiryDate,
      },
      'Error creating expiry badge',
    );
    return undefined;
  }
}
