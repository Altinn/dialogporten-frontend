import { logger } from '@altinn/dialogporten-node-logger';
import axios, { isAxiosError } from 'axios';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.ts';

export interface CorrespondenceForwardingCheckResult {
  allowed: boolean;
  forwardUrl: string | null;
}

interface ForwardingCheckResponse {
  allowForwarding?: unknown;
}

const correspondenceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notAllowed: CorrespondenceForwardingCheckResult = { allowed: false, forwardUrl: null };

export const isValidCorrespondenceId = (value: string): boolean => correspondenceIdPattern.test(value);

export const checkCorrespondenceForwarding = async (
  correspondenceId: string,
  context: Context,
): Promise<CorrespondenceForwardingCheckResult> => {
  const token = getSessionToken(context);
  if (!token?.access_token || !isValidCorrespondenceId(correspondenceId)) {
    return notAllowed;
  }

  const correspondenceUrl = `${config.platformBaseURL}/correspondence/api/v1/correspondence/${correspondenceId}`;

  try {
    const { data } = await axios.get<ForwardingCheckResponse>(`${correspondenceUrl}/forward/check`, {
      timeout: 30000,
      maxRedirects: 0,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/json',
      },
    });
    return data?.allowForwarding === true ? { allowed: true, forwardUrl: `${correspondenceUrl}/forward` } : notAllowed;
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status === 401 || status === 403) {
      logger.warn(
        { status, correspondenceId },
        'Correspondence forwarding check rejected the session token; it may lack altinn:correspondence.forward.check',
      );
    }
    return notAllowed;
  }
};
