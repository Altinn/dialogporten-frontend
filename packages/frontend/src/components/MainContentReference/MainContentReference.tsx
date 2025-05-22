import { Typography } from '@altinn/altinn-components';
import { useQuery } from '@tanstack/react-query';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
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

const getContent = (mediaType: EmbeddableMediaType, data: string) => {
  switch (mediaType) {
    case EmbeddableMediaType.markdown:
      return <Markdown onError={(e) => console.error('Markdown error: ', e)}>{data}</Markdown>;
    case EmbeddableMediaType.html:
      return <Html onError={(e) => console.error('Html error: ', e)}>{data}</Html>;
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
    const validURL = content?.url ? isValidURL(content.url) : false;
    const { data, isSuccess } = useQuery({
      queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, id],
      staleTime: 1000 * 60 * 10,
      queryFn: () =>
        fetch(content!.url, {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${dialogToken}`,
          },
        }).then((res) => res.text()),
      enabled: validURL && content?.mediaType && Object.values(EmbeddableMediaType).includes(content.mediaType),
    });

    if (!content || !isSuccess) {
      return null;
    }
    return <Typography className={styles.mainContentReference}>{getContent(content.mediaType, data)}</Typography>;
  },
);
