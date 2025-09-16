/**
 * Analytics event name constants for Application Insights tracking
 *
 * Event naming convention: [Category].[Action].[Status]
 * - Category: The main area/component (GUI, Dialog, User, SavedSearch)
 * - Action: The specific action being performed (Click, Move, Language, etc.)
 * - Status: The outcome (Success, Failed) - no "Attempt" events
 */

// GUI Action Events
export const ANALYTICS_EVENTS = {
  // GUI Actions
  GUI_ACTION_CLICK: 'GUI.Action.Click',
  GUI_ACTION_CANCELLED: 'GUI.Action.Cancelled',
  GUI_ACTION_SUCCESS: 'GUI.Action.Success',
  GUI_ACTION_FAILED: 'GUI.Action.Failed',

  // Dialog Transmissions
  DIALOG_TRANSMISSIONS_EXPAND: 'Dialog.Transmissions.Expand',
  DIALOG_TRANSMISSIONS_COLLAPSE: 'Dialog.Transmissions.Collapse',

  // User Actions
  USER_LOGOUT: 'User.Logout',
  USER_LANGUAGE_CHANGE_SUCCESS: 'User.Language.ChangeSuccess',
  USER_LANGUAGE_CHANGE_FAILED: 'User.Language.ChangeFailed',

  // Dialog Move Actions
  DIALOG_MOVE_TO_INBOX_SUCCESS: 'Dialog.Move.ToInbox.Success',
  DIALOG_MOVE_TO_INBOX_FAILED: 'Dialog.Move.ToInbox.Failed',
  DIALOG_MOVE_TO_ARCHIVE_SUCCESS: 'Dialog.Move.ToArchive.Success',
  DIALOG_MOVE_TO_ARCHIVE_FAILED: 'Dialog.Move.ToArchive.Failed',
  DIALOG_MOVE_TO_BIN_SUCCESS: 'Dialog.Move.ToBin.Success',
  DIALOG_MOVE_TO_BIN_FAILED: 'Dialog.Move.ToBin.Failed',

  // Saved Search Actions
  SAVED_SEARCH_CREATE_SUCCESS: 'SavedSearch.Create.Success',
  SAVED_SEARCH_CREATE_FAILED: 'SavedSearch.Create.Failed',
  SAVED_SEARCH_DELETE_SUCCESS: 'SavedSearch.Delete.Success',
  SAVED_SEARCH_DELETE_FAILED: 'SavedSearch.Delete.Failed',
  SAVED_SEARCH_UPDATE_SUCCESS: 'SavedSearch.Update.Success',
  SAVED_SEARCH_UPDATE_FAILED: 'SavedSearch.Update.Failed',
} as const;

// Type for event names (for TypeScript safety)
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Helper function to get the appropriate dialog move event based on target label and outcome
 * @param toLabel - The SystemLabel the dialog is being moved to
 * @param success - Whether the move operation was successful
 * @returns The appropriate analytics event name
 */
export const getDialogMoveEvent = (toLabel: string, success: boolean): AnalyticsEventName => {
  if (success) {
    switch (toLabel) {
      case 'Default':
        return ANALYTICS_EVENTS.DIALOG_MOVE_TO_INBOX_SUCCESS;
      case 'Archive':
        return ANALYTICS_EVENTS.DIALOG_MOVE_TO_ARCHIVE_SUCCESS;
      case 'Bin':
        return ANALYTICS_EVENTS.DIALOG_MOVE_TO_BIN_SUCCESS;
      default:
        return ANALYTICS_EVENTS.DIALOG_MOVE_TO_INBOX_SUCCESS; // fallback
    }
  }

  switch (toLabel) {
    case 'Default':
      return ANALYTICS_EVENTS.DIALOG_MOVE_TO_INBOX_FAILED;
    case 'Archive':
      return ANALYTICS_EVENTS.DIALOG_MOVE_TO_ARCHIVE_FAILED;
    case 'Bin':
      return ANALYTICS_EVENTS.DIALOG_MOVE_TO_BIN_FAILED;
    default:
      return ANALYTICS_EVENTS.DIALOG_MOVE_TO_INBOX_FAILED; // fallback
  }
};
