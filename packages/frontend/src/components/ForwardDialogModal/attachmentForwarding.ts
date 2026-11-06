import { CorrespondenceForwardingConstraint } from 'bff-types-generated';

interface AttachmentForwardingInput {
  forwardingConstraint: CorrespondenceForwardingConstraint;
  attachmentCount: number;
  includeAttachments: boolean;
}

interface AttachmentForwarding {
  showIncludeAttachments: boolean;
  includeAttachments: boolean;
  constraintMessageKey?: string;
}

const constraintMessageKeys: Record<CorrespondenceForwardingConstraint, string | undefined> = {
  [CorrespondenceForwardingConstraint.None]: undefined,
  [CorrespondenceForwardingConstraint.AttachmentsExceedMaxLimit]:
    'dialog.forward.attachments_not_included.attachments_exceed_max_limit',
  [CorrespondenceForwardingConstraint.NotAccessToAllAttachments]:
    'dialog.forward.attachments_not_included.not_access_to_all_attachments',
  [CorrespondenceForwardingConstraint.ExpiringAttachments]:
    'dialog.forward.attachments_not_included.expiring_attachments',
  [CorrespondenceForwardingConstraint.Unknown]: 'dialog.forward.attachments_not_included.unknown',
};

export const getAttachmentForwarding = ({
  forwardingConstraint,
  attachmentCount,
  includeAttachments,
}: AttachmentForwardingInput): AttachmentForwarding => {
  const constraintMessageKey = constraintMessageKeys[forwardingConstraint];
  if (constraintMessageKey) {
    return { showIncludeAttachments: false, includeAttachments: false, constraintMessageKey };
  }
  const hasAttachments = attachmentCount > 0;
  return { showIncludeAttachments: hasAttachments, includeAttachments: hasAttachments && includeAttachments };
};
