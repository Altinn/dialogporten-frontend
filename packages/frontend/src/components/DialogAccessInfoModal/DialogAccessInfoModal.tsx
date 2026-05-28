import {
  Avatar,
  type AvatarProps,
  DsParagraph,
  DsSpinner,
  Heading,
  SettingsModal,
  Typography,
} from '@altinn/altinn-components';
import { DialogLookupGrantType } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useDialogAccessInfo } from '../../api/hooks/useDialogAccessInfo.ts';
import { getAccessAMUILink } from '../../auth';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { getOrganizationByLocale } from '../../utils/organizations.ts';
import styles from './dialogAccessInfoModal.module.css';

interface DialogAccessInfoModalProps {
  dialogId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const GRANT_TYPE_ORDER: DialogLookupGrantType[] = [
  DialogLookupGrantType.AccessPackage,
  DialogLookupGrantType.Role,
  DialogLookupGrantType.ResourceDelegation,
  DialogLookupGrantType.InstanceDelegation,
];

const GRANT_TYPE_LABEL_KEY: Record<DialogLookupGrantType, string> = {
  [DialogLookupGrantType.AccessPackage]: 'dialog.access_info.access.via_access_package',
  [DialogLookupGrantType.Role]: 'dialog.access_info.access.via_role',
  [DialogLookupGrantType.ResourceDelegation]: 'dialog.access_info.access.via_resource_delegation',
  [DialogLookupGrantType.InstanceDelegation]: 'dialog.access_info.access.via_instance_delegation',
};

export const DialogAccessInfoModal = ({ dialogId, isOpen, onClose }: DialogAccessInfoModalProps) => {
  const { t, i18n } = useTranslation();
  const { accessInfo, isLoading, isError } = useDialogAccessInfo(dialogId, { enabled: isOpen });
  const { organizations } = useOrganizations();

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
      ]}
    >
      {isLoading ? (
        <DsSpinner aria-label={t('word.loading')} />
      ) : isError || !accessInfo ? (
        <DsParagraph>{t('dialog.access_info.error')}</DsParagraph>
      ) : (
        <DialogAccessInfoBody
          accessInfo={accessInfo}
          organizations={organizations ?? []}
          locale={i18n.language}
        />
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
  const serviceOwnerLocalizedName =
    getPreferredPropertyByLocale(serviceOwner.name)?.value || serviceOwner.code;
  const orgLookup = getOrganizationByLocale(organizations, serviceOwner.code, locale);
  const ownerDisplayName = orgLookup?.name || serviceOwnerLocalizedName;

  const ownerAvatar: AvatarProps = {
    type: 'company',
    name: ownerDisplayName,
    imageUrl: orgLookup?.logo || undefined,
  };

  const groupedEvidence = GRANT_TYPE_ORDER.map((grantType) => ({
    grantType,
    items: authorizationEvidence.evidence.filter((e) => e.grantType === grantType),
  })).filter((g) => g.items.length > 0);

  return (
    <div className={styles.body}>
      <Typography>
        <p>{t('dialog.access_info.intro')}</p>
      </Typography>

      <div className={styles.parent}>
        <Avatar {...ownerAvatar} size="md" />
        <div className={styles.parentText}>
          <Heading size="xs" as="h3">
            {ownerDisplayName}
          </Heading>
          <Heading size="xxs" as="p" variant="subtle" weight="normal">
            {serviceResourceName}
          </Heading>
        </div>
      </div>

      {groupedEvidence.length > 0 ? (
        <section className={styles.evidence}>
          {groupedEvidence.map(({ grantType, items }) => (
            <div key={grantType} className={styles.evidenceGroup}>
              <Heading size="xxs" as="h4" variant="subtle">
                {t(GRANT_TYPE_LABEL_KEY[grantType])}
              </Heading>
              <ul className={styles.evidenceList}>
                {items.map((item, index) => (
                  <li key={`${grantType}-${index}-${item.subject}`}>
                    <code>{item.subject}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <Heading size="xs" variant="subtle" weight="normal" as="p">
        {t('dialog.access_info.service.identifier_short', { id: serviceResource.id })}
      </Heading>
      <Typography>
        <p>{t('dialog.access_info.outro')}</p>
      </Typography>
    </div>
  );
};
