import {
  type AddFavoritePartyMutation,
  type AddFavoritePartyToGroupMutation,
  type CreateSavedSearchMutation,
  type DeleteFavoritePartyMutation,
  type DeleteSavedSearchMutation,
  type GetAllDialogsForPartiesQuery,
  type GetSearchAutocompleteDialogsQuery,
  type OrganizationsQuery,
  type SavedSearchInput,
  type SavedSearchesQuery,
  type SystemLabel,
  type UpdateLanguageMutation,
  type UpdateSavedSearchMutation,
  type UpdateSystemLabelMutation,
  getSdk,
} from 'bff-types-generated';
import { GraphQLClient } from 'graphql-request';

export const graphQLSDK = getSdk(new GraphQLClient('/api/graphql', { credentials: 'include' }));
export const profile = graphQLSDK.profile;
export const fetchSavedSearches = (): Promise<SavedSearchesQuery> => graphQLSDK.savedSearches();
export const fetchOrganizations = (): Promise<OrganizationsQuery> => graphQLSDK.organizations();
export const deleteSavedSearch = (id: number): Promise<DeleteSavedSearchMutation> =>
  graphQLSDK.DeleteSavedSearch({ id });
export const updateSavedSearch = (id: number, name: string): Promise<UpdateSavedSearchMutation> =>
  graphQLSDK.UpdateSavedSearch({ id, name });
export const addFavoriteParty = (partyId: string): Promise<AddFavoritePartyMutation> =>
  graphQLSDK.AddFavoriteParty({ partyId });
export const addFavoritePartyToGroup = (partyId: string, groupName: string): Promise<AddFavoritePartyToGroupMutation> =>
  graphQLSDK.AddFavoritePartyToGroup({ partyId, groupName });
export const deleteFavoriteParty = (partyId: string, groupId: string): Promise<DeleteFavoritePartyMutation> =>
  graphQLSDK.DeleteFavoriteParty({ partyId, groupId });
export const createSavedSearch = (name: string, data: SavedSearchInput): Promise<CreateSavedSearchMutation> =>
  graphQLSDK.CreateSavedSearch({ name, data });
export const updateSystemLabel = (dialogId: string, label: SystemLabel): Promise<UpdateSystemLabelMutation> =>
  graphQLSDK.updateSystemLabel({
    dialogId,
    label,
  });
export const searchDialogs = (
  partyURIs: string[],
  search: string | undefined,
  org: string | undefined,
): Promise<GetAllDialogsForPartiesQuery> => {
  return graphQLSDK.getAllDialogsForParties({
    partyURIs,
    search: search?.length === 0 ? undefined : search,
    org: org?.length === 0 ? undefined : org,
  });
};

export const searchAutocompleteDialogs = (
  partyURIs: string[],
  search: string | undefined,
): Promise<GetSearchAutocompleteDialogsQuery> => {
  return graphQLSDK.getSearchAutocompleteDialogs({
    partyURIs,
    search,
  });
};

export const updateLanguage = (language: string): Promise<UpdateLanguageMutation> =>
  graphQLSDK.UpdateLanguage({ language });
