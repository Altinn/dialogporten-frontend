import { type BulkButtonProps, type SnackbarColor, SnackbarDuration, useSnackbar } from '@altinn/altinn-components';
import { ArchiveIcon, CheckmarkIcon, EyeClosedIcon, InboxFillIcon, TrashIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SystemLabel } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../../analytics/analytics.ts';
import { getDialogMoveEvent } from '../../analytics/analyticsEvents.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { bulkUpdateSystemLabels } from '../queries.ts';

interface UseBulkActionsProps {
  selectedDialogIds: string[];
  allDialogs: InboxItemInput[];
  onSelectAll: () => void;
  onDismiss: () => void;
}

interface UseBulkActionsOutput {
  footerActions: BulkButtonProps[];
  headerActions: BulkButtonProps[];
}

export const useBulkActions = ({
  selectedDialogIds,
  allDialogs,
  onSelectAll,
  onDismiss,
}: UseBulkActionsProps): UseBulkActionsOutput => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();

  if (!selectedDialogIds.length)
    return {
      footerActions: [],
      headerActions: [],
    };

  const selectedDialogs = allDialogs.filter((d) => selectedDialogIds.includes(d.id));

  const headerActions: BulkButtonProps[] = [
    {
      icon: CheckmarkIcon,
      label: t('bulk_action.select_all'),
      onClick: onSelectAll,
    },
  ];

  const updateLabel = async (toLabel: SystemLabel, successKey: string, failureKey: string) => {
    const showSnackbar = (key: string, color: SnackbarColor) =>
      openSnackbar({ message: t(key, { count: selectedDialogIds.length }), color, duration: SnackbarDuration.normal });

    try {
      setLoading(true);
      const res = await bulkUpdateSystemLabels(selectedDialogIds, [toLabel]);
      if (res.bulkSetSystemLabels?.success) {
        Analytics.trackEvent(getDialogMoveEvent(toLabel), {
          'dialog.id': 'BULK_MODE',
          'move.to': toLabel,
        });

        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOGS] });
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
        showSnackbar(successKey, 'company');
      } else {
        showSnackbar(failureKey, 'danger');
      }
    } catch {
      showSnackbar(failureKey, 'danger');
    } finally {
      setLoading(false);
      onDismiss();
    }
  };

  const hasUnreadFalse = selectedDialogs.some((d) => !d.unread);
  const hasBinOrInbox = selectedDialogs.some((d) => d.viewType === 'bin' || d.viewType === 'inbox');
  const hasArchiveOrInbox = selectedDialogs.some((d) => d.viewType === 'archive' || d.viewType === 'inbox');
  const hasBinOrArchive = selectedDialogs.some((d) => d.viewType === 'archive' || d.viewType === 'bin');

  const footerActions: BulkButtonProps[] = [
    ...(hasUnreadFalse
      ? [
          {
            icon: EyeClosedIcon,
            label: t('dialog.toolbar.mark_as_unread'),
            loading,
            onClick: () => {
              void updateLabel(
                SystemLabel.MarkedAsUnopened,
                'bulk_action.mark_as_unread.success',
                'bulk_action.mark_as_unread.failure',
              );
            },
          },
        ]
      : []),
    ...(hasBinOrArchive
      ? [
          {
            icon: InboxFillIcon,
            loading,
            label: t('dialog.toolbar.move_undo'),
            onClick: () => {
              void updateLabel(SystemLabel.Default, 'bulk_action.inbox.success', 'bulk_action.inbox.failure');
            },
          },
        ]
      : []),
    ...(hasBinOrInbox
      ? [
          {
            icon: ArchiveIcon,
            loading,
            label: t('dialog.toolbar.move_to_archive'),
            onClick: () => {
              void updateLabel(SystemLabel.Archive, 'bulk_action.archive.success', 'bulk_action.archive.failure');
            },
          },
        ]
      : []),
    ...(hasArchiveOrInbox
      ? [
          {
            icon: TrashIcon,
            label: t('dialog.toolbar.move_to_bin'),
            onClick: () => {
              void updateLabel(SystemLabel.Bin, 'bulk_action.bin.success', 'bulk_action.bin.failure');
            },
          },
        ]
      : []),
  ];

  return {
    footerActions,
    headerActions,
  };
};
