import { type ContextMenuProps, DialogLayout } from '@altinn/altinn-components';
import { ClockDashedIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useParams } from 'react-router-dom';
import { useDialogById } from '../../api/hooks/useDialogById.tsx';
import { useDialogByIdSubscription } from '../../api/hooks/useDialogByIdSubscription.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { DialogDetails } from '../../components';
import { usePageTitle } from '../../utils/usePageTitle.tsx';
import { useDialogActions } from './useDialogActions.tsx';

export const DialogDetailsPage = () => {
  const { id: dialogId } = useParams();
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const { parties } = useParties();
  const { t } = useTranslation();
  const location = useLocation();
  const {
    dialog,
    isLoading: isLoadingDialog,
    isSuccess,
    isError,
    isAuthLevelTooLow,
  } = useDialogById(parties, dialogId);
  const isLoading = isLoadingDialog || (!isSuccess && !isError);
  const displayDialogActions = !!(dialogId && dialog && !isLoading);

  usePageTitle({ baseTitle: dialog?.title || '' });
  const systemLabelActions = useDialogActions();
  const contextMenu: ContextMenuProps = {
    id: 'dialog-context-menu',
    placement: 'right',
    ariaLabel: t('dialog.context_menu.label', { title: dialog?.title }),
    items: [
      ...systemLabelActions(dialogId, dialog?.label),
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

  const subscriptionOpened = useDialogByIdSubscription(dialog?.id, dialog?.dialogToken);
  const previousPath = (location?.state?.fromView ?? '/') + location.search;

  return (
    <DialogLayout
      backButton={{
        label: t('word.back'),
        as: (props: LinkProps) => <Link {...props} to={previousPath} state={{ scrollToId: dialogId }} />,
      }}
      pageMenu={displayDialogActions ? { items: systemLabelActions(dialogId, dialog?.label) } : undefined}
      contextMenu={displayDialogActions ? contextMenu : undefined}
    >
      <DialogDetails
        dialog={dialog}
        isLoading={isLoading}
        subscriptionOpened={subscriptionOpened}
        isAuthLevelTooLow={isAuthLevelTooLow}
        activityModalProps={{
          isOpen: isActivityLogOpen,
          setIsOpen: setIsActivityLogOpen,
        }}
      />
    </DialogLayout>
  );
};
