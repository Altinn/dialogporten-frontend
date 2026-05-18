import { DialogStatus, type SearchDialogFieldsFragment, SystemLabel } from 'bff-types-generated';
import { MOCK_SERVICE_JOURNEY_ID } from './services.ts';

const DIALOG_COUNT = 120;
const ORG_COUNT = 120;

const STATUSES = [
  DialogStatus.RequiresAttention,
  DialogStatus.Awaiting,
  DialogStatus.NotApplicable,
  DialogStatus.Completed,
  DialogStatus.Draft,
];

const pad = (n: number) => n.toString().padStart(3, '0');

const generateMockServiceJourneyDialogs = (): SearchDialogFieldsFragment[] =>
  Array.from({ length: DIALOG_COUNT }, (_, i) => {
    const num = i + 1;
    const orgIndex = (i % ORG_COUNT) + 1;
    const party = `urn:altinn:organization:identifier-no:sf-${orgIndex}`;
    const contentUpdatedAt = new Date(Date.UTC(2025, 0, 1) - i * 86400000).toISOString();
    const createdAt = new Date(Date.UTC(2024, 0, 1) - i * 86400000).toISOString();
    return {
      hasUnopenedContent: false,
      serviceResource: MOCK_SERVICE_JOURNEY_ID,
      serviceResourceType: 'correspondenceservice',
      id: `019241f7-sf00-7000-0000-${pad(num)}00000000`,
      endUserContext: { systemLabels: [SystemLabel.Default] },
      party,
      org: 'digdir',
      progress: null,
      isContentSeen: true,
      fromServiceOwnerTransmissionsCount: 0,
      fromPartyTransmissionsCount: 0,
      contentUpdatedAt,
      guiAttachmentCount: 0,
      status: STATUSES[i % STATUSES.length],
      createdAt,
      seenSinceLastContentUpdate: [],
      content: {
        title: {
          mediaType: 'text/plain',
          value: [
            { value: `Mock tjenestereise melding ${pad(num)}`, languageCode: 'nb' },
            { value: `Mock service journey message ${pad(num)}`, languageCode: 'en' },
          ],
        },
        summary: {
          mediaType: 'text/plain',
          value: [
            {
              value: `Dette er melding nr. ${num} for den mock-baserte tjenestereisen.`,
              languageCode: 'nb',
            },
          ],
        },
        senderName: null,
        extendedStatus: null,
      },
    };
  });

export const dialogs: SearchDialogFieldsFragment[] = generateMockServiceJourneyDialogs();
