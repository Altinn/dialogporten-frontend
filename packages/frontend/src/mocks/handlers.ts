import { graphql, http, HttpResponse } from 'msw';
import { naiveSearchFilter } from './filters.ts';
import {
  SavedSearchesFieldsFragment,
  DialogByIdFieldsFragment,
  Profile,
  SearchAutocompleteDialogFieldsFragment, SearchDialogFieldsFragment, PartyFieldsFragment, OrganizationFieldsFragment,
} from 'bff-types-generated';
import {convertToDialogByIdTemplate, filterDialogs} from './data/base/helper.ts';
import { getMockedData } from './data.ts';

const data = await getMockedData(window.location.href);
export type InMemoryStore = {
  savedSearches?: SavedSearchesFieldsFragment[];
  profile?: Profile;
  dialogs?: SearchDialogFieldsFragment[] | null;
  parties?: PartyFieldsFragment[];
  organizations?: OrganizationFieldsFragment[];
};

let inMemoryStore: InMemoryStore = {
  savedSearches: data.savedSearches,
  profile: data.profile,
  dialogs: data.dialogs,
  parties: data.parties,
  organizations: data.organizations,
};
 
const isAuthenticatedMock = http.get('/api/isAuthenticated', () => {
  return HttpResponse.json({ authenticated: true });
});

export const streamMock = http.get('/api/graphql/stream', async () => {
  const stream = new ReadableStream({
    start( {
      /* Create a readable stream that sends events if needed for testing in the future and remember to close stream controller */
    }) {
  }});

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});


const getAllDialogsforCountMock = graphql.query('getAllDialogsForCount', ({ variables }) => {
  const items = filterDialogs({
    inMemoryStore,
    partyURIs: variables.partyURIs,
    search: variables.search,
    org: variables.org,
    label: variables.systemLabel,
    status: variables.status,
  });

  return HttpResponse.json({
    data: {
      searchDialogs: {
        items: items?.map((item) => ({
          id: item.id,
          org: item.org,
          party: item.party,
          updatedAt: item.updatedAt,
          status: item.status,
          endUserContext: {
            systemLabels: item.endUserContext?.systemLabels ?? [],
          },
          seenSinceLastUpdate: item.seenSinceLastUpdate,
        })) ?? null,
      },
    },
  });
});

const getAllDialogsForPartiesMock = graphql.query('getAllDialogsForParties', ({ variables }) => {
  const items = filterDialogs({
    inMemoryStore,
    partyURIs: variables.partyURIs,
    search: variables.search,
    org: variables.org,
    label: variables.label,
    status: variables.status,
    updatedAfter: variables.updatedAfter,
    updatedBefore: variables.updatedBefore,
  });

  return HttpResponse.json({
    data: {
      searchDialogs: {
        items: items ?? null,
      },
    },
  });
});


const getDialogByIdMock = graphql.query('getDialogById', (options) => {
  const {
    variables: { id },
  } = options;
  const dialog = inMemoryStore.dialogs?.find((dialog) => dialog.id === id) ?? null;

  if (dialog && !dialog.seenSinceLastUpdate.find(d => d.isCurrentEndUser)) {
    const party = inMemoryStore.parties?.find((party) => party.isCurrentEndUser) ?? null;
    dialog.seenSinceLastUpdate = [
      {
        id: 'c4f4d846-2fe7-4172-badc-abc48f9af8a5',
        seenAt: new Date().toISOString(),
        seenBy: {
          actorType: null,
          actorId: party?.party,
          actorName: party?.name,
        },
        isCurrentEndUser: true,
      },
    ];
    inMemoryStore.dialogs = dialog 
      ? inMemoryStore.dialogs?.map((d) => (d.id === id ? dialog : d))
      : inMemoryStore.dialogs;
  }

  const dialogDetails: DialogByIdFieldsFragment | null = dialog 
    ? convertToDialogByIdTemplate(dialog) as DialogByIdFieldsFragment 
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

## Grunnleggende konsepter fra markdown

1. **Overskrifter**: Bruk \`#\` for å lage overskrifter. Antall \`#\` indikerer nivået på overskriften (f.eks. \`##\` for nivå 2).
2. **Lister**: For punktlister, bruk \`-\`, \`+\` eller \`*\`. For nummererte lister, bruk tall etterfulgt av punktum (f.eks. \`1.\`).
3. **Lenker**: Lag lenker med \`[link-tekst](url)\`. For eksempel: \`[CommonMark](https://commonmark.org)\`.
4. **Fet tekst**: Bruk \`**\` eller \`__\` for å lage fet tekst. F.eks. \`**dette er viktig**\`.
5. **Kodeblokker**: Bruk tre backticks (\`\`\`) for å lage kodeblokker eller enkel backtick for inline kode (f.eks. \`\` \`kode\` \`\`).
`);
});

const getContentMarkdownMock = http.get('https://dialogporten-serviceprovider.net/fce-markdown-transmission', ({request}) => {
  const url = new URL(request.url)
  const productId = url.searchParams.get('id')
  return HttpResponse.text(`# Info i markdown for transmission (id=${productId})`);
});

const getMainContentHtmlMock = http.get('https://dialogporten-serviceprovider.net/fce-html', () => {
  return HttpResponse.text(`<html><body><h1>Tittel i arvet HTML</h1><p>Brødtekst!</p></body></html>`);
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
      CreateSavedSearch: savedSearch,
    },
  });
});

const mutateUpdateSystemLabelMock = graphql.mutation('updateSystemLabel', (req) => {
  const { dialogId, labels } = req.variables;

  /* Note: When other system labels that NOT are mutually exclusive will be introduced by Dialogporten, this handler needs to return existing labels as well, but make sure only one system label is included */
  inMemoryStore.dialogs = inMemoryStore.dialogs?.map((dialog) => {
    if (dialog.id === dialogId) {
      dialog.endUserContext = {
        systemLabels: [labels]
      }
    }
    return dialog;
  });

  return HttpResponse.json({
    data: {
      setSystemLabel: { success: true }
    },
  });
});

const searchAutocompleteDialogsMock = graphql.query('getSearchAutocompleteDialogs', (req) => {
  const {
    variables: { partyURIs, search },
  } = req;
  const itemsForParty = inMemoryStore.dialogs?.filter((dialog) => partyURIs.includes(dialog.party));
  const filteredItems = itemsForParty?.filter((item) => naiveSearchFilter(item, search));
  const autoCompleteItems: SearchAutocompleteDialogFieldsFragment[] = filteredItems?.map(item => ({
    id: item.id,
    seenSinceLastUpdate: item.seenSinceLastUpdate,
    content: {
      __typename: "SearchContent",
      title: {
        __typename: "ContentValue",
        mediaType: item.content.title.mediaType,
        value: item.content.title.value.map(val => ({
          __typename: "Localization",
          value: val.value,
          languageCode: val.languageCode
        }))
      },
      summary: item.content.summary
    }
  })) ?? [];

  return HttpResponse.json({
    data: {
      searchDialogs: {
        items: autoCompleteItems,
      },
    },
  });
})

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
  mutateUpdateSystemLabelMock,
  deleteSavedSearchMock,
  getOrganizationsMock,
  searchAutocompleteDialogsMock,
  getContentMarkdownMock,
  getAllDialogsForPartiesMock,
  getAllDialogsforCountMock,
  streamMock,
  mutateUpdateLanguageMock
];
