import { Typography } from '@altinn/altinn-components';
import { useQuery } from '@tanstack/react-query';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
import { type DialogByIdDetails, EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import styles from './mainContentReference.module.css';

const getContent = (mediaType: EmbeddableMediaType, data: string) => {
  switch (mediaType) {
    case EmbeddableMediaType.markdown_deprecated:
    case EmbeddableMediaType.markdown:
      return <Markdown onError={(e) => console.error('Markdown error: ', e)}>{data}</Markdown>;
    case EmbeddableMediaType.html_deprecated:
    case EmbeddableMediaType.html:
      return <Html onError={(e) => console.error('Html error: ', e)}>{data}</Html>;
    default:
      return data;
  }
};

export const MainContentReference = memo(
  ({ content, dialogToken }: { content: DialogByIdDetails['mainContentReference']; dialogToken: string }) => {
    const { data, isSuccess } = useQuery({
      queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, content?.url, content?.mediaType],
      queryFn: () =>
        fetch(content!.url, {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${dialogToken}`,
          },
        }).then((res) => res.text()),
      enabled: content?.url !== undefined && Object.values(EmbeddableMediaType).includes(content.mediaType),
    });

    if (!content || !isSuccess) {
      return null;
    }
    return <Typography className={styles.mainContentReference}>{getContent(content.mediaType, data)}</Typography>;
  },
);
