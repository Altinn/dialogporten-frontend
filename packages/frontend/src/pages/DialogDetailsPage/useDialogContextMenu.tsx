import type { ContextMenuProps, MenuItemProps } from '@altinn/altinn-components';

interface UseDialogContextMenuProps {
  /* context menu id, mus tbe unique */
  id: string;
  /* dialog id to perform actions on */
  dialogId?: string;
  /* dialog actions to perform */
  dialogActions?: MenuItemProps[];
  /* override placement of the context menu */
  placement?: ContextMenuProps['placement'];
}

export const useDialogContextMenu = ({
  id,
  dialogId,
  dialogActions = [],
  placement = 'right',
}: UseDialogContextMenuProps): ContextMenuProps | undefined => {
  return {
    id,
    items: dialogId ? dialogActions : [],
    placement,
  };
};
