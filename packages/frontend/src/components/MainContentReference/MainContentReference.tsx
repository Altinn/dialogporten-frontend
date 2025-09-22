import { Typography } from '@altinn/altinn-components';
import { useQuery } from '@tanstack/react-query';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type DialogByIdDetails, EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import styles from './mainContentReference.module.css';

const isValidURL = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const getContent = (mediaType: EmbeddableMediaType, data: string, onContentError: () => void) => {
  switch (mediaType) {
    case EmbeddableMediaType.markdown:
      return (
        <Markdown
          onError={(e) => {
            console.error('Markdown error: ', e);
            onContentError();
          }}
        >
          {data}
        </Markdown>
      );
    case EmbeddableMediaType.html:
      return (
        <Html
          onError={(e) => {
            console.error('Html error: ', e);
            onContentError();
          }}
        >
          {data}
        </Html>
      );
    default:
      return data;
  }
};

export const MainContentReference = memo(
  ({
    content,
    dialogToken,
    id,
  }: { content: DialogByIdDetails['mainContentReference']; dialogToken: string; id: string }) => {
    const { t } = useTranslation();
    const [hasContentError, setHasContentError] = useState(false);
    const validURL = content?.url ? isValidURL(content.url) : false;
    const { data, isSuccess, isError } = useQuery({
      queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, id],
      staleTime: 1000 * 60 * 10,
      queryFn: async () => {
        const response = await fetch(content!.url, {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${dialogToken}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        return response.text();
      },
      enabled: validURL && content?.mediaType && Object.values(EmbeddableMediaType).includes(content.mediaType),
      retry: 2,
    });

    if (!content || !isSuccess) {
      return null;
    }

    if (isError || hasContentError) {
      return <Typography className={styles.mainContentReference}>{t('main_content_reference.error')}</Typography>;
    }

    return (
      <Typography className={styles.mainContentReference}>
        {getContent(content.mediaType, data, () => setHasContentError(true))}
      </Typography>
    );
  },
);
