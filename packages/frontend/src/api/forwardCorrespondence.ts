import { graphQLSDK } from './queries.ts';

export interface ForwardCorrespondenceRequest {
  correspondenceId: string;
  forwardTo: string[];
  forwardingText?: string;
  includeAttachments: boolean;
}

export type ForwardCorrespondenceResult =
  | { forwardTo: string; ok: true }
  | { forwardTo: string; ok: false; status?: number; errorCode?: number };

const postForward = async (
  { correspondenceId, forwardingText, includeAttachments }: Omit<ForwardCorrespondenceRequest, 'forwardTo'>,
  forwardTo: string,
  dialogToken: string,
): Promise<ForwardCorrespondenceResult> => {
  try {
    const { forwardCorrespondence } = await graphQLSDK.forwardCorrespondence({
      correspondenceId,
      forwardTo,
      forwardingText,
      includeAttachments,
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
  request: ForwardCorrespondenceRequest,
  dialogToken: string | undefined,
  refreshDialogToken: () => Promise<string | undefined>,
): Promise<ForwardCorrespondenceResult[]> => {
  const token = dialogToken ?? (await refreshDialogToken());
  if (!token) {
    return request.forwardTo.map((recipient) => ({ forwardTo: recipient, ok: false, status: 401 }));
  }

  const results = await Promise.all(request.forwardTo.map((recipient) => postForward(request, recipient, token)));
  if (!results.some(isUnauthorized)) {
    return results;
  }

  const freshToken = await refreshDialogToken();
  if (!freshToken) {
    return results;
  }

  return Promise.all(
    results.map((result) => (isUnauthorized(result) ? postForward(request, result.forwardTo, freshToken) : result)),
  );
};
