import type { DialogByIdDetails } from '../../api/hooks/useDialogById.tsx';

const INERT_ACTION_URL = '#';

export const makeActionsInert = (dialog: DialogByIdDetails): DialogByIdDetails => ({
  ...dialog,
  guiActions: dialog.guiActions.map((action) =>
    action.httpMethod === 'GET' || action.disabled
      ? action
      : { ...action, url: INERT_ACTION_URL, httpMethod: 'GET', prompt: undefined },
  ),
});
