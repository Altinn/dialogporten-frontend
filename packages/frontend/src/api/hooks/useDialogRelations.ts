import type { DialogRelationsQuery, DialogRelationType, RelatedDialogFieldsFragment } from 'bff-types-generated';
import { useMemo } from 'react';
import { useAuthenticatedInfiniteQuery } from '../../auth/useAuthenticatedInfiniteQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getDialogRelations } from '../queries.ts';

export type RelatedDialog = RelatedDialogFieldsFragment;

export interface DialogRelationItem {
  relationType: DialogRelationType;
  dialog: RelatedDialog;
}

interface UseDialogRelationsProps {
  dialogId: string;
  /** Relation type as seen from `dialogId`. Omit for all types. */
  type?: DialogRelationType;
  /** Page size; the API defaults to 100 and allows at most 1000 */
  limit: number;
  /** Lets callers defer the first request, e.g. until the relations are on screen */
  enabled?: boolean;
}

interface UseDialogRelationsOutput {
  relations: DialogRelationItem[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

/**
 * Loads the relations of a dialog, a page at a time (keyset paginated, in creation order of the related dialogs).
 *
 * Relations to dialogs the end user cannot access are left out by the API, so the result may be empty even when the
 * dialog's `hasRelations` is true. API-only dialogs are always left out, as in the inbox.
 */
export const useDialogRelations = ({
  dialogId,
  type,
  limit,
  enabled = true,
}: UseDialogRelationsProps): UseDialogRelationsOutput => {
  const { data, isLoading, isSuccess, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAuthenticatedInfiniteQuery<DialogRelationsQuery>({
      queryKey: [QUERY_KEYS.DIALOG_RELATIONS, dialogId, type ?? 'ALL', limit],
      queryFn: ({ pageParam }) =>
        getDialogRelations({
          dialogId,
          input: {
            type,
            limit,
            excludeApiOnly: true,
            continuationToken: pageParam as string | undefined,
          },
        }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        const { hasNextPage, continuationToken } = lastPage?.dialogRelations ?? {};
        return hasNextPage && typeof continuationToken === 'string' ? continuationToken : undefined;
      },
      enabled: enabled && Boolean(dialogId),
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });

  const relations = useMemo(
    () => data?.pages.flatMap((page) => (page.dialogRelations?.items ?? []) as DialogRelationItem[]) ?? [],
    [data],
  );

  return {
    relations,
    isLoading,
    isSuccess,
    isError,
    hasNextPage,
    fetchNextPage: () => void fetchNextPage(),
    isFetchingNextPage,
  };
};
