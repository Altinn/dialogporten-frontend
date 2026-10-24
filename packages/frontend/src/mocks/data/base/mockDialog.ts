import {
  ActivityType,
  ActorType,
  type AttachmentFieldsFragment,
  AttachmentUrlConsumer,
  type DialogActivityFragment,
  type DialogByIdFieldsFragment,
  DialogStatus,
  type GuiActionFieldsFragment,
  GuiActionPriority,
  HttpVerb,
  type LabelAssignmentLogFieldsFragment,
  type NotificationLogsResponse,
  type SearchDialogFieldsFragment,
  SystemLabel,
  type TransmissionFieldsFragment,
} from 'bff-types-generated';
import { getMockedMarkdownFCEContent } from './helper.ts';

export type ForwardingMock = 'allowed' | 'notAllowed' | 'attachmentsExceedMaxLimit';

export type MockDialog = Omit<
  SearchDialogFieldsFragment,
  'guiAttachmentCount' | 'fromServiceOwnerTransmissionsCount' | 'fromPartyTransmissionsCount'
> & {
  attachments: AttachmentFieldsFragment[];
  activities: DialogActivityFragment[];
  transmissions: TransmissionFieldsFragment[];
  guiActions: GuiActionFieldsFragment[];
  additionalInfo: string;
  mainContentReference: DialogByIdFieldsFragment['content']['mainContentReference'];
  mainContentMarkdown?: string;
  notificationLogs: Omit<NotificationLogsResponse, 'dialogId'>[];
  labelAssignmentLog?: LabelAssignmentLogFieldsFragment[];
  forwarding: ForwardingMock;
};

export type MockDialogInput = Pick<MockDialog, 'id' | 'content'> & Partial<Omit<MockDialog, 'id' | 'content'>>;

export const mockAttachment = (dialogId: string, index = 0): AttachmentFieldsFragment => ({
  id: index === 0 ? dialogId : `${dialogId}-${index}`,
  expiresAt: new Date(Date.now() + 60_000 * 1000).toISOString(),
  displayName: [
    {
      value: index === 0 ? 'kvittering.pdf' : `vedlegg-${index + 1}.pdf`,
      languageCode: 'nb',
    },
  ],
  urls: [
    {
      id: index === 0 ? 'hello-attachment-id' : `hello-attachment-id-${index}`,
      url: 'https://info.altinn.no/om-altinn/',
      mediaType: 'application/pdf',
      consumerType: AttachmentUrlConsumer.Gui,
    },
  ],
});

export const mockNotificationLog = (
  notificationId: string,
  overrides: Partial<Omit<NotificationLogsResponse, 'dialogId'>>,
): Omit<NotificationLogsResponse, 'dialogId'> => ({
  notificationId,
  transmissionId: null,
  type: 'Notification',
  channel: 'Email',
  destination: 'kari.nordmann@example.com',
  status: 'Delivered',
  requestedSendTime: null,
  lastUpdateTime: null,
  ...overrides,
});

const digdir = {
  actorType: ActorType.ServiceOwner,
  actorId: 'digdir',
  actorName: 'Digitaliseringsdirektoratet',
};

const defaultActivities = (dialogId: string): DialogActivityFragment[] => [
  {
    id: `${dialogId}-activity-dialog-created`,
    performedBy: digdir,
    description: [],
    type: ActivityType.DialogCreated,
    createdAt: '2024-05-23T23:00:00.000Z',
    transmissionId: null,
  },
  {
    id: `${dialogId}-activity-information`,
    performedBy: digdir,
    description: [
      {
        value: 'Dialogen er tilgjengelig for deg.',
        languageCode: 'nb',
      },
    ],
    type: ActivityType.Information,
    createdAt: '2024-05-24T08:30:00.000Z',
    transmissionId: null,
  },
];

const defaultGuiActions = (dialogId: string): GuiActionFieldsFragment[] => [
  {
    id: dialogId,
    url: 'urn:dialogporten:unauthorized',
    isAuthorized: false,
    isDeleteDialogAction: false,
    action: 'submit',
    authorizationAttribute: null,
    priority: GuiActionPriority.Primary,
    httpMethod: HttpVerb.Get,
    title: [
      {
        languageCode: 'nb',
        value: 'Til skjema',
      },
    ],
    prompt: [],
  },
];

export const mockDialog = ({ id, content, ...overrides }: MockDialogInput): MockDialog => ({
  id,
  content,
  party: 'urn:altinn:person:identifier-no:1',
  org: 'ok',
  serviceResource: 'default',
  serviceResourceType: 'correspondenceservice',
  status: DialogStatus.RequiresAttention,
  progress: null,
  isContentSeen: true,
  hasUnopenedContent: false,
  createdAt: '2023-12-23T23:00:00.000Z',
  contentUpdatedAt: '2024-01-15T11:34:00.000Z',
  dueAt: null,
  seenSinceLastContentUpdate: [],
  endUserContext: { systemLabels: [SystemLabel.Default] },
  attachments: [mockAttachment(id)],
  activities: defaultActivities(id),
  transmissions: [],
  guiActions: defaultGuiActions(id),
  additionalInfo: 'Denne setningen inneholder tilleggsinformasjon for dialogen.',
  mainContentReference: getMockedMarkdownFCEContent(),
  notificationLogs: [],
  forwarding: 'allowed',
  ...overrides,
});
