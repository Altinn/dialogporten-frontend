import { DialogSection } from '@altinn/altinn-components';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface AdditionalInfoContentProps {
  mediaType: string | undefined;
  value: string | undefined;
}

export const AdditionalInfoContent = memo(({ mediaType, value }: AdditionalInfoContentProps) => {
  const { t } = useTranslation();
  if (!value) {
    return null;
  }

  const getContent = (mediaType: string) => {
    switch (mediaType) {
      case 'text/html':
        return <Html onError={(e) => console.error('Html error: ', e)}>{value}</Html>;
      case 'text/markdown':
        return <Markdown onError={(e) => console.error('Markdown error: ', e)}>{value}</Markdown>;
      case 'text/plain':
        return value;
      default:
        return value;
    }
  };

  return <DialogSection title={t('additional_info.title')}>{getContent(mediaType ?? 'text/plain')}</DialogSection>;
});
