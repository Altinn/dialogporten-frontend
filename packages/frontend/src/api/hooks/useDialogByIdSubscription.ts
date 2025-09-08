import { useQueryClient } from '@tanstack/react-query';
import { DialogEventType } from 'bff-types-generated';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SSE } from 'sse.js';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { PageRoutes } from '../../pages/routes.ts';

export type SubscriptionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useDialogByIdSubscription = (dialogId: string | undefined, dialogToken: string | undefined) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('disconnected');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { search } = useLocation();

  // biome-ignore lint: lint/correctness/useExhaustiveDependencies
  useEffect(() => {
    if (!dialogId || !dialogToken) {
      setSubscriptionStatus('disconnected');
      return;
    }

    setSubscriptionStatus('connecting');

    const eventSource = new SSE(`/api/graphql/stream?dialogId=${dialogId}`, {
      headers: { 'digdir-dialog-token': dialogToken },
      withCredentials: true,
    });

    const onOpen = () => {
      setSubscriptionStatus('connected');
    };

    const onError = (err: Event) => {
      console.error('EventSource error:', err);
      setSubscriptionStatus('error');
    };

    const onNext = (event: MessageEvent) => {
      try {
        const jsonPayload = JSON.parse(event.data);
        const updatedType: DialogEventType | undefined = jsonPayload.data?.dialogEvents?.type;
        if (updatedType && updatedType === DialogEventType.DialogDeleted) {
          // Redirect to inbox if the dialog was deleted
          navigate(PageRoutes.inbox + pruneSearchQueryParams(search.toString()));
        } else if (updatedType && updatedType === DialogEventType.DialogUpdated) {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
        }
      } catch (e) {
        console.error('Error parsing event data:', e);
      }
    };

    eventSource.addEventListener('open', onOpen);
    eventSource.addEventListener('next', onNext);
    eventSource.addEventListener('error', onError);

    return () => {
      eventSource.removeEventListener('open', onOpen);
      eventSource.removeEventListener('next', onNext);
      eventSource.removeEventListener('error', onError);
      eventSource.close();
      setSubscriptionStatus('disconnected');
    };
  }, [dialogId, dialogToken, queryClient]);

  return { subscriptionStatus };
};
