import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { GraphQLError } from 'graphql';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.ts';

const DIALOG_ID_URN_PREFIX = 'urn:altinn:dialog-id:';

const dialogLookupQuery = `
  query DialogAccessCheck($instanceRef: String!) {
    dialogLookup(instanceRef: $instanceRef) {
      lookup {
        dialogId
      }
    }
  }
`;

interface DialogLookupResponse {
  data?: {
    dialogLookup?: {
      lookup?: { dialogId?: string | null } | null;
    } | null;
  } | null;
  errors?: { message?: string }[];
}

/**
 * Confirms the signed-in user is authorized to see the dialog
 */
export const assertDialogAccess = async (dialogId: string, context: Context): Promise<void> => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session for dialog access check');
    throw new GraphQLError('No valid session for this dialog', {
      extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
    });
  }

  let body: DialogLookupResponse;
  try {
    const response = await axios.post<DialogLookupResponse>(
      config.dialogporten.graphqlUrl,
      {
        query: dialogLookupQuery,
        variables: { instanceRef: DIALOG_ID_URN_PREFIX + dialogId },
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    body = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        { status: error.response?.status, data: error.response?.data, dialogId },
        'dialogLookup access check failed upstream',
      );
    } else {
      logger.error(error, 'dialogLookup access check failed upstream');
    }
    throw new GraphQLError('Dialog access check is unavailable', {
      extensions: { code: 'DIALOG_ACCESS_CHECK_UNAVAILABLE', http: { status: 503 } },
    });
  }

  if (body?.errors?.length) {
    logger.error({ errors: body.errors, dialogId }, 'dialogLookup access check returned GraphQL errors');
    throw new GraphQLError('Dialog access check is unavailable', {
      extensions: { code: 'DIALOG_ACCESS_CHECK_UNAVAILABLE', http: { status: 503 } },
    });
  }

  const lookedUpId = body?.data?.dialogLookup?.lookup?.dialogId;
  if (!lookedUpId || lookedUpId.toLowerCase() !== dialogId.toLowerCase()) {
    logger.warn({ dialogId }, 'dialogLookup returned no accessible dialog; denying access');
    throw new GraphQLError('Not authorized to access this dialog', {
      extensions: { code: 'FORBIDDEN', http: { status: 403 } },
    });
  }
};
