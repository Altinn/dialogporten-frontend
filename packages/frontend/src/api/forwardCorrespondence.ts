import { graphQLSDK } from './queries.ts';

export interface ForwardCorrespondenceRequest {
  correspondenceId: string;
  forwardTo: string[];
  forwardingText?: string;
}

export type ForwardCorrespondenceResult =
  | { forwardTo: string; ok: true }
  | { forwardTo: string; ok: false; status?: number; errorCode?: number };

const postForward = async (
  correspondenceId: string,
  forwardTo: string,
  forwardingText: string | undefined,
  dialogToken: string,
): Promise<ForwardCorrespondenceResult> => {
  try {
    const { forwardCorrespondence } = await graphQLSDK.forwardCorrespondence({
      correspondenceId,
      forwardTo,
      forwardingText,
      dialogToken,
    });
    if (forwardCorrespondence.success) {
      return { forwardTo, ok: true };
    }
    return {
      forwardTo,
      ok: false,
      status: forwardCorrespondence.status ?? undefined,
      errorCode: forwardCorrespondence.errorCode ?? undefined,
    };
  } catch {
    return { forwardTo, ok: false };
  }
};

const isUnauthorized = (result: ForwardCorrespondenceResult) => !result.ok && result.status === 401;

export const forwardCorrespondence = async (
  { correspondenceId, forwardTo, forwardingText }: ForwardCorrespondenceRequest,
  dialogToken: string | undefined,
  refreshDialogToken: () => Promise<string | undefined>,
): Promise<ForwardCorrespondenceResult[]> => {
  const token = dialogToken ?? (await refreshDialogToken());
  if (!token) {
    return forwardTo.map((recipient) => ({ forwardTo: recipient, ok: false, status: 401 }));
  }

  const results = await Promise.all(
    forwardTo.map((recipient) => postForward(correspondenceId, recipient, forwardingText, token)),
  );
  if (!results.some(isUnauthorized)) {
    return results;
  }

  const freshToken = await refreshDialogToken();
  if (!freshToken) {
    return results;
  }

  return Promise.all(
    results.map((result) =>
      isUnauthorized(result) ? postForward(correspondenceId, result.forwardTo, forwardingText, freshToken) : result,
    ),
  );
};
