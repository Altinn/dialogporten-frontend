import { type MenuItemProps, type SnackbarColor, SnackbarDuration, useSnackbar } from '@altinn/altinn-components';
import { ArchiveIcon, InboxFillIcon, TrashIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SystemLabel } from 'bff-types-generated';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { updateSystemLabel } from '../../api/queries';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { useGlobalState } from '../../useGlobalState.ts';

export const useDialogActions = () => {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [archiveLoading, setArchiveLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_ARCHIVE_LABEL_LOADING, false);
  const [deleteLoading, setDeleteLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_DELETE_LABEL_LOADING, false);
  const [undoLoading, setUndoLoading] = useGlobalState<boolean>(QUERY_KEYS.SET_UNDO_LABEL_LOADING, false);

  const EXCLUSIVE_LABELS = [SystemLabel.Default, SystemLabel.Archive, SystemLabel.Bin];

  const handleMoveDialog = useCallback(
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

  return (dialogId?: string, currentLabels?: SystemLabel[]): MenuItemProps[] => {
    const currentLabel = (currentLabels || []).find((label) => EXCLUSIVE_LABELS.includes(label)) || SystemLabel.Default;
    const items: MenuItemProps[] = [];

    if ([SystemLabel.Archive, SystemLabel.Bin].includes(currentLabel) && dialogId) {
      items.push({
        id: 'undo',
        groupId: 'system-labels',
        icon: InboxFillIcon,
        label: t('dialog.toolbar.move_undo'),
        as: 'button',
        onClick: () =>
          handleMoveDialog(
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
          handleMoveDialog(
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
          handleMoveDialog(
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
