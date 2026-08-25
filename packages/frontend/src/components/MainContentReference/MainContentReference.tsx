import { Alert, Button, Typography } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { type FormPolicy, type FormSubmission, Html, Markdown } from 'embeddable-markdown-html';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics/analytics.ts';
import { type DialogByIdDetails, EmbeddableMediaType } from '../../api/hooks/useDialogById.tsx';
import { isValidURL } from '../../auth/url.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag.ts';
import { getAcceptLanguageHeader } from '../../i18n/acceptLanguage.ts';
import { getPreferTimeZoneHeader } from '../../i18n/timeZone.ts';
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

interface FormHandling {
  onSubmit: (submission: FormSubmission) => void;
  formPolicy: FormPolicy;
}

const getContent = (mediaType: EmbeddableMediaType, data: string, formHandling: FormHandling) => {
  switch (mediaType) {
    case EmbeddableMediaType.markdown:
      return (
        <Markdown
          {...formHandling}
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
          {...formHandling}
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
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const queryClient = useQueryClient();
  const enablePreferHeader = useFeatureFlag<boolean>('fce.enablePreferHeader');
  const validURL = content?.url ? isValidURL(content.url) : false;

  /* A form in an embed posts back to the service owner that served it. Relative actions resolve
     against the embed's own url, and allowSameOrigin stays off so an embed cannot aim a submission
     at arbeidsflate itself. */
  const formPolicy = useMemo<FormPolicy>(() => ({ baseUrl: content?.url }), [content?.url]);

  const submitForm = useCallback(
    async (submission: FormSubmission) => {
      const isGet = submission.method === 'get';
      const isMultipart = submission.encType === 'multipart/form-data';
      const url = new URL(submission.action);
      const encoded = new URLSearchParams();

      for (const [key, value] of submission.formData.entries()) {
        if (typeof value === 'string') {
          encoded.append(key, value);
        }
      }

      if (isGet) {
        for (const [key, value] of encoded.entries()) {
          url.searchParams.append(key, value);
        }
      }

      try {
        const response = await fetch(url, {
          method: isGet ? 'GET' : 'POST',
          headers: {
            Authorization: `Bearer ${dialogToken}`,
            'Accept-Language': getAcceptLanguageHeader(language),
            // multipart bodies carry their own boundary, so the browser has to set that header
            ...(isGet || isMultipart ? {} : { 'Content-Type': 'application/x-www-form-urlencoded' }),
          },
          // files only survive a multipart submission, where FormData is passed through as-is
          body: isGet ? undefined : isMultipart ? submission.formData : encoded,
        });

        if (!response.ok) {
          throw Object.assign(new Error(`Failed to submit form: ${response.status} ${response.statusText}`), {
            status: response.status,
          });
        }

        /* The service owner acts on the submission by changing the dialog, so both the dialog and
           the embed body have to be re-read to show what came of it. */
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID, dialogId] }),
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, content?.url, id, dialogId, language],
          }),
        ]);
      } catch (e) {
        Analytics.trackException({
          exception: e as Error,
          properties: {
            url: submission.action,
            method: submission.method,
            errorType: 'form_submit_error',
          },
        });
      }
    },
    [content?.url, dialogId, dialogToken, id, language, queryClient],
  );
  const { data, isSuccess, isError, isLoading, refetch, error } = useAuthenticatedQuery<string, MainContentError>({
    queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, content?.url, id, dialogId, language],
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 1000 * 60,
    refetchOnMount: false,
    queryFn: async () => {
      const response = await fetch(content!.url, {
        headers: {
          'Content-Type': 'text/plain',
          'Accept-Language': getAcceptLanguageHeader(language),
          ...(enablePreferHeader ? { Prefer: getPreferTimeZoneHeader() } : {}),
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

  return (
    <Typography className={styles.mainContentReference}>
      {getContent(content.mediaType, data, { onSubmit: submitForm, formPolicy })}
    </Typography>
  );
});
