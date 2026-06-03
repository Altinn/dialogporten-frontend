import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

const makeDialog = (id: string, party: string, title: string): SearchDialogFieldsFragment => ({
  hasUnopenedContent: false,
  serviceResource: 'default',
  serviceResourceType: 'correspondenceservice',
  id,
  endUserContext: { systemLabels: [SystemLabel.Default] },
  party,
  org: 'digdir',
  progress: null,
  isContentSeen: true,
  fromServiceOwnerTransmissionsCount: 0,
  fromPartyTransmissionsCount: 0,
  contentUpdatedAt: '2024-01-15T11:34:00.000Z',
  guiAttachmentCount: 0,
  status: DialogStatus.RequiresAttention,
  createdAt: '2023-12-23T23:00:00.000Z',
  seenSinceLastContentUpdate: [],
  content: {
    title: {
      mediaType: 'text/plain',
      value: [{ value: title, languageCode: 'nb' }],
    },
    summary: {
      mediaType: 'text/plain',
      value: [{ value: title, languageCode: 'nb' }],
    },
    senderName: null,
    extendedStatus: null,
  },
});

export const dialogs: SearchDialogFieldsFragment[] = [
  makeDialog(
    '019241f7-5b00-7000-0000-000000000001',
    'urn:altinn:person:identifier-no:1',
    'Personlig melding i innboks',
  ),
  makeDialog(
    '019241f7-5b00-7000-0000-000000000002',
    'urn:altinn:organization:identifier-sub:1',
    'Underenhet melding i innboks',
  ),
];
