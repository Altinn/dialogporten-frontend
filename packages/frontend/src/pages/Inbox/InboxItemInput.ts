import type { AvatarProps } from '@altinn/altinn-components';
import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';

export interface InboxItemInput {
  id: string;
  party: string;
  title: string;
  summary: string;
  sender: AvatarProps;
  receiver: AvatarProps;
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
