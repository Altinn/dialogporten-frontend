import { formatDisplayName } from '@altinn/altinn-components';
import {
  type DialogByIdFieldsFragment,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  type Profile,
  type SavedSearchesFieldsFragment,
  type SearchDialogFieldsFragment,
  type ServiceResource,
  SystemLabel,
} from 'bff-types-generated';
import { http, HttpResponse, graphql } from 'msw';
import { getMockedData } from './data.ts';
import { convertToDialogByIdTemplate, filterDialogs } from './data/base/helper.ts';

const data = await getMockedData(window.location.href);
export type InMemoryStore = {
  savedSearches?: SavedSearchesFieldsFragment[];
  profile?: Profile;
  dialogs?: SearchDialogFieldsFragment[] | null;
  parties?: PartyFieldsFragment[];
  organizations?: OrganizationFieldsFragment[];
  features?: Record<string, boolean>;
  services?: ServiceResource[];
};

const inMemoryStore: InMemoryStore = {
  savedSearches: data.savedSearches,
  profile: data.profile,
  dialogs: data.dialogs,
  parties: data.parties,
  organizations: data.organizations,
  features: data.features,
  services: data.services,
};

const isAuthenticatedMock = http.get('/api/isAuthenticated', () => {
  return HttpResponse.json({ authenticated: true });
});

const featuresMock = http.get('/api/features', () => {
  return HttpResponse.json(data.features);
});

const alertBannerMock = http.get('/api/alert-banner', () => {
  return HttpResponse.json({
    nb: {
      title: 'Ustabilitet',
      description: 'Vi opplever noe ustabilitet og jobber på saken.',
      link: {
        text: 'Du kan fortsatt bruke den gamle innboksen.',
      },
    },
    nn: {
      title: 'Teknisk feil',
      description:
        'Pga ein teknisk feil blir ein del historiske meldingar viste med feil dato i den nye innboksen. Vi jobbar med å rette dette. Inntil vidare kan den gamle innboksen nyttast.',
    },
    en: {
      title: 'Test Technical Error',
      description:
        'Due to a technical issue, some historical messages are displayed with incorrect dates in the new inbox. We are working to fix this. In the meantime, the old inbox can be used.',
    },
  });
});

export const streamMock = http.get('/api/graphql/stream', async () => {
  const stream = new ReadableStream({
    //ts-ignore
    start() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});

const mockAltinn2Messages = graphql.query('altinn2messages', () => {
  return HttpResponse.json({
    data: {
      altinn2messages: [],
    },
  });
});

const mockNotificationsettingsForCurrentUser = graphql.query('notificationsettingsForCurrentUser', () => {
  return HttpResponse.json({
    data: {
      notificationsettingsForCurrentUser: [],
    },
  });
});

const getAllDialogsforCountMock = graphql.query('getAllDialogsForCount', ({ variables }) => {
  const items = filterDialogs({
    inMemoryStore,
    partyURIs: variables.partyURIs,
    serviceResources: variables.serviceResources,
    search: variables.search,
    org: variables.org,
    label: variables.systemLabel,
    status: variables.status,
  });

  const sortedItems = items
    ?.slice()
    .sort((a, b) => new Date(b.contentUpdatedAt).getTime() - new Date(a.contentUpdatedAt).getTime());

  return HttpResponse.json({
    data: {
      searchDialogs: {
        items:
          sortedItems?.map((item) => ({
            id: item.id,
            org: item.org,
            party: item.party,
            contentUpdatedAt: item.contentUpdatedAt,
            status: item.status,
            endUserContext: {
              systemLabels: item.endUserContext?.systemLabels ?? [],
            },
            seenSinceLastContentUpdate: item.seenSinceLastContentUpdate,
          })) ?? null,
      },
    },
  });
});

const getAllDialogsForPartiesMock = graphql.query('getAllDialogsForParties', ({ variables }) => {
  const items = filterDialogs({
    inMemoryStore,
    partyURIs: variables.partyURIs,
    serviceResources: variables.serviceResources,
    search: variables.search,
    org: variables.org,
    label: variables.label,
    status: variables.status,
    updatedAfter: variables.updatedAfter,
    updatedBefore: variables.updatedBefore,
    isContentSeen: variables.isContentSeen,
  });

  const sortedItems = items
    ?.slice()
    .sort((a, b) => new Date(b.contentUpdatedAt).getTime() - new Date(a.contentUpdatedAt).getTime());

  const limit = typeof variables.limit === 'number' && variables.limit > 0 ? variables.limit : 100;
  const offset = (() => {
    const token = variables.continuationToken;
    if (typeof token !== 'string' || token.length === 0) return 0;
    const parsed = Number.parseInt(token, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  })();

  const pagedItems = sortedItems ? sortedItems.slice(offset, offset + limit) : null;
  const hasNextPage = sortedItems ? offset + limit < sortedItems.length : false;
  const continuationToken = hasNextPage ? String(offset + limit) : null;

  return HttpResponse.json({
    data: {
      searchDialogs: {
        items: pagedItems,
        hasNextPage,
        continuationToken,
      },
    },
  });
});

const getDialogByIdMock = graphql.query('getDialogById', (options) => {
  const {
    variables: { id },
  } = options;
  const dialog = inMemoryStore.dialogs?.find((d) => d.id === id);
  if (dialog?.endUserContext?.systemLabels?.includes(SystemLabel.MarkedAsUnopened)) {
    dialog.endUserContext = {
      ...dialog.endUserContext,
      systemLabels: dialog.endUserContext.systemLabels.filter((l) => l !== SystemLabel.MarkedAsUnopened),
    };
    dialog.isContentSeen = true;
  }
  if (dialog && !dialog.seenSinceLastContentUpdate.some((d) => d.isCurrentEndUser)) {
    const party = inMemoryStore.parties?.find((p) => p.isCurrentEndUser);

    dialog.seenSinceLastContentUpdate = [
      {
        id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
        seenAt: new Date().toISOString(),
        seenBy: {
          actorType: null,
          actorId: party?.party,
          actorName: formatDisplayName({
            fullName: party?.name ?? '',
            type: 'person',
            reverseNameOrder: true,
          }),
        },
        isCurrentEndUser: true,
      },
    ];
  }

  const dialogDetails: DialogByIdFieldsFragment | null = dialog
    ? (convertToDialogByIdTemplate(dialog) as DialogByIdFieldsFragment)
    : null;

  return HttpResponse.json({
    data: {
      dialogById: {
        dialog: dialogDetails,
      },
    },
  });
});

const getMainContentMarkdownMock = http.get('https://dialogporten-serviceprovider.net/fce-markdown', () => {
  return HttpResponse.text(`# Info i markdown

Dette er HTML som er generert fra markdown.

| Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph   | Text        |

## Grunnleggende konsepter fra markdown

1. **Overskrifter**: Bruk \`#\` for å lage overskrifter. Antall \`#\` indikerer nivået på overskriften (f.eks. \`##\` for nivå 2).
2. **Lister**: For punktlister, bruk \`-\`, \`+\` eller \`*\`. For nummererte lister, bruk tall etterfulgt av punktum (f.eks. \`1.\`).
3. **Lenker**: Lag lenker med \`[link-tekst](url)\`. For eksempel: \`[CommonMark](https://commonmark.org)\`.
4. **Fet tekst**: Bruk \`**\` eller \`__\` for å lage fet tekst. F.eks. \`**dette er viktig**\`.
5. **Kodeblokker**: Bruk tre backticks (\`\`\`) for å lage kodeblokker eller enkel backtick for inline kode (f.eks. \`\` \`kode\` \`\`).
`);
});

const getContentMarkdownMock = http.get(
  'https://dialogporten-serviceprovider.net/fce-markdown-transmission',
  ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    return HttpResponse.text(`# Info i markdown for transmission (id=${id})`);
  },
);

const getMainContentHtmlMock = http.get('https://dialogporten-serviceprovider.net/fce-html', ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  return HttpResponse.text(`<html><body><h1>Tittel i arvet HTML</h1><p>Brødtekst! ${id}</p></body></html>`);
});

const getAllPartiesMock = graphql.query('parties', () => {
  return HttpResponse.json({
    data: {
      parties: inMemoryStore.parties,
    },
  });
});

export const getSavedSearchesMock = graphql.query('savedSearches', () => {
  return HttpResponse.json({
    data: {
      savedSearches: inMemoryStore.savedSearches,
    },
  });
});

export const getOrganizationsMock = graphql.query('organizations', () => {
  return HttpResponse.json({
    data: {
      organizations: inMemoryStore.organizations,
    },
  });
});

export const deleteSavedSearchMock = graphql.mutation('DeleteSavedSearch', (req) => {
  const { id } = req.variables;
  inMemoryStore.savedSearches = inMemoryStore.savedSearches?.filter((savedSearch) => savedSearch.id !== id);
  return HttpResponse.json({
    data: {
      savedSearches: inMemoryStore.savedSearches,
    },
  });
});

const getProfileMock = graphql.query('profile', async () => {
  return HttpResponse.json({
    data: {
      profile: inMemoryStore.profile,
    },
  });
});

const mutateUpdateSavedSearchMock = graphql.mutation('UpdateSavedSearch', (req) => {
  const { id, name } = req.variables;
  inMemoryStore.savedSearches = inMemoryStore.savedSearches?.map((savedSearch) =>
    savedSearch.id === id ? { ...savedSearch, name, updatedAt: new Date().toISOString() } : savedSearch,
  );
  return HttpResponse.json({
    data: {
      updateSavedSearch: { success: true, message: 'Saved search updated successfully' },
    },
  });
});

const mutateSavedSearchMock = graphql.mutation('CreateSavedSearch', (req) => {
  const { name, data } = req.variables;
  const savedSearch: SavedSearchesFieldsFragment = {
    id: (inMemoryStore.savedSearches?.length ?? 0) + 1,
    name,
    data,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  inMemoryStore.savedSearches?.push(savedSearch);
  return HttpResponse.json({
    data: {
      createSavedSearch: savedSearch,
    },
  });
});

const mutateUpdateSystemLabelMock = graphql.mutation('updateSystemLabel', (req) => {
  const { dialogId, addLabels, removeLabels } = req.variables;
  /* Updated to handle non-mutually exclusive labels while ensuring only one exclusive system label is present */
  inMemoryStore.dialogs = inMemoryStore.dialogs?.map((dialog) => {
    if (dialog.id === dialogId) {
      const existingLabels = dialog.endUserContext?.systemLabels || [];
      const EXCLUSIVE_LABELS = [SystemLabel.Archive, SystemLabel.Bin, SystemLabel.Default];

      let updatedLabels = existingLabels.filter(
        (label) => !Array.isArray(removeLabels) || !removeLabels.includes(label),
      );

      const labelsToAdd = [addLabels].flat();

      const exclusiveLabelsToAdd = labelsToAdd.filter((label) => EXCLUSIVE_LABELS.includes(label));
      const nonExclusiveLabelsToAdd = labelsToAdd.filter((label) => !EXCLUSIVE_LABELS.includes(label));

      if (exclusiveLabelsToAdd.length > 0) {
        updatedLabels = updatedLabels.filter((label) => !EXCLUSIVE_LABELS.includes(label));
        updatedLabels.push(exclusiveLabelsToAdd[exclusiveLabelsToAdd.length - 1]);
      }

      for (const label of nonExclusiveLabelsToAdd) {
        if (!updatedLabels.includes(label)) {
          updatedLabels.push(label);
        }
      }

      dialog.endUserContext = {
        systemLabels: updatedLabels,
      };

      if (labelsToAdd.includes(SystemLabel.MarkedAsUnopened)) {
        dialog.isContentSeen = false;
      }
    }
    return dialog;
  });

  return HttpResponse.json({
    data: {
      setSystemLabel: { success: true },
    },
  });
});

const mutateBulkUpdateSystemLabelMock = graphql.mutation('bulkUpdateSystemLabels', (req) => {
  const { dialogs, addLabels, removeLabels } = req.variables;
  const EXCLUSIVE_LABELS = [SystemLabel.Archive, SystemLabel.Bin, SystemLabel.Default];
  const dialogIds = (dialogs as { dialogId: string }[]).map((d) => d.dialogId);

  inMemoryStore.dialogs = inMemoryStore.dialogs?.map((dialog) => {
    if (!dialogIds.includes(dialog.id)) return dialog;

    const existingLabels = dialog.endUserContext?.systemLabels || [];
    let updatedLabels = existingLabels.filter((label) => !Array.isArray(removeLabels) || !removeLabels.includes(label));

    const labelsToAdd = [addLabels].flat();
    const exclusiveLabelsToAdd = labelsToAdd.filter((label) => EXCLUSIVE_LABELS.includes(label));
    const nonExclusiveLabelsToAdd = labelsToAdd.filter((label) => !EXCLUSIVE_LABELS.includes(label));

    if (exclusiveLabelsToAdd.length > 0) {
      updatedLabels = updatedLabels.filter((label) => !EXCLUSIVE_LABELS.includes(label));
      updatedLabels.push(exclusiveLabelsToAdd[exclusiveLabelsToAdd.length - 1]);
    }

    for (const label of nonExclusiveLabelsToAdd) {
      if (!updatedLabels.includes(label)) {
        updatedLabels.push(label);
      }
    }

    dialog.endUserContext = { systemLabels: updatedLabels };

    if (labelsToAdd.includes(SystemLabel.MarkedAsUnopened)) {
      dialog.isContentSeen = false;
    }

    return dialog;
  });

  return HttpResponse.json({
    data: {
      bulkSetSystemLabels: { success: true },
    },
  });
});

const mutateUpdateLanguageMock = graphql.mutation('UpdateLanguage', (req) => {
  const { language } = req.variables;

  inMemoryStore.profile = {
    ...inMemoryStore.profile,
    language,
  };

  return HttpResponse.json({
    data: {
      profile: inMemoryStore.profile,
    },
  });
});

const mutateUpdateProfileSettingPreferenceMock = graphql.mutation('setShouldShowSubEntities', (req) => {
  const { shouldShowDeletedEntities } = req.variables;

  if (inMemoryStore.profile?.user?.profileSettingPreference) {
    inMemoryStore.profile.user.profileSettingPreference.shouldShowDeletedEntities = shouldShowDeletedEntities;
  }

  return HttpResponse.json({
    data: {
      updateProfileSettingPreference: {
        success: true,
        message: 'Profile setting updated successfully',
      },
    },
  });
});

const mutateAddFavoritePartyMock = graphql.mutation('AddFavoriteParty', (req) => {
  const { partyId } = req.variables;
  if (!inMemoryStore.profile) {
    return HttpResponse.json({
      data: { addFavoriteParty: { success: false, message: 'Profile not found' } },
    });
  }

  if (!inMemoryStore.profile.groups) {
    inMemoryStore.profile.groups = [];
  }

  let favoritesGroup = inMemoryStore.profile.groups.find((group) => group?.isFavorite);
  if (!favoritesGroup) {
    favoritesGroup = {
      isFavorite: true,
      parties: [],
    };
    inMemoryStore.profile.groups.push(favoritesGroup);
  }

  if (!favoritesGroup.parties?.includes(partyId)) {
    favoritesGroup.parties = [...(favoritesGroup.parties || []), partyId];
  }

  return HttpResponse.json({
    data: {
      addFavoriteParty: {
        success: true,
        message: 'Party added to favorites',
      },
    },
  });
});

const mutateDeleteFavoritePartyMock = graphql.mutation('DeleteFavoriteParty', (req) => {
  const { partyId } = req.variables;

  if (!inMemoryStore.profile?.groups) {
    return HttpResponse.json({
      data: { deleteFavoriteParty: { success: false, message: 'No favorites found' } },
    });
  }

  const favoritesGroup = inMemoryStore.profile.groups.find((group) => group?.isFavorite);
  if (favoritesGroup?.parties) {
    favoritesGroup.parties = favoritesGroup.parties.filter((id) => id !== partyId);
  }

  return HttpResponse.json({
    data: {
      deleteFavoriteParty: {
        success: true,
        message: 'Party removed from favorites',
      },
    },
  });
});

const getServiceResourcesMock = graphql.query('getServiceResources', () => {
  return HttpResponse.json({
    data: {
      serviceResources: inMemoryStore.services,
    },
  });
});

const getFilterServiceResourcesMock = graphql.query('getFilterServiceResources', () => {
  return HttpResponse.json({
    data: {
      serviceResources: inMemoryStore.services,
    },
  });
});

const dialogAccessInfoMock = graphql.query('dialogAccessInfo', ({ variables }) => {
  const { instanceRef } = variables as { instanceRef: string };
  const dialogId = instanceRef?.replace('urn:altinn:dialog-id:', '');
  const dialog = inMemoryStore.dialogs?.find((d) => d.id === dialogId);

  if (!dialog) {
    return HttpResponse.json({
      data: {
        dialogLookup: {
          lookup: null,
          errors: [{ __typename: 'DialogLookupNotFound', message: 'Dialog not found' }],
        },
      },
    });
  }

  const service = inMemoryStore.services?.find((s) => s.id === dialog.serviceResource);
  const organization = inMemoryStore.organizations?.find((o) => o.id === dialog.org);

  return HttpResponse.json({
    data: {
      dialogLookup: {
        lookup: {
          instanceRef,
          dialogId: dialog.id,
          serviceResource: {
            id: dialog.serviceResource,
            name: service?.title
              ? [
                  { value: service.title, languageCode: 'nb' },
                  { value: service.title, languageCode: 'en' },
                ]
              : [{ value: dialog.serviceResource, languageCode: 'nb' }],
          },
          serviceOwner: {
            code: dialog.org,
            orgNumber: '974761076',
            name: organization?.name
              ? [
                  { value: organization.name.nb ?? dialog.org, languageCode: 'nb' },
                  { value: organization.name.en ?? organization.name.nb ?? dialog.org, languageCode: 'en' },
                ]
              : [{ value: dialog.org, languageCode: 'nb' }],
          },
          authorizationEvidence: {
            viaAccessPackage: true,
            viaResourceDelegation: true,
            viaInstanceDelegation: false,
            viaRole: true,
            evidence: [
              { grantType: 'ACCESS_PACKAGE', subject: 'urn:altinn:accesspackage:skattegrunnlag', name: [] },
              { grantType: 'ROLE', subject: 'urn:altinn:rolecode:DAGL', name: [] },
              { grantType: 'ROLE', subject: 'urn:altinn:rolecode:STYL', name: [] },
              { grantType: 'RESOURCE_DELEGATION', subject: dialog.serviceResource, name: [] },
            ],
          },
        },
        errors: [],
      },
    },
  });
});

export const handlers = [
  isAuthenticatedMock,
  getAllDialogsForPartiesMock,
  getAllPartiesMock,
  getDialogByIdMock,
  getMainContentMarkdownMock,
  getMainContentHtmlMock,
  getSavedSearchesMock,
  getProfileMock,
  mutateSavedSearchMock,
  mutateUpdateSavedSearchMock,
  mutateUpdateSystemLabelMock,
  mutateBulkUpdateSystemLabelMock,
  deleteSavedSearchMock,
  getOrganizationsMock,
  getContentMarkdownMock,
  getAllDialogsForPartiesMock,
  getAllDialogsforCountMock,
  streamMock,
  mutateUpdateLanguageMock,
  mutateUpdateProfileSettingPreferenceMock,
  mutateAddFavoritePartyMock,
  mutateDeleteFavoritePartyMock,
  getServiceResourcesMock,
  getFilterServiceResourcesMock,
  dialogAccessInfoMock,
  mockAltinn2Messages,
  mockNotificationsettingsForCurrentUser,
  featuresMock,
  alertBannerMock,
];
