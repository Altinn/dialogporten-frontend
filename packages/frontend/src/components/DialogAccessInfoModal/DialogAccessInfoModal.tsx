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
import { useParties } from '../../api/hooks/useParties.ts';
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
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

const GRANT_TYPE_TO_AUTH_EVIDENCE: Record<DialogLookupGrantType, NonNullable<AuthEvidenceItemProps['grantType']>> = {
  [DialogLookupGrantType.AccessPackage]: 'package',
  [DialogLookupGrantType.Role]: 'role',
  [DialogLookupGrantType.ResourceDelegation]: 'resource',
  [DialogLookupGrantType.InstanceDelegation]: 'instance',
};

const FindInInboxLink = ({ href, ...props }: LinkProps & { href?: string }) => <Link {...props} to={href ?? ''} />;

export const DialogAccessInfoModal = ({ dialogId, title, isOpen, onClose }: DialogAccessInfoModalProps) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { accessInfo, isLoading, isError } = useDialogAccessInfo(dialogId, { enabled: isOpen });
  const { organizations } = useOrganizations();
  const { currentEndUser } = useParties();

  const accessManagementHref = currentEndUser?.partyUuid
    ? `${getAccessAMUILink()}/users/${currentEndUser.partyUuid}`
    : getAccessAMUILink();

  const findInInboxTo = accessInfo
    ? `${PageRoutes.inbox}${pruneSearchQueryParams(location.search, {
        [FilterCategory.SERVICE]: 'urn:altinn:resource:' + accessInfo.serviceResource.id,
      })}`
    : undefined;

  return (
    <SettingsModal
      variant="content"
      title={title}
      open={isOpen}
      onClose={onClose}
      buttons={[
        {
          as: 'a',
          href: accessManagementHref,
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
                as: FindInInboxLink,
                href: findInInboxTo,
                onClick: onClose,
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
        <DialogAccessInfoBody
          accessInfo={accessInfo}
          organizations={organizations ?? []}
          locale={i18n.language}
          dialogTitle={title}
        />
      )}
    </SettingsModal>
  );
};

interface DialogAccessInfoBodyProps {
  accessInfo: NonNullable<ReturnType<typeof useDialogAccessInfo>['accessInfo']>;
  organizations: Parameters<typeof getOrganizationByLocale>[0];
  locale: string;
  dialogTitle?: string;
}

const DialogAccessInfoBody = ({ accessInfo, organizations, locale, dialogTitle }: DialogAccessInfoBodyProps) => {
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

  const items: AuthEvidenceItemProps[] = authorizationEvidence.evidence.map((evidence, index) => {
    const grantType = GRANT_TYPE_TO_AUTH_EVIDENCE[evidence.grantType];
    /* Prefer an explicit name from the lookup. Otherwise, for instance/resource
     delegations we can reuse the dialog/service names we already have instead
    of falling back to the raw subject identifier. */
    let title = getPreferredPropertyByLocale(evidence.name)?.value;
    if (!title && evidence.grantType === DialogLookupGrantType.InstanceDelegation) {
      title = dialogTitle;
    } else if (!title && evidence.grantType === DialogLookupGrantType.ResourceDelegation) {
      title = serviceResourceName;
    }

    return {
      id: `${grantType}-${index}-${evidence.subject}`,
      groupId: grantType,
      grantType,
      title: title || evidence.subject,
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
      <Typography variant="subtle" size="sm">
        {t('dialog.access_info.service.identifier_short', { id: serviceResource.id })}
      </Typography>
      <Typography>
        <p>{t('dialog.access_info.outro')}</p>
      </Typography>
    </div>
  );
};
