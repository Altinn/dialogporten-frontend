import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';

/**
 * One dialog per person in the all-persons portfolio. Selecting "Alle personer" sends every person
 * URN as a party filter, so all of these should appear together; selecting a single person should
 * narrow to just that person's dialog.
 */
const makePersonDialog = (id: string, party: string, title: string): SearchDialogFieldsFragment => ({
  hasUnopenedContent: false,
  serviceResource: 'default',
  serviceResourceType: 'correspondenceservice',
  id,
  endUserContext: {
    systemLabels: [SystemLabel.Default],
  },
  party,
  org: 'ok',
  progress: null,
  isContentSeen: false,
  fromServiceOwnerTransmissionsCount: 0,
  fromPartyTransmissionsCount: 0,
  contentUpdatedAt: '2024-03-10T09:00:00.000Z',
  guiAttachmentCount: 0,
  status: DialogStatus.RequiresAttention,
  createdAt: '2024-03-01T09:00:00.000Z',
  seenSinceLastContentUpdate: [],
  content: {
    title: {
      mediaType: 'text/plain',
      value: [{ value: title, languageCode: 'nb' }],
    },
    summary: {
      mediaType: 'text/plain',
      value: [{ value: `${title} – sammendrag`, languageCode: 'nb' }],
    },
    senderName: null,
    extendedStatus: null,
  },
});

export const dialogs: SearchDialogFieldsFragment[] = [
  makePersonDialog(
    '01923000-0000-0000-0000-000000000001',
    'urn:altinn:person:identifier-no:1',
    'Skattemelding for Test Testesen',
  ),
  makePersonDialog(
    '01923000-0000-0000-0000-000000000002',
    'urn:altinn:person:identifier-no:2',
    'Skattemelding for Kari Nordmann',
  ),
  makePersonDialog(
    '01923000-0000-0000-0000-000000000003',
    'urn:altinn:person:identifier-no:3',
    'Skattemelding for Ola Nordmann',
  ),
  makePersonDialog(
    '01923000-0000-0000-0000-000000000004',
    'urn:altinn:person:identifier-no:4',
    'Skattemelding for Per Hansen',
  ),
];
