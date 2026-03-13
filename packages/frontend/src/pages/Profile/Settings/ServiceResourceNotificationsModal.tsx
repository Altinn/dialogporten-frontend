import {
  Button,
  ButtonGroup,
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
import type { ServiceResource, ServiceResourceTitle } from 'bff-types-generated';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServiceResource } from '../../../api/hooks/useServiceResource.ts';
import { updateNotificationsetting } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';

const toUrn = (rawId: string) => `urn:altinn:resource:${rawId}`;
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
  const { t, i18n } = useTranslation();
  const { openSnackbar } = useSnackbar();
  const { logError } = useErrorLogger();
  const queryClient = useQueryClient();
  const { serviceResources } = useServiceResource();

  const notificationSetting = notificationParty?.notificationSettings;

  // list empty -> all enabled, otherwise only those in the list are enabled
  // [] (empty) -> notifications for ALL services
  // [id1, id2] -> notifications ONLY for id1 and id2
  const [enabledResources, setEnabledResources] = useState<string[]>(
    (notificationSetting?.resourceIncludeList ?? []).filter((r): r is string => r !== null),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getTitle = (resource: { title?: ServiceResourceTitle | null }) => {
    const lang = i18n.language as 'nb' | 'nn' | 'en';
    return resource.title?.[lang] || resource.title?.nb || '';
  };

  const searchQueryLower = searchQuery.toLowerCase();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const filteredResources = useMemo(
    () =>
      serviceResources.filter((resource) => {
        const title = getTitle(resource);
        return title.toLowerCase().includes(searchQueryLower);
      }),
    [serviceResources, searchQueryLower],
  );

  const allServiceUrns = useMemo(
    () => serviceResources.filter((r): r is ServiceResource & { id: string } => Boolean(r.id)).map((r) => toUrn(r.id)),
    [serviceResources],
  );

  const isChecked = (rawId: string) => {
    const urn = toUrn(rawId);
    return enabledResources.length === 0 || enabledResources.includes(urn);
  };

  const handleToggle = (rawId: string, checked: boolean) => {
    const urn = toUrn(rawId);
    setEnabledResources((prev) => {
      if (checked) {
        // Adding a service back: add URN, then collapse to [] if all are now enabled
        const next = [...prev, urn];
        return next.length === allServiceUrns.length && allServiceUrns.every((u) => next.includes(u)) ? [] : next;
      }
      // Removing a service: if currently in "all on" mode, expand to all URNs minus this one
      const base = prev.length === 0 ? allServiceUrns : prev;
      return base.filter((u) => u !== urn);
    });
  };

  const handleSave = async () => {
    const partyUuid = notificationSetting?.partyUuid || notificationParty?.partyUuid || '';
    setIsSaving(true);
    try {
      const result = await updateNotificationsetting({
        partyUuid,
        userId: notificationSetting?.userId,
        emailAddress: notificationSetting?.emailAddress ?? '',
        phoneNumber: notificationSetting?.phoneNumber ?? '',
        resourceIncludeList: enabledResources,
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
            filteredResources.map((resource) => {
              const { id } = resource;
              if (!id) return null;
              return (
                <Switch
                  key={id}
                  label={getTitle(resource)}
                  name={id}
                  value={id}
                  checked={isChecked(id)}
                  onChange={(e) => handleToggle(id, e.target.checked)}
                />
              );
            })
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
