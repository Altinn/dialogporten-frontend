import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { Context, SessionStorageToken } from '../../auth/oidc.js';
import config from '../../config.ts';
import { decryptPersonIdentifier } from '../../party/personUrnCipher.ts';
import { getLanguageFromAltinnContext, languageCodes } from '../types/cookie.ts';
import type { Altinn2MessageData, Altinn2MessagesResponse } from '../types/index.ts';

export const getAltinn2messages = async (
  context: Context,
  selectedAccountIdentifier?: string | null,
  isSelfIdentified = false,
): Promise<Altinn2MessageData[]> => {
  const { altinn2ApiKey, altinn2BaseURL } = config;
  if (!altinn2BaseURL || !altinn2ApiKey) {
    logger.error('Altinn 2 base URL or API key is not set');
    return [];
  }

  const storedLocale = context.session.get('locale');
  const storedLanguageCode = languageCodes[storedLocale as string] || languageCodes.nb;
  const languageCode =
    getLanguageFromAltinnContext(context.request.raw.cookies?.altinnPersistentContext) || storedLanguageCode;

  if (!selectedAccountIdentifier && !isSelfIdentified) {
    logger.warn('No selectedAccountIdentifier provided for Altinn 2 API call');
    return [];
  }

  try {
    const token =
      typeof context.session.get('token') === 'object' ? (context.session.get('token') as SessionStorageToken) : null;

    if (!token?.access_token) {
      throw new Error('Unable to authenticate with Altinn 2 API - no valid token with required scope');
    }

    const accountIdentifier = selectedAccountIdentifier
      ? decryptPersonIdentifier(selectedAccountIdentifier)
      : selectedAccountIdentifier;
    const isCurrentEndUser = isSelfIdentified || accountIdentifier === context.session.get('pid');
    const segment = isCurrentEndUser ? 'my' : encodeURIComponent(accountIdentifier!);
    const a2MessageAPIUrl = new URL(`/api/${segment}/messages`, altinn2BaseURL);
    a2MessageAPIUrl.searchParams.set('language', languageCode);

    const response = await axios.get<Altinn2MessagesResponse>(a2MessageAPIUrl.toString(), {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/hal+json',
        ApiKey: altinn2ApiKey,
      },
    });
    const messages = response.data._embedded?.messages || [];
    const a2ActiveSchemas = messages.filter((message) => {
      const isActiveElement = !message?.ArchiveReference;
      const isSchema = message?.Type === 'FormTask';

      return isSchema && isActiveElement;
    });
    return a2ActiveSchemas ?? [];
  } catch (error) {
    logger.error(error, 'Error fetching altinn2messages:');
    return [];
  }
};
