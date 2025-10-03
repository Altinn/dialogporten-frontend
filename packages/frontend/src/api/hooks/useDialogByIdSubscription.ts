import { useQueryClient } from '@tanstack/react-query';
import { DialogEventType } from 'bff-types-generated';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SSE } from 'sse.js';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../pages/routes.ts';

export const useDialogByIdSubscription = (dialogId: string | undefined, dialogToken: string | undefined): boolean => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const { search } = useLocation();
  const { logError } = useErrorLogger();

  const eventSourceRef = useRef<SSE | null>(null);
  const lastInvalidatedDate = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!dialogId || !dialogToken) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const eventSource = new SSE(`/api/graphql/stream?dialogId=${dialogId}`, {
      headers: { 'digdir-dialog-token': dialogToken },
      withCredentials: true,
    });
    eventSourceRef.current = eventSource;

    const onError = (err: Event) => {
      logError(
        new Error('EventSource error'),
        {
          context: 'useDialogByIdSubscription.onError',
          dialogId,
          event: err.type,
        },
        'EventSource connection error',
      );
    };

    const onOpen = () => {
      setIsOpen(true);
    };

    const onNext = (event: MessageEvent) => {
      try {
        const jsonPayload = JSON.parse(event.data);
        const updatedType: DialogEventType | undefined = jsonPayload.data?.dialogEvents?.type;

        const now = new Date().toISOString();
        if (lastInvalidatedDate?.current) {
          const diff = new Date(now).getTime() - new Date(lastInvalidatedDate.current).getTime();

          if (diff <= 500) {
            /* Debounce per 500 ms */
            return;
          }
          lastInvalidatedDate.current = now;
        }

        if (updatedType === DialogEventType.DialogDeleted) {
          navigate(PageRoutes.inbox + pruneSearchQueryParams(search.toString()));
        } else if (updatedType === DialogEventType.DialogUpdated) {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
        }
      } catch (e) {
        logError(
          e as Error,
          {
            context: 'useDialogByIdSubscription.onMessage.parseEventData',
            dialogId,
            eventData: event.data,
          },
          'Error parsing event data',
        );
      }
    };

    eventSource.addEventListener('next', onNext);
    eventSource.addEventListener('error', onError);
    eventSource.addEventListener('open', onOpen);

    return () => {
      eventSource.removeEventListener('next', onNext);
      eventSource.removeEventListener('error', onError);
      eventSource.removeEventListener('open', onOpen);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [dialogId, dialogToken, queryClient, navigate, search, logError]);

  if (isMock) {
    return true;
  }

  return isOpen;
};
