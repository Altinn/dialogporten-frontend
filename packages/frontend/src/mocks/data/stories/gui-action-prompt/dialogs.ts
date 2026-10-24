import { DialogStatus, GuiActionPriority, HttpVerb, SystemLabel } from 'bff-types-generated';
import { type MockDialog, mockDialog } from '../../base/mockDialog.ts';

export const dialogs: MockDialog[] = [
  mockDialog({
    hasUnopenedContent: false,
    serviceResource: 'default',
    serviceResourceType: 'correspondenceservice',
    seenSinceLastContentUpdate: [],
    id: '019241f7-8218-7756-be82-promptaction',
    endUserContext: {
      systemLabels: [SystemLabel.Default],
    },
    party: 'urn:altinn:person:identifier-no:1',
    org: 'nav',
    progress: null,
    isContentSeen: true,
    contentUpdatedAt: '2024-11-27T15:36:52.131Z',
    status: DialogStatus.RequiresAttention,
    createdAt: '2024-05-23T23:00:00.000Z',
    dueAt: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Dialog med bekreftelsesdialog',
            languageCode: 'nb',
          },
        ],
      },
      summary: {
        mediaType: 'text/plain',
        value: [
          {
            value: 'Handlingen krever at brukeren bekrefter.',
            languageCode: 'nb',
          },
        ],
      },
      senderName: null,
      extendedStatus: null,
    },
    guiActions: [
      {
        id: 'confirm-with-prompt',
        url: 'https://dialogporten-serviceprovider.net/mutate/state-1/3',
        isAuthorized: true,
        isDeleteDialogAction: false,
        action: 'submit',
        authorizationAttribute: null,
        priority: GuiActionPriority.Primary,
        httpMethod: HttpVerb.Post,
        title: [
          {
            languageCode: 'nb',
            value: 'Send inn',
          },
        ],
        prompt: [
          {
            languageCode: 'nb',
            value: 'Er du sikker på at du vil sende inn?',
          },
        ],
      },
    ],
  }),
];
