import { DialogStatus, type EndUserContext, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../api/hooks/useDialogs.tsx';
import { PageRoutes } from '../pages/routes.ts';

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

export const getViewTypes = (dialog: viewTypeDerivable): InboxViewType[] => {
  const viewTypes: InboxViewType[] = [];

  /* Can either be archived, bin or in inbox (neither) - these are mutually exclusive */
  if (isArchivedDialog(dialog)) {
    viewTypes.push('archive');
  }

  if (isBinDialog(dialog)) {
    viewTypes.push('bin');
  }

  if (!viewTypes.length) {
    viewTypes.push('inbox');
  }

  /* Can also be in draft or sent -- not mutually exclusive */

  if (isDraftDialog(dialog)) {
    viewTypes.push('drafts');
  }

  if (isSentDialog(dialog)) {
    viewTypes.push('sent');
  }

  const priorityViewTypes = ['archive', 'bin', 'sent', 'drafts', 'inbox'];
  return viewTypes.sort((a, b) => {
    const indexA = priorityViewTypes.indexOf(a);
    const indexB = priorityViewTypes.indexOf(b);
    return indexA - indexB;
  });
};

interface LocationState {
  fromView?: string;
}

export function getNavigationOrigin(state: LocationState | null): string {
  return Object.values(PageRoutes).includes(state?.fromView as PageRoutes)
    ? (state!.fromView as PageRoutes)
    : PageRoutes.inbox;
}
