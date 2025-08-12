import { DialogStatus, type EndUserContext, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../hooks/useDialogs.tsx';

type viewTypeDerivable = {
  systemLabel: EndUserContext['systemLabels'] | undefined;
  status: DialogStatus;
};

export const isBinDialog = (dialog: viewTypeDerivable): boolean =>
  dialog.systemLabel?.includes(SystemLabel.Bin) ?? false;

export const isArchivedDialog = (dialog: viewTypeDerivable): boolean =>
  dialog.systemLabel?.includes(SystemLabel.Archive) ?? false;

export const isDraftDialog = (dialog: viewTypeDerivable): boolean =>
  dialog.status?.includes(DialogStatus.Draft) ?? false;

export const isSentDialog = (dialog: viewTypeDerivable): boolean =>
  dialog.systemLabel?.includes(SystemLabel.Sent) ?? false;

export const getViewTypes = (dialog: viewTypeDerivable, includeInbox = true): InboxViewType[] => {
  const viewTypes: InboxViewType[] = [];
  if (isDraftDialog(dialog)) {
    viewTypes.push('drafts');
  }
  if (isArchivedDialog(dialog)) {
    viewTypes.push('archive');
  }
  if (isSentDialog(dialog)) {
    viewTypes.push('sent');
  }
  if (isBinDialog(dialog)) {
    viewTypes.push('bin');
  }

  if (includeInbox && !viewTypes.length) {
    viewTypes.push('inbox');
  }

  const priorityViewTypes = ['archive', 'bin', 'sent', 'drafts', 'inbox'];
  return viewTypes.sort((a, b) => {
    const indexA = priorityViewTypes.indexOf(a);
    const indexB = priorityViewTypes.indexOf(b);
    return indexA - indexB;
  });
};
