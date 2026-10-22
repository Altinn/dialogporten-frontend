import { LayersIcon } from '@navikt/aksel-icons';
import { DialogRelationType } from 'bff-types-generated';
import { type ComponentType, type ReactNode, type Ref, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { LinkProps } from 'react-router';
import { useDialogRelations } from '../../api/hooks/useDialogRelations.ts';
import styles from './relatedDialogs.module.css';
import { useInViewOnce } from './useInView.ts';

/* Page size of the count request. Counts beyond it are shown as "100+" rather than paging through them. */
export const RELATIONS_COUNT_LIMIT = 100;

/**
 * DialogListItem only hands its `as` link component the generic link props, not the dialog itself, so the dialog id is
 * read back from the link target (`/inbox/<id>/…`).
 */
export const getDialogIdFromHref = (href: string): string | undefined =>
  /\/inbox\/([^/?#]+)/.exec(href)?.[1] ?? undefined;

interface ChildRelationsCount {
  count: number;
  hasMore: boolean;
}

/**
 * Counts the child dialogs of a dialog the end user can see, from the first page of its CHILD relations. Shares its
 * cache entry with other callers asking for the same page size.
 */
export const useChildRelationsCount = (dialogId: string | undefined, enabled: boolean): ChildRelationsCount | null => {
  const { relations, hasNextPage, isSuccess } = useDialogRelations({
    dialogId: dialogId ?? '',
    type: DialogRelationType.Child,
    limit: RELATIONS_COUNT_LIMIT,
    enabled: enabled && Boolean(dialogId),
  });
  return isSuccess ? { count: relations.length, hasMore: hasNextPage } : null;
};

export const RelationsCountLabel = ({ count, hasMore }: ChildRelationsCount) => {
  const { t } = useTranslation();
  if (count === 0) {
    return null;
  }
  return (
    <span className={styles.relationsCount} data-testid="relations-count">
      <LayersIcon aria-hidden className={styles.relationsCountIcon} />
      {hasMore ? t('dialog.related.child_count_more', { count }) : t('dialog.related.child_count', { count })}
    </span>
  );
};

type ListItemLinkProps = Omit<LinkProps, 'to'> & { href?: string; children?: ReactNode; ref?: Ref<HTMLAnchorElement> };

/**
 * Wraps the link component of a DialogListItem whose dialog has relations. Once the item scrolls into view, it fetches
 * the first page of the dialog's child relations and shows how many there are below the item's metadata. Items that
 * never come into view cost nothing.
 *
 * DialogListItem 0.76 does not render its `badge` prop, so the count is rendered by the link itself.
 */
export const withRelationsCount = (LinkComponent: ComponentType<ListItemLinkProps>) => {
  const RelationsAwareLink = ({ children, ...props }: ListItemLinkProps) => {
    const ref = useRef<HTMLAnchorElement>(null);
    const inView = useInViewOnce(ref, '0px');
    const childCount = useChildRelationsCount(getDialogIdFromHref(props.href ?? ''), inView);
    return (
      <LinkComponent {...props} ref={ref}>
        {children}
        {childCount && <RelationsCountLabel {...childCount} />}
      </LinkComponent>
    );
  };
  RelationsAwareLink.displayName = `withRelationsCount(${LinkComponent.displayName ?? LinkComponent.name})`;
  return RelationsAwareLink;
};
