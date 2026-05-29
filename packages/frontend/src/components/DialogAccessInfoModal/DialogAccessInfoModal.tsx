import {
  AuthEvidence,
  type AuthEvidenceItemProps,
  type AvatarProps,
  type ButtonVariant,
  DsSpinner,
  SettingsModal,
  Typography,
} from '@altinn/altinn-components';
import { DialogLookupGrantType } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useDialogAccessInfo } from '../../api/hooks/useDialogAccessInfo.ts';
import { getAccessAMUILink } from '../../auth';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import { FilterCategory } from '../../pages/Inbox/filters.tsx';
import { pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { PageRoutes } from '../../pages/routes.ts';
import { getOrganizationByLocale } from '../../utils/organizations.ts';
import styles from './dialogAccessInfoModal.module.css';

interface DialogAccessInfoModalProps {
  dialogId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const GRANT_TYPE_TO_AUTH_EVIDENCE: Record<DialogLookupGrantType, NonNullable<AuthEvidenceItemProps['grantType']>> = {
  [DialogLookupGrantType.AccessPackage]: 'package',
  [DialogLookupGrantType.Role]: 'role',
  [DialogLookupGrantType.ResourceDelegation]: 'resource',
  [DialogLookupGrantType.InstanceDelegation]: 'instance',
};

export const DialogAccessInfoModal = ({ dialogId, isOpen, onClose }: DialogAccessInfoModalProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { accessInfo, isLoading, isError } = useDialogAccessInfo(dialogId, { enabled: isOpen });
  const { organizations } = useOrganizations();

  // Build the inbox link that scopes the list to this service while keeping the
  // currently selected party/allParties/subAccounts in the URL.
  const findInInboxTo = accessInfo
    ? `${PageRoutes.inbox}${pruneSearchQueryParams(location.search, {
        [FilterCategory.SERVICE]: 'urn:altinn:resource:' + accessInfo.serviceResource.id,
      })}`
    : undefined;

  return (
    <SettingsModal
      variant="content"
      title={t('dialog.access_info.modal.title')}
      open={isOpen}
      onClose={onClose}
      buttons={[
        {
          as: 'a',
          href: getAccessAMUILink(),
          label: t('dialog.access_info.open_access_management'),
        },
        {
          variant: 'outline',
          label: t('word.close'),
          close: true,
        },
        ...(findInInboxTo
          ? [
              {
                as: (props: LinkProps) => <Link {...props} to={findInInboxTo} onClick={onClose} />,
                variant: 'ghost' as ButtonVariant,
                label: t('dialog.access_info.find_in_inbox'),
              },
            ]
          : []),
      ]}
    >
      {isLoading ? (
        <DsSpinner aria-label={t('word.loading')} />
      ) : isError || !accessInfo ? (
        <Typography>
          <p>{t('dialog.access_info.error')}</p>
        </Typography>
      ) : (
        <DialogAccessInfoBody accessInfo={accessInfo} organizations={organizations ?? []} locale={i18n.language} />
      )}
    </SettingsModal>
  );
};

interface DialogAccessInfoBodyProps {
  accessInfo: NonNullable<ReturnType<typeof useDialogAccessInfo>['accessInfo']>;
  organizations: Parameters<typeof getOrganizationByLocale>[0];
  locale: string;
}

const DialogAccessInfoBody = ({ accessInfo, organizations, locale }: DialogAccessInfoBodyProps) => {
  const { t } = useTranslation();
  const { serviceResource, serviceOwner, authorizationEvidence } = accessInfo;

  const serviceResourceName = getPreferredPropertyByLocale(serviceResource.name)?.value || serviceResource.id;
  const serviceOwnerLocalizedName = getPreferredPropertyByLocale(serviceOwner.name)?.value || serviceOwner.code;
  const orgLookup = getOrganizationByLocale(organizations, serviceOwner.code, locale);
  const ownerDisplayName = orgLookup?.name || serviceOwnerLocalizedName;

  const ownerAvatar: AvatarProps = {
    type: 'company',
    name: ownerDisplayName,
    imageUrl: orgLookup?.logo || undefined,
  };

  // TODO: dialogLookup will soon expose names for access packages and roles as
  // part of the response. Once that lands we should render the friendly names
  // here (e.g. "Folkeregisterets navnepakke", "Daglig leder") instead of the
  // raw URN/identifier in `evidence.subject`.
  const items: AuthEvidenceItemProps[] = authorizationEvidence.evidence.map((evidence, index) => {
    const grantType = GRANT_TYPE_TO_AUTH_EVIDENCE[evidence.grantType];
    return {
      id: `${grantType}-${index}-${evidence.subject}`,
      groupId: grantType,
      grantType,
      title: evidence.subject,
    };
  });

  const groups = {
    package: { title: t('dialog.access_info.access.via_access_package') },
    role: { title: t('dialog.access_info.access.via_role') },
    resource: { title: t('dialog.access_info.access.via_resource_delegation') },
    instance: { title: t('dialog.access_info.access.via_instance_delegation') },
  };

  return (
    <div className={styles.scrollableBody}>
      <Typography>
        <p>{t('dialog.access_info.intro')}</p>
      </Typography>
      <AuthEvidence
        owner={{ avatar: ownerAvatar, name: ownerDisplayName }}
        service={{ title: serviceResourceName }}
        items={items}
        groups={groups}
      />
      <Typography variant="subtle">
        {t('dialog.access_info.service.identifier_short', { id: serviceResource.id })}
      </Typography>
      <Typography>
        <p>{t('dialog.access_info.outro')}</p>
      </Typography>
    </div>
  );
};
