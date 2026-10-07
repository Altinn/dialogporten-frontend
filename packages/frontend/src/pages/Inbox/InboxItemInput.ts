import type { AvatarProps, SeenByLogProps } from '@altinn/altinn-components';
import type { DialogStatus, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';

export interface InboxItemInput {
  id: string;
  party: string;
  title: string;
  summary: string;
  sender: AvatarProps;
  serviceOwnerName?: string;
  senderName?: string;
  recipient: AvatarProps;
  status: DialogStatus;
  extendedStatus?: string;
  /* Has unread items (i.e. transimssions), could still be unread: false on top-level */
  unreadItems?: boolean;
  contentUpdatedAt: string;
  label: SystemLabel[];
  guiAttachmentCount: number;
  fromServiceOwnerTransmissionsCount: number;
  fromPartyTransmissionsCount: number;
  unread: boolean;
  seenByLabel?: string;
  // Pre-calculated view type that takes precedence (determines which folder it belongs to)
  viewType: InboxViewType;
  viewTypes: InboxViewType[];
  seenByLog: SeenByLogProps;
  dueAt?: string | null;
  serviceResource?: string;
}
