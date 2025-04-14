import { DialogStatus, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../hooks/useDialogs.tsx';

type viewTypeDerivable = {
  systemLabel: SystemLabel;
  status: DialogStatus;
};

export const isBinDialog = (dialog: viewTypeDerivable): boolean => dialog.systemLabel === SystemLabel.Bin;

export const isArchivedDialog = (dialog: viewTypeDerivable): boolean => dialog.systemLabel === SystemLabel.Archive;

export const isInboxDialog = (dialog: viewTypeDerivable): boolean =>
  !isBinDialog(dialog) &&
  !isArchivedDialog(dialog) &&
  [DialogStatus.New, DialogStatus.InProgress, DialogStatus.RequiresAttention, DialogStatus.Completed].includes(
    dialog.status,
  );

export const isDraftDialog = (dialog: viewTypeDerivable): boolean =>
  !isBinDialog(dialog) && !isArchivedDialog(dialog) && dialog.status === DialogStatus.Draft;

export const isSentDialog = (dialog: viewTypeDerivable): boolean =>
  !isBinDialog(dialog) && !isArchivedDialog(dialog) && dialog.status === DialogStatus.Sent;

export const getViewType = (dialog: viewTypeDerivable): InboxViewType => {
  if (isDraftDialog(dialog)) {
    return 'drafts';
  }
  if (isArchivedDialog(dialog)) {
    return 'archive';
  }
  if (isSentDialog(dialog)) {
    return 'sent';
  }
  if (isBinDialog(dialog)) {
    return 'bin';
  }
  if (isInboxDialog(dialog)) {
    return 'inbox';
  }
  console.warn('Unknown dialog status, fallback=inbox', dialog.status);
  return 'inbox';
};
