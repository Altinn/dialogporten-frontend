import { useQueryClient } from '@tanstack/react-query';
import { type DialogEventPayload, DialogEventType } from 'bff-types-generated';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SSE } from 'sse.js';
import { config } from '../../config.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag.ts';
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

/**
 * Manages a Server-Sent Events (SSE) subscription for real-time dialog updates.
 *
 * SSE lifecycle:
 * 1. Dialog details opened -> SSE connection established with the current dialogToken.
 * 2. While on the dialog — periodic refetches (every 9 min) silently update the token
 *    via a ref without tearing down the active SSE connection. TTL for token is 10 minutes.
 * 3. Tab hidden -> SSE connection closed. Nothing runs in the background.
 * 4. Tab visible -> dialog is refetched first (fresh data + fresh token), then SSE
 *    reconnects with the new token. One fetch, one connection, no 401 risk.
 * 5. Navigating away -> component unmounts, SSE closed, listeners removed.
 *
 * The dialogToken is stored in a ref (not an effect dependency) so that token
 * refreshes from React Query (refetchOnWindowFocus, refetchInterval) never cause
 * unnecessary SSE reconnections. Only dialogId changes trigger effect re-runs.
 */
export const useDialogByIdSubscription = (
  dialogId: string | undefined,
  dialogToken: string | undefined,
  refreshDialogToken: () => Promise<string | undefined>,
) => {
  const disableSubscriptions = useFeatureFlag<boolean>('dialogporten.disableSubscriptions');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const { search } = useLocation();
  const { logError } = useErrorLogger();

  const eventSourceRef = useRef<SSE | null>(null);
  const onMessageRef = useRef<((eventData: DialogEventData, rawEvent: MessageEvent) => void) | undefined>(undefined);
  const dialogTokenRef = useRef(dialogToken);
  dialogTokenRef.current = dialogToken;
  const refreshDialogTokenRef = useRef(refreshDialogToken);
  refreshDialogTokenRef.current = refreshDialogToken;

  // Flips false→true once when the fresh token arrives, but stays true on subsequent refreshes.
  // This triggers the effect exactly once for initial connection without reconnecting on every token change.
  const hasToken = !!dialogToken;

  // biome-ignore lint/correctness/useExhaustiveDependencies: Token tracked via ref to avoid unnecessary reconnections
  useEffect(() => {
    if (disableSubscriptions) {
      return;
    }

    if (!dialogId || !dialogTokenRef.current || isMock) return;

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

      const token = dialogTokenRef.current;
      if (!token) return;

      clearRetry();
      closeConnection();

      const eventSource = new SSE(config.dialogportenStreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
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

    const refreshAndConnect = () => {
      refreshDialogTokenRef
        .current()
        .then((freshToken) => {
          if (freshToken) {
            dialogTokenRef.current = freshToken;
          }
        })
        .catch(() => {
          // Token refresh failed, will attempt connection with existing token
        })
        .finally(() => {
          if (!cancelled) {
            connect();
          }
        });
    };

    const handleVisibilityChange = () => {
      if (cancelled) return;
      if (document.hidden) {
        clearRetry();
        closeConnection();
      } else {
        retryAttempt = 0;
        refreshAndConnect();
      }
    };

    const handleOnline = () => {
      if (cancelled || document.hidden) return;
      refreshAndConnect();
    };

    connect();
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearRetry();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      closeConnection();
    };
  }, [dialogId, hasToken, search, isMock, disableSubscriptions]);

  const onMessageEvent = useCallback((handler: (eventData: DialogEventData, rawEvent: MessageEvent) => void) => {
    onMessageRef.current = handler;
  }, []);

  return {
    onMessageEvent,
  };
};
