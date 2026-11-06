import { CorrespondenceForwardingConstraint } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { getAttachmentForwarding } from './attachmentForwarding.ts';

describe('getAttachmentForwarding', () => {
  it('offers the attachments and includes them while the box is ticked', () => {
    expect(
      getAttachmentForwarding({
        forwardingConstraint: CorrespondenceForwardingConstraint.None,
        attachmentCount: 2,
        includeAttachments: true,
      }),
    ).toEqual({ showIncludeAttachments: true, includeAttachments: true });
  });

  it('leaves the attachments out when the user unticks the box', () => {
    expect(
      getAttachmentForwarding({
        forwardingConstraint: CorrespondenceForwardingConstraint.None,
        attachmentCount: 2,
        includeAttachments: false,
      }),
    ).toEqual({ showIncludeAttachments: true, includeAttachments: false });
  });

  it('neither offers nor asks for attachments when the message has none', () => {
    expect(
      getAttachmentForwarding({
        forwardingConstraint: CorrespondenceForwardingConstraint.None,
        attachmentCount: 0,
        includeAttachments: true,
      }),
    ).toEqual({ showIncludeAttachments: false, includeAttachments: false });
  });

  it.each([
    [
      CorrespondenceForwardingConstraint.AttachmentsExceedMaxLimit,
      'dialog.forward.attachments_not_included.attachments_exceed_max_limit',
    ],
    [
      CorrespondenceForwardingConstraint.NotAccessToAllAttachments,
      'dialog.forward.attachments_not_included.not_access_to_all_attachments',
    ],
    [
      CorrespondenceForwardingConstraint.ExpiringAttachments,
      'dialog.forward.attachments_not_included.expiring_attachments',
    ],
    [CorrespondenceForwardingConstraint.Unknown, 'dialog.forward.attachments_not_included.unknown'],
  ])('hides the choice, leaves the attachments out and explains why for %s', (forwardingConstraint, messageKey) => {
    expect(getAttachmentForwarding({ forwardingConstraint, attachmentCount: 2, includeAttachments: true })).toEqual({
      showIncludeAttachments: false,
      includeAttachments: false,
      constraintMessageKey: messageKey,
    });
  });
});
