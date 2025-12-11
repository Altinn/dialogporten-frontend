import { type MenuItemProps, type SnackbarColor, SnackbarDuration, useSnackbar } from '@altinn/altinn-components';
import { ArchiveIcon, EyeClosedIcon, InboxFillIcon, TrashIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SystemLabel } from 'bff-types-generated';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateSystemLabel } from '../../api/queries';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useGlobalState } from '../../useGlobalState.ts';
import { pruneSearchQueryParams } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes.ts';

export const useDialogActions = () => {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const { search } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [archiveLoading, setArchiveLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_ARCHIVE_LABEL_LOADING, false);
  const [deleteLoading, setDeleteLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_DELETE_LABEL_LOADING, false);
  const [undoLoading, setUndoLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_UNDO_LABEL_LOADING, false);

  const EXCLUSIVE_LABELS = [SystemLabel.Default, SystemLabel.Archive, SystemLabel.Bin];

  const handleUpdateLabel = useCallback(
    async (
      dialogId: string,
      toLabel: SystemLabel,
      successKey: string,
      failureKey: string,
      setLoading: (val: boolean) => void,
    ) => {
      const showSnackbar = (key: string, color: SnackbarColor) =>
        openSnackbar({ message: t(key), color, duration: SnackbarDuration.normal });

      try {
        setLoading(true);
        const res = await updateSystemLabel(dialogId, toLabel);
        if (res.setSystemLabel?.success) {
          await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
          await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
          showSnackbar(successKey, 'accent');
        } else {
          showSnackbar(failureKey, 'danger');
        }
      } catch {
        showSnackbar(failureKey, 'danger');
      } finally {
        setLoading(false);
      }
    },
    [openSnackbar, t, queryClient],
  );

  return (dialogId: string, currentLabels: SystemLabel[], isUnread: boolean): MenuItemProps[] => {
    const currentLabel = (currentLabels || []).find((label) => EXCLUSIVE_LABELS.includes(label)) || SystemLabel.Default;
    const items: MenuItemProps[] = [];

    if (dialogId && !isUnread) {
      items.push({
        id: 'delete',
        groupId: 'mark-as-unread',
        icon: EyeClosedIcon,
        label: t('dialog.toolbar.mark_as_unread'),
        as: 'button',
        onClick: () => {
          if (location.pathname !== PageRoutes.inbox) {
            // Escape before a subscription of dialog cases a refetch and removes the label
            navigate(PageRoutes.inbox + pruneSearchQueryParams(search.toString()));
          }
          void handleUpdateLabel(
            dialogId,
            SystemLabel.MarkedAsUnopened,
            'dialog.toolbar.toast.mark_as_unread_success',
            'dialog.toolbar.toast.mark_as_unread_failed',
            setDeleteLoading,
          );
        },
        disabled: undoLoading,
      });
    }

    if ([SystemLabel.Archive, SystemLabel.Bin].includes(currentLabel) && dialogId) {
      items.push({
        id: 'undo',
        groupId: 'system-labels',
        icon: InboxFillIcon,
        label: t('dialog.toolbar.move_undo'),
        as: 'button',
        onClick: () =>
          handleUpdateLabel(
            dialogId,
            SystemLabel.Default,
            'dialog.toolbar.toast.move_to_inbox_success',
            'dialog.toolbar.toast.move_to_inbox_failed',
            setUndoLoading,
          ),
        disabled: archiveLoading,
      });
    }

    if (currentLabel !== SystemLabel.Archive && dialogId) {
      items.push({
        id: 'archive',
        groupId: 'system-labels',
        icon: ArchiveIcon,
        label: t('dialog.toolbar.move_to_archive'),
        as: 'button',
        onClick: () =>
          handleUpdateLabel(
            dialogId,
            SystemLabel.Archive,
            'dialog.toolbar.toast.move_to_archive_success',
            'dialog.toolbar.toast.move_to_archive_failed',
            setArchiveLoading,
          ),
        disabled: deleteLoading,
      });
    }

    if (currentLabel !== SystemLabel.Bin && dialogId) {
      items.push({
        id: 'delete',
        groupId: 'system-labels',
        icon: TrashIcon,
        label: t('dialog.toolbar.move_to_bin'),
        as: 'button',
        onClick: () =>
          handleUpdateLabel(
            dialogId,
            SystemLabel.Bin,
            'dialog.toolbar.toast.move_to_bin_success',
            'dialog.toolbar.toast.move_to_bin_failed',
            setDeleteLoading,
          ),
        disabled: undoLoading,
      });
    }

    return items;
  };
};
