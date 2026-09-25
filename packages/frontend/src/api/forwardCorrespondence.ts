import { graphQLSDK } from './queries.ts';

export interface ForwardCorrespondenceRequest {
  correspondenceId: string;
  forwardTo: string;
  forwardingText?: string;
}

export type ForwardCorrespondenceResult = { ok: true } | { ok: false; status?: number; errorCode?: number };

const postForward = async (
  request: ForwardCorrespondenceRequest,
  dialogToken: string,
): Promise<ForwardCorrespondenceResult> => {
  try {
    const { forwardCorrespondence } = await graphQLSDK.forwardCorrespondence({ ...request, dialogToken });
    if (forwardCorrespondence.success) {
      return { ok: true };
    }
    return {
      ok: false,
      status: forwardCorrespondence.status ?? undefined,
      errorCode: forwardCorrespondence.errorCode ?? undefined,
    };
  } catch {
    return { ok: false };
  }
};

export const forwardCorrespondence = async (
  request: ForwardCorrespondenceRequest,
  dialogToken: string | undefined,
  refreshDialogToken: () => Promise<string | undefined>,
): Promise<ForwardCorrespondenceResult> => {
  const token = dialogToken ?? (await refreshDialogToken());
  if (!token) {
    return { ok: false, status: 401 };
  }

  const result = await postForward(request, token);
  if (result.ok || result.status !== 401) {
    return result;
  }

  const freshToken = await refreshDialogToken();
  return freshToken ? postForward(request, freshToken) : result;
};
