import {
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
import { useCallback, useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationServiceResources } from '../../../api/hooks/useServiceResource.ts';
import { updateNotificationsetting } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import { getOrganization } from '../../../utils/organizations.ts';
import { useOrganizations } from '../../Inbox/useOrganizations.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';

export interface ServiceResourceNotificationsDetailsProps {
  notificationParty?: NotificationAccountsType | null;
}

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

  const [enabledResources, setEnabledResources] = useState<Set<string>>(
    () => new Set((notificationSetting?.resourceIncludeList ?? []).filter((r): r is string => r !== null)),
  );
  const [isFilterEnabled, setIsFilterEnabled] = useState(() => enabledResources.size > 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchQueryLower = deferredSearchQuery.toLowerCase();

  const filteredResources = useMemo(
    () =>
      serviceResources.filter((resource) => {
        if (!resource.id) return false;
        return (resource.title ?? '').toLowerCase().includes(searchQueryLower);
      }),
    [serviceResources, searchQueryLower],
  );

  const isChecked = (urn: string) => enabledResources.has(urn);

  const handleToggle = (urn: string, checked: boolean) => {
    setEnabledResources((prev) => {
      const next = new Set(prev);
      if (checked) next.add(urn);
      else next.delete(urn);
      return next;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
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

  const virtualizer = useVirtualizer({
    count: filteredResources.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 64,
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

      {isFilterEnabled ? (
        <Typography>
          <p>{t('profile.service_notifications.selected_count', { count: enabledResources.size })}</p>
        </Typography>
      ) : (
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Fieldset size="sm">
            {filteredResources.length > 0 ? (
              <div
                ref={scrollRef}
                style={{ maxHeight: maxListHeight ? `${maxListHeight}px` : '300px', overflow: 'auto' }}
              >
                <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const resource = filteredResources[virtualRow.index];
                    const { id } = resource;
                    return (
                      <div
                        key={id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          borderTop: virtualRow.index > 0 ? '1px solid var(--ds-color-border-subtle)' : undefined,
                        }}
                        ref={virtualizer.measureElement}
                        data-index={virtualRow.index}
                      >
                        <SettingsItem
                          containerAs="div"
                          variant="switch"
                          id={id!}
                          icon={BellIcon}
                          title={resource.title ?? resource.id ?? undefined}
                          description={
                            getOrganization(organizations, resource.org ?? '')?.name ?? resource.org ?? undefined
                          }
                          name={id!}
                          value={id!}
                          checked={isChecked(id!)}
                          onChange={(e) => handleToggle(id!, e.target.checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isLoadingResources ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <DsSpinner data-size="md" aria-label={t('profile.service_notifications.loading')} />
              </div>
            ) : (
              <Typography>
                <p>{t('profile.service_notifications.no_results')}</p>
              </Typography>
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
