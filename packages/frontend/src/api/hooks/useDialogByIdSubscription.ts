import { useQueryClient } from '@tanstack/react-query';
import { type DialogEventPayload, DialogEventType } from 'bff-types-generated';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SSE } from 'sse.js';
import { config } from '../../config.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { getNavigationOrigin } from '../../utils/viewType.ts';
import { getSubscriptionQuery } from '../subscription.ts';

type EventSourceEvent = Error & {
  responseCode: number;
};

export type DialogEventData = {
  data?: {
    dialogEvents?: DialogEventPayload;
  };
};

export const useDialogByIdSubscription = (dialogId: string | undefined, dialogToken: string | undefined) => {
  const disableSubscriptions = useFeatureFlag<boolean>('dialogporten.disableSubscriptions');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const { search } = useLocation();
  const { logError } = useErrorLogger();

  const eventSourceRef = useRef<SSE | null>(null);
  const isFirstRender = useRef(true);
  const onMessageRef = useRef<((eventData: DialogEventData, rawEvent: MessageEvent) => void) | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (disableSubscriptions) {
      return;
    }

    if (!dialogId || !dialogToken || isMock) return;

    let cancelled = false;
    let retryAttempt = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearRetry = () => {
      if (retryTimeout !== null) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    };

    const closeConnection = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      clearRetry();
      // Exponential backoff with full jitter: base 1s, max 30s.
      // Prevents retry storms when many clients reconnect after a transient outage.
      const base = 1000;
      const max = 30000;
      const exp = Math.min(max, base * 2 ** retryAttempt);
      const delay = Math.random() * exp;
      retryAttempt = Math.min(retryAttempt + 1, 10);
      retryTimeout = setTimeout(connect, delay);
    };

    // Lifecycle: opens on mount / tab becoming visible / network coming online,
    // closes on unmount / tab hidden, and reconnects with exponential backoff on error.
    const connect = () => {
      if (cancelled) return;
      if (document.hidden) return;
      if (!navigator.onLine) return;

      clearRetry();
      closeConnection();

      const eventSource = new SSE(config.dialogportenStreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${dialogToken}`,
        },
        payload: JSON.stringify({
          query: getSubscriptionQuery(dialogId),
          variables: {},
          operationName: 'sub',
        }),
      });

      eventSourceRef.current = eventSource;

      eventSource.addEventListener('open', () => {
        if (cancelled) return;
        retryAttempt = 0;
      });

      eventSource.addEventListener('next', (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const jsonPayload = JSON.parse(event.data);
          const updatedType: DialogEventType | undefined = jsonPayload.data?.dialogEvents?.type;

          onMessageRef.current?.(jsonPayload, event);
          if (updatedType === DialogEventType.DialogDeleted) {
            /* Redirect user to the folder they came from, or default to inbox */
            const navigationOrigin = getNavigationOrigin(location.state);
            navigate(navigationOrigin + pruneSearchQueryParams(search.toString()));
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
      });

      eventSource.addEventListener('error', (err: EventSourceEvent) => {
        if (cancelled) return;
        if (err.responseCode === 0) {
          closeConnection();
          return;
        }
        logError(err, { context: 'useDialogByIdSubscription.onError', dialogId }, 'EventSource connection error');
        closeConnection();
        scheduleReconnect();
      });
    };

    const handleVisibilityChange = () => {
      if (cancelled) return;
      if (document.hidden) {
        clearRetry();
        closeConnection();
      } else {
        retryAttempt = 0;
        connect();
      }
    };

    connect();
    window.addEventListener('online', connect);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearRetry();
      window.removeEventListener('online', connect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      closeConnection();
    };
  }, [dialogId, dialogToken, search, isMock, disableSubscriptions]);

  const onMessageEvent = useCallback((handler: (eventData: DialogEventData, rawEvent: MessageEvent) => void) => {
    onMessageRef.current = handler;
  }, []);

  return {
    onMessageEvent,
  };
};
