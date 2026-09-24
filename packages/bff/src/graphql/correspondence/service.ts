import { logger } from '@altinn/dialogporten-node-logger';
import axios, { isAxiosError } from 'axios';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.ts';

export interface CorrespondenceForwardingCheckResult {
  allowed: boolean;
}

export interface ForwardCorrespondenceArgs {
  correspondenceId: string;
  dialogToken: string;
  forwardTo: string;
  forwardingText?: string | null;
}

export interface ForwardCorrespondenceResult {
  success: boolean;
  status: number | null;
  errorCode: number | null;
}

interface ForwardingCheckResponse {
  allowForwarding?: unknown;
}

const correspondenceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notAllowed: CorrespondenceForwardingCheckResult = { allowed: false };

export const isValidCorrespondenceId = (value: string): boolean => correspondenceIdPattern.test(value);

const getCorrespondenceUrl = (correspondenceId: string) =>
  `${config.platformBaseURL}/correspondence/api/v1/correspondence/${correspondenceId}`;

const readErrorCode = (data: unknown): number | null => {
  const errorCode = Number((data as { errorCode?: unknown } | undefined)?.errorCode);
  return Number.isInteger(errorCode) ? errorCode : null;
};

export const checkCorrespondenceForwarding = async (
  correspondenceId: string,
  context: Context,
): Promise<CorrespondenceForwardingCheckResult> => {
  const token = getSessionToken(context);
  if (!token?.access_token || !isValidCorrespondenceId(correspondenceId)) {
    return notAllowed;
  }

  try {
    const { data } = await axios.get<ForwardingCheckResponse>(
      `${getCorrespondenceUrl(correspondenceId)}/forward/check`,
      {
        timeout: 30000,
        maxRedirects: 0,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: 'application/json',
        },
      },
    );
    return { allowed: data?.allowForwarding === true };
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

export const forwardCorrespondence = async ({
  correspondenceId,
  dialogToken,
  forwardTo,
  forwardingText,
}: ForwardCorrespondenceArgs): Promise<ForwardCorrespondenceResult> => {
  if (!dialogToken || !isValidCorrespondenceId(correspondenceId)) {
    return { success: false, status: null, errorCode: null };
  }

  try {
    await axios.post(
      `${getCorrespondenceUrl(correspondenceId)}/forward`,
      { forwardTo, ...(forwardingText ? { forwardingText } : {}) },
      {
        timeout: 30000,
        maxRedirects: 0,
        headers: {
          Authorization: `Bearer ${dialogToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return { success: true, status: null, errorCode: null };
  } catch (error) {
    const status = (isAxiosError(error) ? error.response?.status : undefined) ?? null;
    const errorCode = isAxiosError(error) ? readErrorCode(error.response?.data) : null;
    if (errorCode === null && status !== 401) {
      logger.error({ status, correspondenceId }, 'Failed to forward correspondence');
    }
    return { success: false, status, errorCode };
  }
};
