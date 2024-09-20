import { DialogEventType } from 'bff-types-generated';
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Routes } from '../pages/Inbox/Inbox.tsx';

export const useDialogByIdSubscription = (dialogId: string | undefined) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dialogId) return;

    const eventSource = new EventSource(`/api/graphql/stream?dialogId=${dialogId}`, { withCredentials: true });
    const onError = (err: Event) => {
      console.error('EventSource error:', err);
    };

    const onNext = (event: MessageEvent) => {
      try {
        const jsonPayload = JSON.parse(event.data);
        const updatedType: DialogEventType | undefined = jsonPayload.data?.dialogEvents?.type;
        if (updatedType && updatedType === DialogEventType.DialogDeleted) {
          // Redirect to inbox if the dialog was deleted
          navigate(Routes.inbox);
        } else if (updatedType && updatedType === DialogEventType.DialogUpdated) {
          void queryClient.invalidateQueries('dialogById');
        }
      } catch (e) {
        console.error('Error parsing event data:', e);
      }
    };

    eventSource.addEventListener('next', onNext);
    eventSource.addEventListener('error', onError);

    return () => {
      eventSource.removeEventListener('next', onNext);
      eventSource.removeEventListener('error', onError);
      eventSource.close();
    };
  }, [dialogId, queryClient]);
};
