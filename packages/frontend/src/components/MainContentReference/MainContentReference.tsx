import { Alert, Button, Typography } from '@altinn/altinn-components';
import { Html, Markdown } from 'embeddable-markdown-html';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics/analytics.ts';
import { type DialogByIdDetails, EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { isValidURL } from '../../auth';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import styles from './mainContentReference.module.css';

interface MainContentReferenceProps {
  content: DialogByIdDetails['mainContentReference'];
  dialogToken: string;
  id: string;
  dialogId: string;
}

type MainContentError = Error & {
  status: number;
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

export const MainContentReference = memo(({ content, dialogToken, id, dialogId }: MainContentReferenceProps) => {
  const { t } = useTranslation();
  const validURL = content?.url ? isValidURL(content.url) : false;
  const { data, isSuccess, isError, isLoading, refetch, error } = useAuthenticatedQuery<string, MainContentError>({
    queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, id, dialogId],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 1000 * 60,
    refetchOnMount: false,
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
});
