import {
  ActorType,
  AttachmentUrlConsumer,
  type DialogByIdFieldsFragment,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { naiveSearchFilter } from '../../filters';
import type { InMemoryStore } from '../../handlers.ts';
import type { MockDialog } from './mockDialog.ts';

export const MAX_PARTY_URIS = 100;
export const MAX_SERVICE_RESOURCES = 20;
export const MAX_SERVICE_OWNERS = 20;

export const filterDialogs = ({
  inMemoryStore,
  partyURIs,
  serviceResources,
  search,
  org,
  label,
  status,
  updatedAfter,
  updatedBefore,
  isContentSeen,
}: {
  inMemoryStore: InMemoryStore;
  partyURIs: string[];
  serviceResources?: string[];
  search?: string;
  org?: string | string[];
  label?: string;
  status?: string | string[];
  updatedBefore?: string;
  updatedAfter?: string;
  isContentSeen?: boolean | null;
}) => {
  if (!inMemoryStore.dialogs) return null;

  const partyURIList = partyURIs ?? [];
  const serviceResourceList = serviceResources ?? [];
  const orgList = Array.isArray(org) ? org : org ? [org] : [];

  if (partyURIList.length > MAX_PARTY_URIS) return null;
  if (serviceResourceList.length > MAX_SERVICE_RESOURCES) return null;
  if (orgList.length > MAX_SERVICE_OWNERS) return null;
  if (partyURIList.length === 0 && serviceResourceList.length === 0) return null;

  if (partyURIList.length > 0) {
    const allowedPartyIds = inMemoryStore.parties?.flatMap((party: PartyFieldsFragment) => [
      party.party,
      ...(party.subParties ?? []).map((subParty) => subParty.party),
    ]);
    const allPartiesEligible = partyURIList.every((partyURI) => allowedPartyIds?.includes(partyURI));
    if (!allPartiesEligible) return null;
  }

  const normalizeArray = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value : value ? [value] : [];

  const labels = normalizeArray(label);
  const statuses = normalizeArray(status);

  return inMemoryStore.dialogs.filter((dialog) => {
    const matchesParty = partyURIList.length === 0 || partyURIList.includes(dialog.party);
    const matchesServiceResource =
      serviceResourceList.length === 0 || serviceResourceList.includes(dialog.serviceResource);

    const matchesTimeRange =
      (!updatedBefore || dialog.contentUpdatedAt < updatedBefore) &&
      (!updatedAfter || dialog.contentUpdatedAt > updatedAfter);

    const matchesOrg = !orgList.length || orgList.includes(dialog.org);

    const matchesLabels =
      !labels.length || dialog.endUserContext?.systemLabels?.some((dialogLabel) => labels.includes(dialogLabel));
    const matchesStatus = !statuses.length || statuses.includes(dialog.status);
    const matchesSearch = naiveSearchFilter(dialog, search);
    const hasMarkedAsUnopened = dialog.endUserContext?.systemLabels?.includes(SystemLabel.MarkedAsUnopened) ?? false;
    const effectiveIsContentSeen = hasMarkedAsUnopened ? false : dialog.isContentSeen;
    const matchesIsContentSeen =
      isContentSeen === undefined || isContentSeen === null || effectiveIsContentSeen === isContentSeen;

    return (
      matchesParty &&
      matchesServiceResource &&
      matchesTimeRange &&
      matchesOrg &&
      matchesLabels &&
      matchesStatus &&
      matchesSearch &&
      matchesIsContentSeen
    );
  });
};

export const getMockedMarkdownFCEContent = () => ({
  mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
  value: [
    {
      value: 'https://dialogporten-serviceprovider.net/fce-markdown',
      languageCode: 'nb',
    },
  ],
});

export const getMockedLocalizedMarkdownFCEContent = (transmissionId?: string) => {
  const idParam = transmissionId ? `&id=${transmissionId}` : '';

  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
    value: ['nb', 'nn', 'en'].map((languageCode) => ({
      value: `https://dialogporten-serviceprovider.net/fce-markdown-localized?lang=${languageCode}${idParam}`,
      languageCode,
    })),
  };
};

export const getMockedFCEContent = (transmissionId: string) => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
    value: [
      {
        value: `https://dialogporten-serviceprovider.net/fce-markdown-transmission?id=t${transmissionId}`,
        languageCode: 'nb',
      },
    ],
  };
};

export const getMockedHTMLFCEContent = (transmissionId?: string) => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
    value: [
      {
        value: `https://dialogporten-serviceprovider.net/fce-html?id=t${transmissionId}`,
        languageCode: 'nb',
      },
    ],
  };
};

export const getMockedUnauthorizedFCEContent = () => {
  return {
    mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
    value: [
      {
        value: 'urn:dialogporten:unauthorized',
        languageCode: 'nb',
      },
    ],
  };
};

export const STORY_MARKDOWN_URL = 'https://dialogporten-serviceprovider.net/fce-markdown-story';

const countGuiAttachments = (attachments: MockDialog['attachments']) =>
  attachments.filter((attachment) => attachment.urls.some((url) => url.consumerType === AttachmentUrlConsumer.Gui))
    .length;

const countTransmissions = (transmissions: MockDialog['transmissions']) => ({
  fromServiceOwnerTransmissionsCount: transmissions.filter(
    (transmission) => transmission.sender.actorType === ActorType.ServiceOwner,
  ).length,
  fromPartyTransmissionsCount: transmissions.filter(
    (transmission) => transmission.sender.actorType !== ActorType.ServiceOwner,
  ).length,
});

export const toSearchDialog = (dialog: MockDialog): SearchDialogFieldsFragment => ({
  id: dialog.id,
  party: dialog.party,
  org: dialog.org,
  progress: dialog.progress,
  status: dialog.status,
  createdAt: dialog.createdAt,
  dueAt: dialog.dueAt,
  contentUpdatedAt: dialog.contentUpdatedAt,
  isContentSeen: dialog.isContentSeen,
  serviceResourceType: dialog.serviceResourceType,
  serviceResource: dialog.serviceResource,
  hasUnopenedContent: dialog.hasUnopenedContent,
  seenSinceLastContentUpdate: dialog.seenSinceLastContentUpdate,
  endUserContext: dialog.endUserContext,
  content: dialog.content,
  guiAttachmentCount: countGuiAttachments(dialog.attachments),
  ...countTransmissions(dialog.transmissions),
});

export const toDialogById = (dialog: MockDialog): DialogByIdFieldsFragment => ({
  id: dialog.id,
  serviceResourceType: dialog.serviceResourceType,
  dialogToken: 'MOCKED_DIALOG_TOKEN',
  party: dialog.party,
  org: dialog.org,
  progress: dialog.progress,
  endUserContext: dialog.endUserContext,
  attachments: dialog.attachments,
  activities: dialog.activities,
  transmissions: dialog.transmissions,
  ...countTransmissions(dialog.transmissions),
  guiActions: dialog.guiActions,
  seenSinceLastContentUpdate: dialog.seenSinceLastContentUpdate,
  status: dialog.status,
  createdAt: dialog.createdAt,
  dueAt: dialog.dueAt,
  contentUpdatedAt: dialog.contentUpdatedAt,
  isContentSeen: dialog.endUserContext?.systemLabels?.includes(SystemLabel.MarkedAsUnopened)
    ? false
    : (dialog.isContentSeen ?? true),
  content: {
    title: dialog.content.title,
    summary: dialog.content.summary,
    senderName: dialog.content.senderName,
    additionalInfo: {
      mediaType: 'text/plain',
      value: [
        {
          value: dialog.additionalInfo,
          languageCode: 'nb',
        },
      ],
    },
    extendedStatus: dialog.content.extendedStatus,
    mainContentReference: dialog.mainContentMarkdown
      ? {
          mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
          value: [{ value: `${STORY_MARKDOWN_URL}?id=${dialog.id}`, languageCode: 'nb' }],
        }
      : dialog.mainContentReference,
  },
});
