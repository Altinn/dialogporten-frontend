
export const partiesQuery = { 
    query: `
        query parties {
            parties {
            ...partyFields
                subParties {
                ...subPartyFields
                }
            }
        }
            
        fragment partyFields on AuthorizedParty {
            party
            hasOnlyAccessToSubParties
            partyType
            subParties {
                ...subPartyFields
                }
            isAccessManager
            isMainAdministrator
            name
            isCurrentEndUser
            isDeleted
        }
            
        fragment subPartyFields on AuthorizedSubParty {
            party
            partyType
            isAccessManager
            isMainAdministrator
            name
            isCurrentEndUser
            isDeleted
        }`,
    operationName: 'parties'
};

export const organizationsQuery = {
    operationName: 'organizations',
    query: `query organizations {\n  organizations {\n    ...OrganizationFields\n  }\n}\n\nfragment OrganizationFields on Organization {\n  id\n  name {\n    en\n    nb\n    nn\n  }\n  logo\n  orgnr\n  homepage\n  environments\n}`,
}

export const savedSearchesQuery = {
    operationName: 'savedSearches',
    query: `query savedSearches {\n  savedSearches {\n    ...SavedSearchesFields\n  }\n}\n\nfragment SavedSearchesFields on SavedSearches {\n  id\n  name\n  createdAt\n  updatedAt\n  data {\n    urn\n    searchString\n    fromView\n    filters {\n      id\n      value\n    }\n  }\n}`,
}

export const profileQuery = {
    operationName: 'profile',
    query: `query profile {\n  profile {\n    updatedAt\n    language\n    user {\n      userId\n      userUuid\n      userName\n      email\n      isReserved\n      party {\n        partyId\n        partyUuid\n        partyTypeName\n        orgNumber\n        ssn\n        unitType\n        name\n        isDeleted\n        onlyHierarchyElementWithNoAccess\n        person {\n          ssn\n          name\n          firstName\n          middleName\n          lastName\n          telephoneNumber\n          mobileNumber\n          mailingAddress\n          mailingPostalCode\n          mailingPostalCity\n          addressMunicipalNumber\n          addressMunicipalName\n          addressStreetName\n          addressHouseNumber\n          addressHouseLetter\n          addressPostalCode\n          addressCity\n          dateOfDeath\n        }\n      }\n    }\n  }\n}`,
}

export const getAllDialogsForCountQuery = {
    operationName: 'getAllDialogsForCount',
    query: `query getAllDialogsForCount($partyURIs: [String!], $search: String, $org: [String!], $status: [DialogStatus!], $label: [SystemLabel!], $createdAfter: DateTime, $createdBefore: DateTime, $updatedAfter: DateTime, $updatedBefore: DateTime) {\n  searchDialogs(\n    input: {party: $partyURIs, search: $search, org: $org, status: $status, orderBy: {createdAt: null, updatedAt: DESC, dueAt: null}, systemLabel: $label, createdAfter: $createdAfter, createdBefore: $createdBefore, updatedAfter: $updatedAfter, updatedBefore: $updatedBefore, excludeApiOnly: true}\n  ) {\n    items {\n      ...CountableDialogFields\n    }\n    hasNextPage\n  }\n}\n\nfragment CountableDialogFields on SearchDialog {\n  id\n  org\n  party\n  updatedAt\n  status\n  systemLabel\n  seenSinceLastUpdate {\n    isCurrentEndUser\n  }\n}`,
    variables: {partyURIs: []}
}

export const getAllDialogsForPartyQuery = {
    operationName: 'getAllDialogsForParties',
    query: `query getAllDialogsForParties($partyURIs: [String!], $search: String, $org: [String!], $status: [DialogStatus!], $continuationToken: String, $limit: Int, $label: [SystemLabel!], $createdAfter: DateTime, $createdBefore: DateTime, $updatedAfter: DateTime, $updatedBefore: DateTime) {\n  searchDialogs(\n    input: {party: $partyURIs, search: $search, org: $org, status: $status, continuationToken: $continuationToken, orderBy: {createdAt: null, updatedAt: DESC, dueAt: null}, systemLabel: $label, createdAfter: $createdAfter, createdBefore: $createdBefore, updatedAfter: $updatedAfter, updatedBefore: $updatedBefore, limit: $limit, excludeApiOnly: true}\n  ) {\n    items {\n      ...SearchDialogFields\n    }\n    hasNextPage\n    continuationToken\n  }\n}\n\nfragment SearchDialogFields on SearchDialog {\n  id\n  party\n  org\n  progress\n  guiAttachmentCount\n  status\n  createdAt\n  updatedAt\n  extendedStatus\n  seenSinceLastUpdate {\n    ...SeenLogFields\n  }\n  latestActivity {\n    transmissionId\n    description {\n      value\n      languageCode\n    }\n    performedBy {\n      actorType\n      actorId\n      actorName\n    }\n  }\n  content {\n    title {\n      ...DialogContentFields\n    }\n    summary {\n      ...DialogContentFields\n    }\n    senderName {\n      ...DialogContentFields\n    }\n    extendedStatus {\n      ...DialogContentFields\n    }\n  }\n  systemLabel\n}\n\nfragment SeenLogFields on SeenLog {\n  id\n  seenAt\n  seenBy {\n    actorType\n    actorId\n    actorName\n  }\n  isCurrentEndUser\n}\n\nfragment DialogContentFields on ContentValue {\n  mediaType\n  value {\n    value\n    languageCode\n  }\n}`,
    variables: {partyURIs: []},
    limit: 10
}

export const isAuthenticatedLabel = 'isAuthenticated';

export const queryLabels = [
    partiesQuery.operationName,
    organizationsQuery.operationName,
    savedSearchesQuery.operationName,
    profileQuery.operationName,
    getAllDialogsForCountQuery.operationName,
    getAllDialogsForPartyQuery.operationName,
    getAllDialogsForPartyQuery.operationName + ' BIN',
    getAllDialogsForPartyQuery.operationName + ' SENT',
    getAllDialogsForPartyQuery.operationName + ' DRAFT',
    getAllDialogsForPartyQuery.operationName + ' ARCHIVE',
    getAllDialogsForPartyQuery.operationName + ' nextPage',
    isAuthenticatedLabel
];