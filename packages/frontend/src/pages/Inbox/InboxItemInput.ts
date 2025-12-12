import type { AvatarProps, SeenByLogProps } from '@altinn/altinn-components';
import type { DialogStatus, SeenLogFieldsFragment, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';

export interface InboxItemInput {
  id: string;
  party: string;
  title: string;
  summary: string;
  sender: AvatarProps;
  recipient: AvatarProps;
  createdAt: string;
  status: DialogStatus;
  extendedStatus?: string;
  hasUnopenedContent: boolean;
  contentUpdatedAt: string;
  label: SystemLabel[];
  org: string;
  guiAttachmentCount: number;
  seenByOthersCount: number;
  fromServiceOwnerTransmissionsCount: number;
  fromPartyTransmissionsCount: number;
  unread: boolean;
  seenByLabel?: string;
  viewType: InboxViewType;
  seenByLog: SeenByLogProps;
  dueAt?: string;
  seenSinceLastContentUpdate: SeenLogFieldsFragment[];
  serviceResource?: string;
  serviceResourceType?: string;
}
