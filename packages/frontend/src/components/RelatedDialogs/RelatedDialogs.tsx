import { Button, DialogList, type DialogListItemProps, Heading } from '@altinn/altinn-components';
import { DialogRelationType } from 'bff-types-generated';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogRelations } from '../../api/hooks/useDialogRelations.ts';
import { usePartyGraph } from '../../api/hooks/usePartiesSelectors.ts';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { buildOrganizationMap } from '../../utils/organizations.ts';
import { mapRelatedDialogToListItem } from './mapRelatedDialog.ts';
import { RelatedDialogLink, useRelatedDialogLinkTarget } from './partySwitch.tsx';
import { withRelationsCount } from './RelationsCount.tsx';
import styles from './relatedDialogs.module.css';
import { useInViewOnce } from './useInView.ts';

/* Page size of the related dialog lists on the dialog details page */
export const RELATED_DIALOGS_PAGE_SIZE = 25;

const RelatedDialogLinkWithCount = withRelationsCount(RelatedDialogLink);

const loadingItems = (count: number): DialogListItemProps[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `loading-${index}`,
    title: 'Loading dialog',
    summary: 'Loading summary',
    loading: true,
  }));

type RelationsQuery = ReturnType<typeof useDialogRelations>;

interface RelationListProps {
  id: string;
  heading: string;
  query: RelationsQuery;
}

const RelationList = ({ id, heading, query }: RelationListProps) => {
  const { t } = useTranslation();
  const format = useFormat();
  const partyGraph = usePartyGraph();
  const { organizations } = useOrganizations();
  const orgMap = useMemo(() => buildOrganizationMap(organizations), [organizations]);
  const getLinkTarget = useRelatedDialogLinkTarget(partyGraph);
  const { relations, hasNextPage, fetchNextPage, isFetchingNextPage } = query;

  const items = useMemo(
    () =>
      relations.map(({ dialog }) =>
        mapRelatedDialogToListItem({
          dialog,
          partyGraph,
          organizations: orgMap,
          format,
          t,
          link: getLinkTarget(dialog.id, dialog.party),
          /* Only dialogs with relations of their own can have children worth counting */
          as: dialog.hasRelations ? RelatedDialogLinkWithCount : RelatedDialogLink,
        }),
      ),
    [relations, partyGraph, orgMap, format, t, getLinkTarget],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.list} data-testid={id}>
      <Heading as="h2" size="md" id={`${id}-heading`}>
        {heading}
      </Heading>
      <DialogList items={items} />
      {hasNextPage && (
        <Button
          variant="outline"
          className={styles.showMore}
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
          aria-busy={isFetchingNextPage}
        >
          {t('dialog.related.show_more')}
        </Button>
      )}
    </div>
  );
};

interface RelatedDialogsProps {
  dialogId: string;
}

/**
 * Lists the child dialogs and the (non-hierarchical) related dialogs of a dialog. Nothing is fetched until the section
 * scrolls into view; further pages are loaded on demand. Lists without any dialogs the end user can access are left
 * out, as the API leaves out relations to dialogs the end user cannot access.
 */
export const RelatedDialogs = ({ dialogId }: RelatedDialogsProps) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInViewOnce(ref);
  const children = useDialogRelations({
    dialogId,
    type: DialogRelationType.Child,
    limit: RELATED_DIALOGS_PAGE_SIZE,
    enabled: inView,
  });
  const related = useDialogRelations({
    dialogId,
    type: DialogRelationType.Related,
    limit: RELATED_DIALOGS_PAGE_SIZE,
    enabled: inView,
  });

  const isSettled = (query: RelationsQuery) => query.isSuccess || query.isError;
  const isPending = !isSettled(children) || !isSettled(related);

  return (
    <section
      ref={ref}
      className={styles.section}
      data-testid="related-dialogs"
      data-state={isPending ? 'pending' : 'loaded'}
      aria-busy={isPending}
    >
      {isPending ? (
        <DialogList items={loadingItems(2)} isLoading />
      ) : (
        <>
          <RelationList id="child-dialogs" heading={t('dialog.related.children_heading')} query={children} />
          <RelationList id="related-dialogs-list" heading={t('dialog.related.related_heading')} query={related} />
        </>
      )}
    </section>
  );
};
