import { type Color, type ContextMenuProps, DialogLayout, type PageMenuProps } from '@altinn/altinn-components';
import { ClockDashedIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useParams } from 'react-router-dom';
import { useDialogById } from '../../api/hooks/useDialogById.tsx';
import { useDialogByIdSubscription } from '../../api/hooks/useDialogByIdSubscription.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { DialogDetails } from '../../components';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useDialogActions } from './useDialogActions.tsx';

export const DialogDetailsPage = () => {
  const { id: dialogId } = useParams();
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const { parties } = useParties();
  const { t } = useTranslation();
  const location = useLocation();
  const qc = useQueryClient();
  const {
    dialog,
    isLoading: isLoadingDialog,
    isSuccess,
    isError,
    isAuthLevelTooLow,
    dataUpdatedAt,
  } = useDialogById(parties, dialogId);
  const isLoading = isLoadingDialog || (!isSuccess && !isError);
  const displayDialogActions = !!(dialogId && dialog && !isLoading);

  usePageTitle({ baseTitle: dialog?.title || '' });
  const createLabelUpdateActions = useDialogActions();
  const contextMenu: ContextMenuProps = {
    id: 'dialog-context-menu',
    placement: 'right',
    'aria-label': t('dialog.context_menu.label', { title: dialog?.title }),
    items: [
      ...(dialogId && dialog ? createLabelUpdateActions(dialogId, dialog?.label ?? [], dialog?.unread) : []),
      {
        id: 'activity-log',
        groupId: 'logs',
        label: t('dialog.activity_log.title'),
        as: 'button',
        icon: ClockDashedIcon,
        onClick: () => setIsActivityLogOpen(true),
      },
    ],
  };

  const mountAtRef = useRef<number>(Date.now());

  useEffect(() => {
    mountAtRef.current = Date.now();
  }, []);

  // We intentionally clear all cached main content reference queries for this dialog when leaving `/inbox/:dialogId`.
  // Reason: the expandable content is fetched lazily and keyed by (dialogId, itemId). If we keep it across navigations,
  // it can survive for `gcTime` and be reused on re-entry. For FCE we want each dialog visit to start clean and refetch
  // while still avoiding re-fetches during expand/collapse within the same visit for transmissions.
  useEffect(() => {
    return () => {
      if (!dialogId) return;
      qc.removeQueries({
        queryKey: [QUERY_KEYS.MAIN_CONTENT_REFERENCE, dialogId, dialogId],
        exact: false,
      });
      qc.removeQueries({
        queryKey: [QUERY_KEYS.CURRENT_DIALOG_TITLE],
        exact: false,
      });
    };
  }, [qc, dialogId]);

  const dialogTokenIsFreshAfterMount = dataUpdatedAt > mountAtRef.current ? dialog?.dialogToken : undefined;
  const { onMessageEvent } = useDialogByIdSubscription(dialog?.id, dialogTokenIsFreshAfterMount);
  const previousPath = (location?.state?.fromView ?? '/') + location.search;
  const labelActions = dialogId && dialog ? createLabelUpdateActions(dialogId, dialog.label, dialog.unread) : [];

  return (
    <DialogLayout
      color={dialog?.receiver?.type as Color}
      backButton={{
        label: t('word.back'),
        as: (props: LinkProps) => <Link {...props} to={previousPath} state={{ scrollToId: dialogId }} />,
      }}
      pageMenu={{ items: displayDialogActions ? labelActions : [] } as PageMenuProps}
      contextMenu={displayDialogActions ? contextMenu : undefined}
    >
      <DialogDetails
        dialogToken={dialogTokenIsFreshAfterMount}
        dialog={dialog}
        isLoading={isLoading}
        onMessageEvent={onMessageEvent}
        isAuthLevelTooLow={isAuthLevelTooLow}
        activityModalProps={{
          isOpen: isActivityLogOpen,
          setIsOpen: setIsActivityLogOpen,
        }}
      />
    </DialogLayout>
  );
};
