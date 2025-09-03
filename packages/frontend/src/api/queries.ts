import {
  type AddFavoritePartyMutation,
  type AddFavoritePartyToGroupMutation,
  type CreateSavedSearchMutation,
  type DeleteFavoritePartyMutation,
  type DeleteNotificationSettingMutation,
  type DeleteSavedSearchMutation,
  type GetAllDialogsForPartiesQuery,
  type GetSearchAutocompleteDialogsQuery,
  type NotificationSettingsInput,
  type NotificationsettingsByUuidQuery,
  type OrganizationsQuery,
  type SavedSearchInput,
  type SavedSearchesQuery,
  type SystemLabel,
  type UpdateLanguageMutation,
  type UpdateNotificationSettingMutation,
  type UpdateSavedSearchMutation,
  type UpdateSystemLabelMutation,
  getSdk,
} from 'bff-types-generated';
import { GraphQLClient } from 'graphql-request';

const endpoint = `${location.protocol}//${location.host}/api/graphql`;
export const graphQLSDK = getSdk(new GraphQLClient(endpoint, { credentials: 'include' }));
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
export const deleteFavoriteParty = (partyId: string): Promise<DeleteFavoritePartyMutation> =>
  graphQLSDK.DeleteFavoriteParty({ partyId });
export const createSavedSearch = (name: string, data: SavedSearchInput): Promise<CreateSavedSearchMutation> =>
  graphQLSDK.CreateSavedSearch({ name, data });
export const getNotificationsettingsByUuid = (uuid: string): Promise<NotificationsettingsByUuidQuery> =>
  graphQLSDK.notificationsettingsByUuid({ uuid });
export const updateNotificationsetting = (
  data: NotificationSettingsInput,
): Promise<UpdateNotificationSettingMutation> => graphQLSDK.UpdateNotificationSetting({ data });
export const deleteNotificationsetting = (partyUuid: string): Promise<DeleteNotificationSettingMutation> =>
  graphQLSDK.DeleteNotificationSetting({ partyUuid });
export const getNotificationAddressByOrgNumber = (orgnr: string): Promise<NotificationsettingsByUuidQuery> =>
  graphQLSDK.getNotificationAddressByOrgNumber({ orgnr });
export const updateSystemLabel = (
  dialogId: string,
  addLabels: SystemLabel | SystemLabel[],
  removeLabels: SystemLabel | SystemLabel[] = [],
): Promise<UpdateSystemLabelMutation> =>
  graphQLSDK.updateSystemLabel({
    dialogId,
    addLabels,
    removeLabels,
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
