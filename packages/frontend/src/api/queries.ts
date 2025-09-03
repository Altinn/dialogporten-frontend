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
import { GraphQLClient, type RequestMiddleware, type ResponseMiddleware } from 'graphql-request';
import { Analytics } from '../analytics';

const requestMiddleware: RequestMiddleware = (request) => {
  try {
    if (!Analytics.isEnabled) {
      return request;
    }

    // Extract operation name from the request
    const operationName = request.operationName || 'UnknownOperation';
    const startTime = Date.now();

    // Store tracking data in request headers
    if (!request.headers) {
      request.headers = {};
    }

    // Add tracking headers
    (request.headers as Record<string, string>)['x-graphql-operation'] = operationName;
    (request.headers as Record<string, string>)['x-graphql-start-time'] = startTime.toString();

    // Log request initiation in debug mode
    console.debug(`GraphQL request initiated: ${operationName}`);
  } catch (err) {
    console.error('GraphQL request middleware error:', err);
  }

  return request;
};

const responseMiddleware: ResponseMiddleware = (response) => {
  try {
    if (!Analytics.isEnabled) {
      return;
    }

    // Handle both successful responses and errors
    if (response instanceof Error) {
      // This is an error case - track as a failed network request
      console.warn('GraphQL network error detected:', response.message);
      Analytics.trackDependency({
        id: `graphql-error-${Date.now()}`,
        target: '/api/graphql',
        name: 'NetworkError',
        data: response.message,
        duration: 0,
        success: false,
        responseCode: 500,
      });
      return;
    }

    // Extract tracking data from response headers
    const operationName = response.headers?.get?.('x-graphql-operation') || 'UnknownOperation';
    const startTimeStr = response.headers?.get?.('x-graphql-start-time');

    if (!startTimeStr) {
      console.warn('GraphQL response missing tracking headers - tracking may be incomplete');
      return;
    }

    const startTime = Number.parseInt(startTimeStr, 10);
    const duration = Date.now() - startTime;
    const success = !response.errors || response.errors.length === 0;

    // Use the actual HTTP status from the response, or determine based on errors
    let responseCode = response.status || 200;
    if (!success && response.errors) {
      // Check if it's a network error or GraphQL error based on error messages
      const hasNetworkError = response.errors.some(
        (error) =>
          error.message?.toLowerCase().includes('network') ||
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('failed to fetch'),
      );
      responseCode = hasNetworkError ? 500 : 400;

      // Log GraphQL errors for debugging
      console.debug(`GraphQL operation ${operationName} completed with errors:`, response.errors);
    }

    // Track the GraphQL operation as a dependency
    Analytics.trackDependency({
      id: `graphql-${operationName}-${startTime}`,
      target: '/api/graphql',
      name: operationName,
      duration: duration,
      success: success,
      responseCode: responseCode,
    });
  } catch (err) {
    console.error('GraphQL response middleware error:', err);
  }
};

const endpoint = `${location.protocol}//${location.host}/api/graphql`;
export const graphQLSDK = getSdk(
  new GraphQLClient(endpoint, {
    credentials: 'include',
    requestMiddleware: requestMiddleware,
    responseMiddleware: responseMiddleware,
  }),
);

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
