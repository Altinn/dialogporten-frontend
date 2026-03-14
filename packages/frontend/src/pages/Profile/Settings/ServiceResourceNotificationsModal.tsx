import {
  Button,
  ButtonGroup,
  DsSpinner,
  Fieldset,
  Heading,
  ModalBase,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchField,
  Switch,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ServiceResource } from 'bff-types-generated';
import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServiceResource } from '../../../api/hooks/useServiceResource.ts';
import { updateNotificationsetting } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';

interface ServiceResourceNotificationsModalProps {
  open: boolean;
  onClose: () => void;
  notificationParty: NotificationAccountsType | null | undefined;
}

export const ServiceResourceNotificationsModal = ({
  open,
  onClose,
  notificationParty,
}: ServiceResourceNotificationsModalProps) => {
  const { t } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const { logError } = useErrorLogger();
  const queryClient = useQueryClient();
  const { serviceResources, isLoading: isLoadingResources } = useServiceResource();

  const notificationSetting = notificationParty?.notificationSettings;

  // list empty -> all enabled, otherwise only those in the list are enabled
  // [] (empty) -> notifications for ALL services
  // [id1, id2] -> notifications ONLY for id1 and id2
  const [enabledResources, setEnabledResources] = useState<Set<string>>(
    () => new Set((notificationSetting?.resourceIncludeList ?? []).filter((r): r is string => r !== null)),
  );
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

  const allServiceUrns = useMemo(
    () =>
      new Set(serviceResources.filter((r): r is ServiceResource & { id: string } => Boolean(r.id)).map((r) => r.id)),
    [serviceResources],
  );

  const isChecked = (urn: string) => {
    return enabledResources.size === 0 || enabledResources.has(urn);
  };

  const handleToggle = (urn: string, checked: boolean) => {
    setEnabledResources((prev) => {
      if (checked) {
        const next = new Set(prev).add(urn);
        // collapse back to "all enabled" sentinel (empty set) if every service is now checked
        return next.size === allServiceUrns.size ? new Set<string>() : next;
      }
      // expand from "all enabled" sentinel before removing
      const base = prev.size === 0 ? new Set(allServiceUrns) : new Set(prev);
      base.delete(urn);
      return base;
    });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredResources.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const handleSave = async () => {
    const partyUuid = notificationSetting?.partyUuid || notificationParty?.partyUuid || '';
    setIsSaving(true);
    try {
      const result = await updateNotificationsetting({
        partyUuid,
        userId: notificationSetting?.userId,
        emailAddress: notificationSetting?.emailAddress ?? '',
        phoneNumber: notificationSetting?.phoneNumber ?? '',
        resourceIncludeList: [...enabledResources],
      });
      if (result?.updateNotificationSetting?.success) {
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
        openSnackbar({ message: t('profile.service_notifications.snackbar.success'), color: 'company' });
        onClose();
      } else {
        openSnackbar({ message: t('profile.service_notifications.snackbar.error'), color: 'danger' });
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'ServiceResourceNotificationsModal.handleSave' },
        'Error updating service resource notification settings',
      );
      openSnackbar({ message: t('profile.service_notifications.snackbar.error'), color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBase variant="content" open={open} onClose={onClose} height="full">
      <ModalHeader
        title={notificationParty?.name ?? ''}
        icon={{ name: notificationParty?.name ?? '', type: 'company' }}
        onClose={onClose}
        sticky={false}
      />
      <ModalBody>
        <Heading size="md">{t('profile.service_notifications.title')}</Heading>
        <div style={{ position: 'sticky', top: '1.5rem', zIndex: 1 }}>
          <SearchField
            placeholder={t('profile.service_notifications.search_placeholder')}
            size="sm"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Fieldset size="sm">
          {filteredResources.length > 0 ? (
            <div ref={scrollRef} style={{ maxHeight: 'calc(100vh - 20rem)', overflow: 'auto' }}>
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
                        paddingBlock: '4px',
                      }}
                      ref={virtualizer.measureElement}
                      data-index={virtualRow.index}
                    >
                      <Switch
                        label={resource.title || resource.id}
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
      </ModalBody>
      <ModalFooter sticky>
        <ButtonGroup>
          <Button variant="solid" onClick={handleSave} disabled={isSaving}>
            {t('profile.service_notifications.save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('profile.service_notifications.cancel')}
          </Button>
        </ButtonGroup>
      </ModalFooter>
    </ModalBase>
  );
};
