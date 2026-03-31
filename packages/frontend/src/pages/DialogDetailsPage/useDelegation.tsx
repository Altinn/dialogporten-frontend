import type { DialogLookupQuery } from 'bff-types-generated';
import { useMemo } from 'react';
import { usePartyGraph } from '../../api/hooks/usePartiesSelectors.ts';
import { graphQLSDK } from '../../api/queries.ts';
import { getAccessAMUILink } from '../../auth';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';

interface UseDelegationOutput {
  delegationHref?: string;
}

const getDelegationHref = (instanceUrn: string, resourceId: string, dialogId: string, partyUuid: string): string => {
  const base = getAccessAMUILink();
  const params = new URLSearchParams({
    instanceUrn,
    resourceId,
    dialogId,
    partyUuid,
  });
  return `${base}/poa-overview/instance?${params.toString()}`;
};

export const useDelegation = (dialogId?: string, party?: string, org?: string): UseDelegationOutput => {
  const partyGraph = usePartyGraph();
  const instanceRef = `urn:altinn:dialog-id:${dialogId}`;
  const enableDelegationLink = useFeatureFlag('auth.enableDelegationLink');
  const orgsNotReadyToDealWithDelegations = useFeatureFlag<string[]>('auth.orgsNotReadyToDealWithDelegations');
  const { data, isSuccess } = useAuthenticatedQuery<DialogLookupQuery>({
    queryKey: [QUERY_KEYS.DIALOG_DELEGATION_LOOKUP, dialogId],
    staleTime: 0,
    refetchInterval: 1_200_000,
    refetchOnMount: 'always',
    retry: 3,
    queryFn: async () => graphQLSDK.dialogLookup({ instanceRef: instanceRef }),
    enabled: !!dialogId && !!enableDelegationLink,
  });

  const partyUuid = useMemo(() => {
    return party ? partyGraph.partyByUrn.get(party)?.partyUuid : undefined;
  }, [partyGraph, party]);

  if (!enableDelegationLink) {
    return {
      delegationHref: undefined,
    };
  }

  const isDelegable = data?.dialogLookup?.lookup?.serviceResource?.isDelegable
    ? !orgsNotReadyToDealWithDelegations?.includes(org ?? '')
    : false;

  if (isSuccess && isDelegable) {
    const instanceRef = data?.dialogLookup?.lookup?.instanceRef;
    const serviceResourceId = data?.dialogLookup?.lookup?.serviceResource.id;
    if (instanceRef && serviceResourceId && dialogId && partyUuid) {
      return {
        delegationHref: getDelegationHref(instanceRef, serviceResourceId, dialogId, partyUuid),
      };
    }
  }

  return {
    delegationHref: undefined,
  };
};
