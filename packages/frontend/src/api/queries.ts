import {
  type AddFavoritePartyMutation,
  type AddFavoritePartyToGroupMutation,
  type Altinn2messagesQuery,
  type CreateSavedSearchMutation,
  type DeleteFavoritePartyMutation,
  type DeleteNotificationSettingMutation,
  type DeleteSavedSearchMutation,
  type GetAllDialogsForPartiesQuery,
  type GetSearchAutocompleteDialogsQuery,
  type NotificationSettingsInput,
  type NotificationsettingsForCurrentUserQuery,
  type OrganizationsQuery,
  type SavedSearchInput,
  type SavedSearchesQuery,
  type SystemLabel,
  type UpdateLanguageMutation,
  type UpdateNotificationSettingMutation,
  type UpdateProfileSettingPreferenceMutation,
  type UpdateSavedSearchMutation,
  type UpdateSystemLabelMutation,
  getSdk,
} from 'bff-types-generated';
import { ClientError, GraphQLClient, type RequestMiddleware, type ResponseMiddleware } from 'graphql-request';
import i18n from 'i18next';
import { Analytics } from '../analytics';
import { logError } from '../utils/errorLogger';

const requestMiddleware: RequestMiddleware = (request) => {
  try {
    if (!Analytics.isEnabled) {
      return request;
    }

    // Extract operation name from the request
    const operationName = request.operationName || 'UnknownOperation';
    const startTime = Date.now();

    // Store tracking data in request headers
    const headers = new Headers(request.headers);
    headers.set('x-graphql-operation', operationName);
    headers.set('x-graphql-start-time', startTime.toString());
    request.headers = headers;
  } catch (err) {
    logError(
      err as Error,
      {
        context: 'queries.requestMiddleware',
        url: request.url,
        method: request.method,
        hasHeaders: !!request.headers,
      },
      'Error in GraphQL request middleware',
    );
  }

  return request;
};

const responseMiddleware: ResponseMiddleware = (response) => {
  try {
    if (!Analytics.isEnabled) {
      return;
    }

    if (response instanceof ClientError) {
      // Extract detailed information from GraphQL errors
      const graphqlErrors = response.response.errors || [];
      const errorDetails = graphqlErrors.map((error) => ({
        message: error.message,
        path: error.path,
        locations: error.locations,
        extensions: error.extensions,
      }));

      const primaryError = graphqlErrors[0];
      const errorMessage = primaryError
        ? `GraphQL Error: ${primaryError.message}${primaryError.path ? ` at path: ${primaryError.path.join('.')}` : ''}`
        : 'GraphQL ClientError';

      const error: Error = response as Error;
      error.name = 'GraphQLClientError';
      error.message = errorMessage;

      if (errorMessage.includes('Request failed with status code 401')) {
        return;
      }

      logError(
        error,
        {
          context: 'queries.responseMiddleware.ClientError',
          query: response.request.query,
          variables: response.request.variables,
          status: response.response.status,
          errorCount: graphqlErrors.length,
          errors: errorDetails,
          primaryErrorPath: primaryError?.path,
          primaryErrorExtensions: primaryError?.extensions,
        },
        errorMessage,
      );
      return;
    }

    if (response instanceof Error) {
      // This is a general error case (network, parsing, etc.)
      const errorMessage = `GraphQL Network/Parse Error: ${response.message}`;

      logError(
        response,
        {
          context: 'queries.responseMiddleware.Error',
          errorType: response.constructor.name,
          errorStack: response.stack,
        },
        errorMessage,
      );
      return;
    }

    // Extract tracking data from response headers
    const operationName = response.headers?.get?.('x-graphql-operation') || 'UnknownOperation';
    const startTimeStr = response.headers?.get?.('x-graphql-start-time');
    const backendTraceId = response.headers?.get?.('x-trace-id') || undefined;
    if (!startTimeStr) {
      console.warn('GraphQL response missing tracking headers - tracking may be incomplete');
      return;
    }

    const startTime = Number.parseInt(startTimeStr, 10);
    const duration = Date.now() - startTime;

    // Track the GraphQL operation as a dependency
    Analytics.trackDependency({
      id: backendTraceId || `graphql-${operationName}-${startTime}`,
      target: '/api/graphql',
      name: operationName,
      duration: duration,
      success: true,
      startTime: new Date(startTime),
      responseCode: response.status,
      properties: {
        'backend.traceId': backendTraceId,
        'correlation.source': 'backend-response',
        'request.type': 'graphql',
        'timing.corrected': 'true', // Flag to indicate proper timing
      },
      type: 'HTTP',
    });
  } catch (err) {
    // response is likely an Error or not a response object
    logError(
      err as Error,
      {
        context: 'queries.responseMiddleware.generalError',
        responseType: typeof response,
        responseConstructor: response?.constructor?.name,
        errorType: (err as Error)?.constructor?.name,
      },
      'Unexpected error in GraphQL response middleware',
    );
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
export const fetchAltinn2Messages = (selectedAccountIdentifier: string): Promise<Altinn2messagesQuery> =>
  graphQLSDK.altinn2messages({ selectedAccountIdentifier });
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
export const getNotificationsettingsForCurrentUser = (): Promise<NotificationsettingsForCurrentUserQuery> =>
  graphQLSDK.notificationsettingsForCurrentUser();
export const updateNotificationsetting = (
  data: NotificationSettingsInput,
): Promise<UpdateNotificationSettingMutation> => graphQLSDK.UpdateNotificationSetting({ data });
export const deleteNotificationsetting = (partyUuid: string): Promise<DeleteNotificationSettingMutation> =>
  graphQLSDK.DeleteNotificationSetting({ partyUuid });
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
  enableSearchLanguageCode: boolean,
): Promise<GetSearchAutocompleteDialogsQuery> => {
  return graphQLSDK.getSearchAutocompleteDialogs({
    partyURIs,
    search,
    limit: 6,
    ...(enableSearchLanguageCode && {
      searchLanguageCode: i18n.language,
    }),
    searchLanguageCode: i18n.language,
  });
};

export const updateLanguage = (language: string): Promise<UpdateLanguageMutation> =>
  graphQLSDK.UpdateLanguage({ language });

export const updateProfileSettingPreference = (
  shouldShowDeletedEntities: boolean,
): Promise<UpdateProfileSettingPreferenceMutation> =>
  graphQLSDK.UpdateProfileSettingPreference({ shouldShowDeletedEntities });
