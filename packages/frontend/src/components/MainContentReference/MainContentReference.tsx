import { Alert, Button, Typography } from '@altinn/altinn-components';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics.ts';
import { type DialogByIdDetails, EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
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
      return (
        <Markdown
          onError={(error: ErrorEvent) => {
            Analytics.trackException({
              exception: error.error,
              properties: {
                mediaType: 'markdown',
                errorType: 'content_rendering',
              },
            });
          }}
        >
          {data}
        </Markdown>
      );
    case EmbeddableMediaType.html:
      return (
        <Html
          onError={(e: ErrorEvent) => {
            Analytics.trackException({
              exception: e.error,
              properties: {
                mediaType: 'html',
                errorType: 'content_rendering',
              },
            });
          }}
        >
          {data}
        </Html>
      );
    default:
      return data;
  }
};

type MainContentError = Error & {
  status: number;
};

export const MainContentReference = memo(
  ({
    content,
    dialogToken,
    id,
  }: { content: DialogByIdDetails['mainContentReference']; dialogToken: string; id: string }) => {
    const { t } = useTranslation();

    const validURL = content?.url ? isValidURL(content.url) : false;
    const { data, isSuccess, isError, isLoading, refetch, error } = useAuthenticatedQuery<string, MainContentError>({
      queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, id, dialogToken],
      staleTime: 0,
      queryFn: async () => {
        const response = await fetch(content!.url, {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${dialogToken}`,
          },
        });
        if (!response.ok) {
          const error: MainContentError = Object.assign(
            new Error(`Failed to fetch content: ${response.status} ${response.statusText}`),
            { status: response.status },
          );

          Analytics.trackException({
            exception: error,
            properties: {
              url: content!.url,
              status: response.status,
              statusText: response.statusText,
              errorType: 'fetch_error',
            },
          });
          throw error;
        }
        return response.text();
      },
      enabled: validURL && content?.mediaType && Object.values(EmbeddableMediaType).includes(content.mediaType),
      retry: (failureCount, error) => {
        if (error?.status === 403 || error?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
    });
    const isForbidden = isError && error?.status === 403;

    if (!content) {
      return null;
    }

    if (isLoading) {
      return (
        <Typography loading>
          Loading data, <br /> Lorem ipsum dolor sit amet <br />
          consectetur adipiscing elit. Curabitur erat.
        </Typography>
      );
    }

    if (isForbidden) {
      return (
        <Alert
          variant="info"
          heading={t('main_content_reference.unauthorized_heading')}
          message={t('main_content_reference.unauthorized_message')}
        />
      );
    }

    if (isError) {
      return (
        <Alert
          variant="danger"
          heading={t('main_content_reference.error')}
          message={t('main_content_reference.error_message')}
        >
          <Button color="neutral" variant="outline" onClick={() => refetch()}>
            {t('main_content_reference.refetch')}
          </Button>
        </Alert>
      );
    }

    if (!isSuccess) {
      return null;
    }

    return <Typography className={styles.mainContentReference}>{getContent(content.mediaType, data)}</Typography>;
  },
);
