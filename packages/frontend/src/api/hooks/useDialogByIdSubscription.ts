import { useQueryClient } from '@tanstack/react-query';
import { type DialogEventPayload, DialogEventType } from 'bff-types-generated';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SSE } from 'sse.js';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../pages/routes.ts';

type EventSourceEvent = Error & {
  responseCode: number;
};

export type DialogEventData = {
  data?: {
    dialogEvents?: DialogEventPayload;
  };
};

export const useDialogByIdSubscription = (dialogId: string | undefined, dialogToken: string | undefined) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const { search } = useLocation();
  const { logError } = useErrorLogger();

  const eventSourceRef = useRef<SSE | null>(null);
  const lastInvalidatedDate = useRef(new Date().toISOString());
  const isFirstRender = useRef(true);
  const onMessageRef = useRef<((eventData: DialogEventData, rawEvent: MessageEvent) => void) | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!dialogId || !dialogToken || isMock) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      if (!navigator.onLine) return;

      // Close existing connection before creating a new one
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const eventSource = new SSE(`/api/graphql/stream?dialogId=${dialogId}`, {
        headers: { 'digdir-dialog-token': dialogToken },
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('open', () => {
        if (cancelled) return;
        setIsOpen(true);
      });

      eventSource.addEventListener('next', (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const jsonPayload = JSON.parse(event.data);
          const updatedType: DialogEventType | undefined = jsonPayload.data?.dialogEvents?.type;
          const now = new Date().toISOString();
          const diff = new Date(now).getTime() - new Date(lastInvalidatedDate.current).getTime();
          if (diff <= 500) return;
          lastInvalidatedDate.current = now;

          onMessageRef.current?.(jsonPayload, event);

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
      });

      eventSource.addEventListener('error', (err: EventSourceEvent) => {
        if (cancelled) return;
        if (err.responseCode === 0) {
          eventSource.close();
          setIsOpen(false);
          return;
        }
        logError(err, { context: 'useDialogByIdSubscription.onError', dialogId }, 'EventSource connection error');
        eventSource.close();
        setIsOpen(false);
        setTimeout(connect, 500);
      });
    };

    connect();
    window.addEventListener('online', connect);

    return () => {
      cancelled = true;
      window.removeEventListener('online', connect);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [dialogId, dialogToken, search, isMock]);

  const onMessageEvent = useCallback((handler: (eventData: DialogEventData, rawEvent: MessageEvent) => void) => {
    onMessageRef.current = handler;
  }, []);

  return {
    isOpen: isMock || isOpen,
    onMessageEvent,
  };
};
