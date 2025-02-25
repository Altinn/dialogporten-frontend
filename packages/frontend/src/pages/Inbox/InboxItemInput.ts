import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import type { Participant } from '../../api/useDialogById.tsx';
import type { InboxViewType } from '../../api/useDialogs.tsx';

export interface InboxItemInput {
  id: string;
  party: string;
  title: string;
  summary: string;
  sender: Participant;
  receiver: Participant;
  createdAt: string;
  updatedAt: string;
  status: DialogStatus;
  isSeenByEndUser: boolean;
  label: SystemLabel;
  org?: string;
  guiAttachmentCount: number;
  seenByOthersCount: number;
  seenByLabel?: string;
  viewType: InboxViewType;
}
