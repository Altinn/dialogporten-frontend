import {
  Badge,
  Button,
  ButtonGroup,
  DsSpinner,
  Fieldset,
  SearchField,
  Section,
  SettingsItem,
  Switch,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { BellIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ServiceResource } from 'bff-types-generated';
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationServiceResources } from '../../../api/hooks/useServiceResource.ts';
import { updateNotificationsetting } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import { getOrganization } from '../../../utils/organizations.ts';
import { useOrganizations } from '../../Inbox/useOrganizations.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';
import styles from './serviceResourceNotificationsDetails.module.css';

export interface ServiceResourceNotificationsDetailsProps {
  notificationParty?: NotificationAccountsType | null;
}

type ListRowGroup = 'selected' | 'all';

type ListRow =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'item'; key: string; group: ListRowGroup; resource: ServiceResource };

export const ServiceResourceNotificationsDetails = ({
  notificationParty,
}: ServiceResourceNotificationsDetailsProps) => {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const { logError } = useErrorLogger();
  const queryClient = useQueryClient();
  const { serviceResources, isLoading: isLoadingResources } = useNotificationServiceResources();
  const { organizations } = useOrganizations();
  const notificationSetting = notificationParty?.notificationSettings;

  const savedResources = useMemo(
    () => (notificationSetting?.resourceIncludeList ?? []).filter((r): r is string => r !== null),
    [notificationSetting?.resourceIncludeList],
  );

  const [enabledResources, setEnabledResources] = useState<Set<string>>(() => new Set(savedResources));
  const [groupMembers, setGroupMembers] = useState<Set<string>>(() => new Set(savedResources));
  const [isFilterEnabled, setIsFilterEnabled] = useState(() => savedResources.length > 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ key: string; offset: number; attempts: number } | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchQueryLower = deferredSearchQuery.toLowerCase();
  const isSearching = searchQueryLower.length > 0;
  const selectedCount = enabledResources.size;

  const resetFromSavedSetting = useCallback(() => {
    const saved = new Set(savedResources);
    setEnabledResources(saved);
    setGroupMembers(new Set(saved));
    setIsFilterEnabled(saved.size > 0);
    setSearchQuery('');
  }, [savedResources]);

  useEffect(() => {
    const dialog = footerRef.current?.closest('dialog');
    if (!dialog) return;
    const observer = new MutationObserver(() => {
      if (dialog.open) {
        resetFromSavedSetting();
      }
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, [resetFromSavedSetting]);

  const filteredResources = useMemo(
    () =>
      serviceResources.filter((resource) => {
        if (!resource.id) return false;
        return (resource.title ?? '').toLowerCase().includes(searchQueryLower);
      }),
    [serviceResources, searchQueryLower],
  );

  const rows = useMemo<ListRow[]>(() => {
    const allRows: ListRow[] = filteredResources.map((resource) => ({
      kind: 'item',
      key: `all:${resource.id}`,
      group: 'all',
      resource,
    }));

    if (isSearching) {
      return [
        {
          kind: 'header',
          key: 'header:search',
          label: t('profile.service_notifications.group.search_results', { count: allRows.length }),
        },
        ...allRows,
      ];
    }

    const selectedRows: ListRow[] =
      groupMembers.size === 0
        ? []
        : filteredResources
            .filter((resource) => groupMembers.has(resource.id!))
            .map((resource) => ({ kind: 'item', key: `selected:${resource.id}`, group: 'selected', resource }));

    const selectedHeader: ListRow = {
      kind: 'header',
      key: 'header:selected',
      label: t('profile.service_notifications.selected_count', { count: selectedCount }),
    };

    if (selectedRows.length === 0) return [selectedHeader, ...allRows];

    return [
      selectedHeader,
      ...selectedRows,
      { kind: 'header', key: 'header:all', label: t('profile.service_notifications.group.all') },
      ...allRows,
    ];
  }, [filteredResources, groupMembers, isSearching, selectedCount, t]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Back to the top whenever the query changes
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [searchQueryLower]);

  const captureScrollAnchor = useCallback(() => {
    const scrollEl = scrollRef.current;
    scrollAnchorRef.current = null;
    if (!scrollEl) return;
    const scrollTop = scrollEl.getBoundingClientRect().top;
    for (const row of scrollEl.querySelectorAll<HTMLElement>('[data-row-group="all"]')) {
      const rect = row.getBoundingClientRect();
      if (rect.bottom > scrollTop && row.dataset.rowKey) {
        scrollAnchorRef.current = { key: row.dataset.rowKey, offset: rect.top - scrollTop, attempts: 0 };
        return;
      }
    }
  }, []);

  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    const scrollEl = scrollRef.current;
    if (!anchor || !scrollEl) return;
    const row = scrollEl.querySelector<HTMLElement>(`[data-row-key="${CSS.escape(anchor.key)}"]`);
    if (!row || anchor.attempts >= 3) {
      scrollAnchorRef.current = null;
      return;
    }
    const delta = row.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top - anchor.offset;
    if (Math.abs(delta) < 0.5) {
      scrollAnchorRef.current = null;
      return;
    }
    anchor.attempts += 1;
    scrollEl.scrollTop += delta;
  });

  const handleToggle = (urn: string, checked: boolean) => {
    captureScrollAnchor();
    setEnabledResources((prev) => {
      const next = new Set(prev);
      if (checked) next.add(urn);
      else next.delete(urn);
      return next;
    });
    if (checked) {
      setGroupMembers((prev) => (prev.has(urn) ? prev : new Set(prev).add(urn)));
    }
  };

  const [maxListHeight, setMaxListHeight] = useState<number | undefined>(undefined);

  const computeMaxListHeight = useCallback(() => {
    const scrollEl = scrollRef.current;
    const footerEl = footerRef.current;
    if (!scrollEl || !footerEl) return;
    const dialog = scrollEl.closest('dialog');
    if (!dialog) return;
    const dialogRect = dialog.getBoundingClientRect();
    const scrollTop = scrollEl.getBoundingClientRect().top;
    const footerHeight = footerEl.getBoundingClientRect().height;
    // Available space from the top of the list to just above the footer, with a small breathing margin.
    const available = dialogRect.bottom - scrollTop - footerHeight - 36;
    setMaxListHeight(Math.max(120, available));
  }, []);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const dialog = scrollEl.closest('dialog');
    if (!dialog) return;
    computeMaxListHeight();
    const ro = new ResizeObserver(computeMaxListHeight);
    ro.observe(dialog);
    window.addEventListener('resize', computeMaxListHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeMaxListHeight);
    };
  }, [computeMaxListHeight]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Recompute when the list visibility flips
  useLayoutEffect(() => {
    computeMaxListHeight();
  }, [isFilterEnabled, computeMaxListHeight]);

  const getItemKey = useCallback((index: number) => rows[index].key, [rows]);
  const estimateSize = useCallback((index: number) => (rows[index].kind === 'header' ? 44 : 64), [rows]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    getItemKey,
    overscan: 10,
  });

  const handleClose = (mouseEvent: React.MouseEvent<HTMLButtonElement>) => {
    const target = mouseEvent.target as Element | null;
    target?.closest('dialog')?.close();
  };

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const partyUuid = notificationSetting?.partyUuid || notificationParty?.partyUuid || '';
    setIsSaving(true);
    try {
      const result = await updateNotificationsetting({
        partyUuid,
        resourceIncludeList: isFilterEnabled ? [...enabledResources] : [],
      });

      if (result?.updateNotificationSetting?.success) {
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
        openSnackbar({ message: t('profile.service_notifications.snackbar.success'), color: 'company' });
      } else {
        openSnackbar({ message: t('profile.service_notifications.snackbar.error'), color: 'danger' });
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'ServiceResourceNotificationsDetails.handleSave' },
        'Error updating service resource notification settings',
      );
      openSnackbar({ message: t('profile.service_notifications.snackbar.error'), color: 'danger' });
    } finally {
      setIsSaving(false);
      handleClose(event);
    }
  };

  return (
    <Section spacing={4}>
      <Switch
        label={t('profile.service_notifications.title')}
        checked={isFilterEnabled}
        onChange={(e) => setIsFilterEnabled(e.target.checked)}
      />

      {!isFilterEnabled && (
        <Typography>
          <p>
            <strong>{t('profile.service_notifications.filter_default_heading')}</strong>{' '}
            {t('profile.service_notifications.filter_default_body')}
          </p>
        </Typography>
      )}

      {isFilterEnabled && (
        <>
          <SearchField
            placeholder={t('inbox.search.placeholder')}
            size="sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <p className={styles.srOnly} aria-live="polite">
            {t('profile.service_notifications.selected_count', { count: selectedCount })}
          </p>
          <Fieldset size="sm">
            {isLoadingResources && serviceResources.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <DsSpinner data-size="md" aria-label={t('profile.service_notifications.loading')} />
              </div>
            ) : (
              <div
                ref={scrollRef}
                style={{ maxHeight: maxListHeight ? `${maxListHeight}px` : '300px', overflow: 'auto' }}
              >
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    const previousRow = virtualRow.index > 0 ? rows[virtualRow.index - 1] : undefined;
                    const isItem = row.kind === 'item';
                    const isDeselected = isItem && row.group === 'selected' && !enabledResources.has(row.resource.id!);

                    return (
                      <div
                        key={virtualRow.key}
                        className={isItem ? (isDeselected ? styles.deselected : undefined) : styles.groupHeader}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          borderTop:
                            isItem && previousRow?.kind === 'item'
                              ? '1px solid var(--ds-color-border-subtle)'
                              : undefined,
                        }}
                        ref={virtualizer.measureElement}
                        data-index={virtualRow.index}
                        data-row-key={row.key}
                        data-row-group={isItem ? row.group : undefined}
                      >
                        {row.kind === 'header' ? (
                          <Typography size="sm">
                            <h3>{row.label}</h3>
                          </Typography>
                        ) : (
                          <SettingsItem
                            containerAs="div"
                            variant="switch"
                            id={`${row.group}:${row.resource.id!}`}
                            icon={BellIcon}
                            title={
                              row.resource.deprecated ? (
                                <>
                                  {row.resource.title ?? row.resource.id}{' '}
                                  <Badge color="neutral">{t('profile.service_notifications.expired')}</Badge>
                                </>
                              ) : (
                                (row.resource.title ?? row.resource.id ?? undefined)
                              )
                            }
                            description={
                              getOrganization(organizations, row.resource.org ?? '')?.name ??
                              row.resource.org ??
                              undefined
                            }
                            name={row.resource.id!}
                            value={row.resource.id!}
                            checked={enabledResources.has(row.resource.id!)}
                            onChange={(e) => handleToggle(row.resource.id!, e.target.checked)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Fieldset>
        </>
      )}

      <div ref={footerRef}>
        <ButtonGroup>
          <Button variant="solid" onClick={handleSave} disabled={isSaving}>
            {t('profile.service_notifications.save')}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            {t('profile.service_notifications.cancel')}
          </Button>
        </ButtonGroup>
      </div>
    </Section>
  );
};
