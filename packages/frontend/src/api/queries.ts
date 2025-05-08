import {
  type AddFavoriteActorMutation,
  type AddFavoriteActorToGroupMutation,
  type CreateSavedSearchMutation,
  type DeleteFavoriteActorMutation,
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
export const addFavoriteActor = (actorId: string): Promise<AddFavoriteActorMutation> =>
  graphQLSDK.AddFavoriteActor({ actorId });
export const addFavoriteActorToGroup = (actorId: string, groupName: string): Promise<AddFavoriteActorToGroupMutation> =>
  graphQLSDK.AddFavoriteActorToGroup({ actorId, groupName });
export const deleteFavoriteActor = (actorId: string, groupId: string): Promise<DeleteFavoriteActorMutation> =>
  graphQLSDK.DeleteFavoriteActor({ actorId, groupId });
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
