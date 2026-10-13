import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { forwardingScenarios } from './forwarding.ts';

export const dialogs: SearchDialogFieldsFragment[] = Object.entries(forwardingScenarios).map(
  ([id, { title, summary, attachmentCount }], index) => {
    const updatedAt = new Date(Date.UTC(2024, 10, 30 - index, 10)).toISOString();
    return {
      hasUnopenedContent: false,
      serviceResource: 'default',
      serviceResourceType: 'correspondenceservice',
      seenSinceLastContentUpdate: [],
      id,
      endUserContext: {
        systemLabels: [SystemLabel.Default],
      },
      party: 'urn:altinn:person:identifier-no:1',
      org: 'digdir',
      progress: null,
      isContentSeen: true,
      fromServiceOwnerTransmissionsCount: 0,
      fromPartyTransmissionsCount: 0,
      contentUpdatedAt: updatedAt,
      guiAttachmentCount: attachmentCount,
      status: DialogStatus.RequiresAttention,
      createdAt: updatedAt,
      dueAt: null,
      content: {
        title: {
          mediaType: 'text/plain',
          value: [{ value: title, languageCode: 'nb' }],
        },
        summary: {
          mediaType: 'text/plain',
          value: [{ value: summary, languageCode: 'nb' }],
        },
        senderName: null,
        extendedStatus: null,
      },
    };
  },
);
