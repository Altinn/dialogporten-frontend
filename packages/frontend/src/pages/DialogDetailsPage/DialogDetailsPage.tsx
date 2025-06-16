import {
  PageBase,
  PageNav,
  Section,
  type SnackbarColor,
  SnackbarDuration,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { SystemLabel } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useParams } from 'react-router-dom';
import { useDialogById } from '../../api/hooks/useDialogById.tsx';
import { useDialogByIdSubscription } from '../../api/hooks/useDialogByIdSubscription.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateSystemLabel } from '../../api/queries.ts';
import { DialogDetails } from '../../components';
import { DialogToolbar } from '../../components/DialogToolbar/DialogToolbar.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

export const DialogDetailsPage = () => {
  const { id } = useParams();
  const { parties } = useParties();
  const { t } = useTranslation();
  const location = useLocation();
  const { dialog, isLoading: isLoadingDialog, isSuccess, isError, isAuthLevelTooLow } = useDialogById(parties, id);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [undoLoading, setUndoLoading] = useState<boolean>(false);
  const { openSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const isLoading = isLoadingDialog || (!isSuccess && !isError);

  useDialogByIdSubscription(dialog?.id, dialog?.dialogToken);

  const handleMoveDialog = async ({
    id,
    toLabel,
    successMessageKey,
    failureMessageKey,
    setLoading,
  }: {
    id: string;
    toLabel: SystemLabel;
    successMessageKey: string;
    failureMessageKey: string;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const showSnackbar = (messageKey: string, color: SnackbarColor) => {
      openSnackbar({
        message: t(messageKey),
        duration: SnackbarDuration.normal,
        color,
      });
    };

    const invalidateQueries = async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
    };

    try {
      setLoading(true);
      const {
        setSystemLabel: { success: isSuccess },
      } = await updateSystemLabel(id, toLabel);

      if (isSuccess) {
        await invalidateQueries();
        showSnackbar(successMessageKey, 'success');
      } else {
        showSnackbar(failureMessageKey, 'danger');
      }
    } catch (error) {
      showSnackbar(failureMessageKey, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoMoving = async (id: string) => {
    await handleMoveDialog({
      id,
      toLabel: SystemLabel.Default,
      successMessageKey: 'dialog.toolbar.toast.move_to_inbox_success',
      failureMessageKey: 'dialog.toolbar.toast.move_to_inbox_failed',
      setLoading: setUndoLoading,
    });
  };

  const handleMoveDialogToArchive = async (id: string) => {
    await handleMoveDialog({
      id,
      toLabel: SystemLabel.Archive,
      successMessageKey: 'dialog.toolbar.toast.move_to_archive_success',
      failureMessageKey: 'dialog.toolbar.toast.move_to_archive_failed',
      setLoading: setArchiveLoading,
    });
  };

  const handleMoveDialogBin = async (id: string) => {
    await handleMoveDialog({
      id,
      toLabel: SystemLabel.Bin,
      successMessageKey: 'dialog.toolbar.toast.move_to_bin_success',
      failureMessageKey: 'dialog.toolbar.toast.move_to_bin_failed',
      setLoading: setDeleteLoading,
    });
  };

  const previousPath = (location?.state?.fromView ?? '/') + location.search;
  const showToolbar = id && dialog && !isLoading;

  return (
    <PageBase spacing={0} bleed>
      <Section theme="default" shadow="xs">
        <PageNav
          color="neutral"
          padding={2}
          backButton={{
            label: t('word.back'),
            as: (props: LinkProps) => <Link {...props} to={previousPath} state={{ scrollToId: id }} />,
          }}
        />
        <DialogDetails dialog={dialog} isLoading={isLoading} isAuthLevelTooLow={isAuthLevelTooLow} />
      </Section>
      {showToolbar && (
        <DialogToolbar
          currentLabel={dialog.label}
          archiveAction={{ onClick: () => handleMoveDialogToArchive(id), isLoading: archiveLoading }}
          deleteAction={{ onClick: () => handleMoveDialogBin(id), isLoading: deleteLoading }}
          undoAction={{ onClick: () => handleUndoMoving(id), isLoading: undoLoading }}
        />
      )}
    </PageBase>
  );
};
