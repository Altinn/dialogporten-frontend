import { DialogSection } from '@altinn/altinn-components';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorLogger } from '../../hooks/useErrorLogger';

interface AdditionalInfoContentProps {
  mediaType: string | undefined;
  value: string | undefined;
}

export const AdditionalInfoContent = memo(({ mediaType, value }: AdditionalInfoContentProps) => {
  const { t } = useTranslation();
  const { logError } = useErrorLogger();
  if (!value) {
    return null;
  }

  const onError = (context: string) => (e: ErrorEvent) => {
    logError(e.error as Error, { context: context, mediaType, value }, 'Error rendering additional info content');
  };

  const getContent = (mediaType: string) => {
    switch (mediaType) {
      case 'text/html':
        return <Html onError={onError('AdditionalInfoContent.Html')}>{value}</Html>;
      case 'text/markdown':
        return <Markdown onError={onError('AdditionalInfoContent.Markdown')}>{value}</Markdown>;
      case 'text/plain':
        return value;
      default:
        return value;
    }
  };

  return <DialogSection title={t('additional_info.title')}>{getContent(mediaType ?? 'text/plain')}</DialogSection>;
});
